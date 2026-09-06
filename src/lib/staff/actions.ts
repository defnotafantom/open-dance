"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
 * Crea (se serve) il referente e/o l'iscritto e lo iscrive direttamente come
 * "attiva" a una classe, bypassando il flusso di richiesta/approvazione — ad
 * uso dello staff per registrare iscrizioni raccolte fuori dal sito (di
 * persona, telefono, ecc).
 */
export async function creaIscrizioneManuale(input: IscrizioneManualeInput): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);

  const parsed = iscrizioneManualeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }
  const { referente, studente, classe_id, quota_concordata } = parsed.data;
  const admin = createAdminClient();

  let referenteId: string;
  if (referente.modalita === "esistente") {
    referenteId = referente.referente_id;
  } else {
    const { data: invito, error: invitoError } = await admin.auth.admin.inviteUserByEmail(
      referente.email,
      {
        data: { nome: referente.nome, cognome: referente.cognome },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/area-genitore`,
      }
    );
    if (invitoError || !invito.user) {
      return { error: invitoError?.message ?? "Impossibile creare l'account del referente." };
    }
    referenteId = invito.user.id;
    await admin
      .from("profiles")
      .update({ nome: referente.nome, cognome: referente.cognome })
      .eq("id", referenteId);
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
      })
      .select("id")
      .single();

    if (studenteError || !nuovoStudente) {
      return { error: studenteError?.message ?? "Impossibile creare l'iscritto." };
    }
    studenteId = nuovoStudente.id;
  }

  const { error: iscrizioneError } = await admin.from("iscrizioni").insert({
    studente_id: studenteId,
    classe_id,
    stato: "attiva",
    quota_concordata: quota_concordata ?? null,
  });

  if (iscrizioneError) {
    return { error: iscrizioneError.message };
  }

  revalidatePath("/admin/iscrizioni");
  revalidatePath("/admin/studenti");
  return {};
}
