"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assicuraQuotaIscrizione } from "@/lib/registri/servizi";
import { traccia } from "@/lib/attivita/traccia";
import { creaAccountFamiglia, nuovaPasswordFamiglia, type Credenziali } from "@/lib/iscritti/credenziali";
import { VERSIONE_INFORMATIVA_PRIVACY } from "@/lib/auth/schemas";
import { nomiClassi } from "@/lib/iscrizioni/classi";
import {
  iscrizioneManualeSchema,
  type IscrizioneManualeInput,
  type ReferenteTrovato,
} from "@/lib/staff/schemas";

export type ActionResult = { error?: string };

/**
 * Cerca un account "allievo" (genitore o allievo maggiorenne) per email, con
 * gli iscritti gia' collegati. Usata dal modulo di iscrizione manuale per
 * capire se il referente esiste gia' prima di crearne uno nuovo.
 */
export async function cercaReferentePerEmail(email: string): Promise<ReferenteTrovato | null> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();

  const { data: profilo } = await supabase
    .from("profiles")
    .select("id, nome, cognome, email")
    .eq("email", email.trim().toLowerCase())
    .eq("ruolo", "allievo")
    .maybeSingle();

  if (!profilo) return null;

  const [{ data: figliGenitore }, { data: figlioAdulto }] = await Promise.all([
    supabase.from("studenti").select("id, nome, cognome, is_adulto").eq("genitore_id", profilo.id),
    supabase.from("studenti").select("id, nome, cognome, is_adulto").eq("profilo_id", profilo.id),
  ]);

  return {
    ...profilo,
    figli: [...(figliGenitore ?? []), ...(figlioAdulto ?? [])],
  };
}

/**
 * Procedura completa di iscrizione fatta dalla segreteria: crea (se serve)
 * l'account della famiglia con codice e password generata, l'iscritto, le
 * iscrizioni alle classi e la quota d'iscrizione. Ogni passaggio finisce
 * nel registro attivita'. Le credenziali tornano una volta sola, da
 * consegnare alla famiglia: non vengono salvate in chiaro da nessuna parte.
 */
