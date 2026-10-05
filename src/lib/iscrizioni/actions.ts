"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { assicuraQuotaIscrizione } from "@/lib/registri/servizi";
import { traccia } from "@/lib/attivita/traccia";
import { nomeClasse } from "@/lib/iscrizioni/classi";

// Le iscrizioni le registra solo lo staff (Iscritti → Nuovo iscritto);
// qui si gestiscono quelle gia' esistenti. Ogni passaggio va nel registro.

export type ActionResult = { error?: string };

function aggiorna(studenteId: string) {
  revalidatePath("/admin/iscrizioni");
  revalidatePath(`/admin/iscritti/${studenteId}`);
  revalidatePath("/admin/attivita");
  revalidatePath("/area-genitore/orario");
  revalidatePath("/admin/registri", "layout");
}

/** Da lista d'attesa (o vecchia richiesta) ad attiva. */
export async function approvaIscrizione(iscrizioneId: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data: iscrizione, error } = await supabase
    .from("iscrizioni")
    .update({ stato: "attiva" })
    .eq("id", iscrizioneId)
    .select("studente_id, classe_id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Iscrizione attiva = socio della stagione: quota d'iscrizione dal listino.
  await assicuraQuotaIscrizione(supabase, iscrizione.studente_id);
  await traccia(profile, "Iscrizione attivata", {
    studenteId: iscrizione.studente_id,
    dettaglio: await nomeClasse(iscrizione.classe_id),
  });

  aggiorna(iscrizione.studente_id);
  return {};
}

export async function rifiutaIscrizione(iscrizioneId: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data: iscrizione, error } = await supabase
    .from("iscrizioni")
    .delete()
    .eq("id", iscrizioneId)
    .select("studente_id, classe_id")
    .single();
  if (error) {
    return { error: error.message };
  }

  await traccia(profile, "Richiesta di iscrizione rifiutata", {
    studenteId: iscrizione.studente_id,
    dettaglio: await nomeClasse(iscrizione.classe_id),
  });
  aggiorna(iscrizione.studente_id);
  return {};
}

/** Ritiro da un corso: l'iscrizione resta nello storico come terminata. */
export async function terminaIscrizione(iscrizioneId: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data: iscrizione, error } = await supabase
    .from("iscrizioni")
    .update({ stato: "terminata" })
    .eq("id", iscrizioneId)
    .select("studente_id, classe_id")
    .single();
  if (error) {
    return { error: error.message };
  }

  await traccia(profile, "Ritirato dal corso", {
    studenteId: iscrizione.studente_id,
    dettaglio: await nomeClasse(iscrizione.classe_id),
  });
  aggiorna(iscrizione.studente_id);
  return {};
}
