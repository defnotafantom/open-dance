"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getProfile, requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { error?: string };

export async function richiediCancellazioneDati(): Promise<ActionResult> {
  const profile = await getProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("richieste_cancellazione")
    .insert({ profilo_id: profile.id });

  if (error) {
    if (error.code === "23505") {
      return { error: "Hai gia' una richiesta di cancellazione in attesa." };
    }
    return { error: error.message };
  }

  revalidatePath("/area-genitore");
  return {};
}

export async function ritiraRichiestaCancellazione(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("richieste_cancellazione").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore");
  return {};
}

async function raccogliDatiPersonali(profiloId: string) {
  const supabase = await createClient();

  const [{ data: profilo }, { data: figliGenitore }, { data: figlioAdulto }] = await Promise.all([
    supabase.from("profiles").select("nome, cognome, email, telefono, ruolo, created_at").eq("id", profiloId).single(),
    supabase
      .from("studenti")
      .select("id, nome, cognome, data_nascita, codice_fiscale, is_adulto")
      .eq("genitore_id", profiloId),
    supabase
      .from("studenti")
      .select("id, nome, cognome, data_nascita, codice_fiscale, is_adulto")
      .eq("profilo_id", profiloId),
  ]);

  const studenti = [...(figliGenitore ?? []), ...(figlioAdulto ?? [])];
  const studenteIds = studenti.map((s) => s.id);

  const vuoto = { data: [] as Record<string, unknown>[] };
  const [{ data: iscrizioni }, { data: pagamenti }, { data: presenze }] =
    studenteIds.length > 0
      ? await Promise.all([
          supabase
            .from("iscrizioni")
            .select("id, classe_id, stato, data_iscrizione, quota_concordata")
            .in("studente_id", studenteIds),
          supabase
            .from("pagamenti")
            .select("id, tipo, importo_dovuto, importo_pagato, data_scadenza, data_pagamento, metodo, stato")
            .in("studente_id", studenteIds),
          supabase.from("presenze").select("id, lezione_id, stato, segnato_at").in("studente_id", studenteIds),
        ])
      : [vuoto, vuoto, vuoto];

  return {
    profilo,
    studenti,
    iscrizioni: iscrizioni ?? [],
    pagamenti: pagamenti ?? [],
    presenze: presenze ?? [],
  };
}

/** Diritto di accesso/portabilita' (GDPR art. 15/20): esporta tutti i dati collegati al proprio account. */
export async function esportaIMieiDati() {
  const profile = await getProfile();
  return raccogliDatiPersonali(profile.id);
}

/**
 * Evade una richiesta di cancellazione anonimizzando i dati identificativi
 * invece di cancellarli in blocco: iscrizioni e pagamenti storici restano
 * collegati agli studenti (obblighi di conservazione contabile), ma nome,
 * codice fiscale, contatti e documenti/note mediche vengono rimossi, e
 * l'account viene disabilitato lato Auth cosi' non e' piu' possibile
 * accedere. Cancellare del tutto la riga profilo romperebbe il vincolo
 * "un solo referente" su studenti gia' collegati ad altri fratelli/sorelle.
 */
export async function completaCancellazioneDati(richiestaId: string): Promise<ActionResult> {
  const staffProfile = await requireRuolo(RUOLI_TITOLARI);
  const admin = createAdminClient();

  const { data: richiesta } = await admin
    .from("richieste_cancellazione")
    .select("id, profilo_id, stato")
    .eq("id", richiestaId)
    .single();

  if (!richiesta) {
    return { error: "Richiesta non trovata." };
  }
  if (richiesta.stato !== "in_attesa") {
    return { error: "Questa richiesta e' gia' stata evasa o annullata." };
  }

  const profiloId = richiesta.profilo_id;

  const [{ data: figliGenitore }, { data: figlioAdulto }] = await Promise.all([
    admin.from("studenti").select("id").eq("genitore_id", profiloId),
    admin.from("studenti").select("id").eq("profilo_id", profiloId),
  ]);
  const studenteIds = [...(figliGenitore ?? []), ...(figlioAdulto ?? [])].map((s) => s.id);

  if (studenteIds.length > 0) {
    const { data: documenti } = await admin
      .from("documenti")
      .select("id, file_path")
      .in("studente_id", studenteIds);

    if (documenti && documenti.length > 0) {
      await admin.storage.from("documenti").remove(documenti.map((d) => d.file_path));
      await admin
        .from("documenti")
        .delete()
        .in("id", documenti.map((d) => d.id));
    }

    await admin.from("studenti_note_mediche").delete().in("studente_id", studenteIds);

    await admin
      .from("studenti")
      .update({ nome: "Iscritto", cognome: "cancellato", codice_fiscale: null })
      .in("id", studenteIds);
  }

  await admin
    .from("profiles")
    .update({
      nome: "Account",
      cognome: "cancellato",
      email: `cancellato-${profiloId}@opendance.invalid`,
      telefono: null,
    })
    .eq("id", profiloId);

  // Blocca l'accesso senza cancellare la riga auth.users: farlo
  // scatenerebbe la cascata su profiles -> studenti (SET NULL) e violerebbe
  // il vincolo che richiede esattamente un referente per studente.
  await admin.auth.admin.updateUserById(profiloId, {
    ban_duration: "876000h",
    password: randomUUID(),
  });

  await admin
    .from("richieste_cancellazione")
    .update({ stato: "completata", gestito_da: staffProfile.id, gestito_at: new Date().toISOString() })
    .eq("id", richiestaId);

  revalidatePath("/admin/impostazioni");
  return {};
}