export async function creaIscrizioneManuale(
  input: IscrizioneManualeInput
): Promise<ActionResult & { studenteId?: string; credenziali?: Credenziali; inAttesa?: number }> {
  const profile = await requireRuolo(RUOLI_STAFF);

  const parsed = iscrizioneManualeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  const { referente, studente, classi_ids, quota_concordata } = parsed.data;
  const admin = createAdminClient();

  let referenteId: string;
  let credenziali: Credenziali | undefined;
  if (referente.modalita === "esistente") {
    referenteId = referente.referente_id;
  } else {
    const creato = await creaAccountFamiglia({
      email: referente.email.trim().toLowerCase(),
      nome: referente.nome,
      cognome: referente.cognome,
      telefono: referente.telefono,
    });
    if ("error" in creato) return { error: creato.error };
    referenteId = creato.id;
    credenziali = creato.credenziali;

    await admin.from("consensi_privacy").insert([
      {
        profilo_id: referenteId,
        tipo_consenso: "trattamento_dati",
        concesso: true,
        versione_informativa: VERSIONE_INFORMATIVA_PRIVACY,
      },
      {
        profilo_id: referenteId,
        tipo_consenso: "foto_video",
        concesso: referente.consenso_foto,
        versione_informativa: VERSIONE_INFORMATIVA_PRIVACY,
      },
    ]);
    await traccia(profile, "Account famiglia creato", {
      dettaglio: `${referente.nome} ${referente.cognome} · codice ${credenziali.codice} · privacy firmata · foto/video ${referente.consenso_foto ? "sì" : "no"}`,
    });
  }

  let studenteId: string;
  if (studente.tipo === "esistente") {
    studenteId = studente.studente_id;
  } else {
    const { data: nuovoStudente, error: studenteError } = await admin
      .from("studenti")
      .insert({
        nome: studente.nome,
        cognome: studente.cognome,
        data_nascita: studente.data_nascita,
        codice_fiscale: studente.codice_fiscale || null,
        is_adulto: studente.is_adulto,
        genitore_id: studente.is_adulto ? null : referenteId,
        profilo_id: studente.is_adulto ? referenteId : null,
        attivita: studente.attivita,
      })
      .select("id, numero_tessera")
      .single();

    if (studenteError || !nuovoStudente) {
      return { error: studenteError?.message ?? "Impossibile creare l'iscritto.", credenziali };
    }
    studenteId = nuovoStudente.id;
    await traccia(profile, "Nuovo iscritto", {
      studenteId,
      dettaglio: `Tessera n. ${nuovoStudente.numero_tessera ?? "—"} · ${studente.attivita}`,
    });
  }

  // Salta le classi a cui l'iscritto e' gia' iscritto (attivo o in attesa).
  const { data: giaIscritto } = await admin
    .from("iscrizioni")
    .select("classe_id")
    .eq("studente_id", studenteId)
    .in("stato", ["attiva", "richiesta"]);
  const gia = new Set((giaIscritto ?? []).map((i) => i.classe_id));
  const nuove = [...new Set(classi_ids)].filter((id) => !gia.has(id));

  // Classi piene: l'iscrizione va in lista d'attesa invece di superare la capienza.
  const { data: capienze } = await admin
    .from("classi")
    .select("id, capienza_max")
    .in("id", nuove.length ? nuove : ["00000000-0000-0000-0000-000000000000"]);
  const piene = new Set<string>();
  for (const c of capienze ?? []) {
    if (!c.capienza_max) continue;
    const { count } = await admin
      .from("iscrizioni")
      .select("id", { count: "exact", head: true })
      .eq("classe_id", c.id)
      .eq("stato", "attiva");
    if ((count ?? 0) >= c.capienza_max) piene.add(c.id);
  }
  const attive = nuove.filter((id) => !piene.has(id));
  const inAttesa = nuove.filter((id) => piene.has(id));

  if (nuove.length > 0) {
    const { error: iscrizioneError } = await admin.from("iscrizioni").insert(
      nuove.map((classe_id) => ({
        studente_id: studenteId,
        classe_id,
        stato: piene.has(classe_id) ? ("lista_attesa" as const) : ("attiva" as const),
        quota_concordata: quota_concordata ?? null,
      }))
    );
    if (iscrizioneError) {
      return { error: iscrizioneError.message, studenteId, credenziali };
    }
  }
  if (attive.length > 0) {
    await traccia(profile, "Iscritto ai corsi", {
      studenteId,
      dettaglio: (await nomiClassi(attive)).join(" · "),
    });
    await assicuraQuotaIscrizione(admin, studenteId);
  }
  if (inAttesa.length > 0) {
    await traccia(profile, "In lista d'attesa (classe piena)", {
      studenteId,
      dettaglio: (await nomiClassi(inAttesa)).join(" · "),
    });
  }

  revalidatePath("/admin/iscrizioni");
  revalidatePath("/admin/iscritti", "layout");
  revalidatePath("/admin/attivita");
  revalidatePath("/admin/registri", "layout");
  return { studenteId, credenziali, inAttesa: inAttesa.length };
}

/** Nuova password per l'account che gestisce questo iscritto. */
export async function rigeneraCredenziali(
  studenteId: string
): Promise<ActionResult & { credenziali?: Credenziali }> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const admin = createAdminClient();
  const { data: s } = await admin
    .from("studenti")
    .select("genitore_id, profilo_id")
    .eq("id", studenteId)
    .maybeSingle();
  const account = s?.genitore_id ?? s?.profilo_id;
  if (!account) return { error: "Questo iscritto non ha un account collegato." };

  const r = await nuovaPasswordFamiglia(account);
  if ("error" in r) return { error: r.error };

  await traccia(profile, "Nuova password generata", {
    studenteId,
    dettaglio: `Account ${r.credenziali.codice} (${r.credenziali.nome})`,
  });
  revalidatePath(`/admin/iscritti/${studenteId}`);
  revalidatePath("/admin/attivita");
  return { credenziali: r.credenziali };
}
