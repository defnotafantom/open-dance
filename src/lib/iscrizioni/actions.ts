"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

export async function richiediIscrizione(
  studenteId: string,
  classeId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: esistente } = await supabase
    .from("iscrizioni")
    .select("id")
    .eq("studente_id", studenteId)
    .eq("classe_id", classeId)
    .in("stato", ["richiesta", "attiva", "lista_attesa"])
    .maybeSingle();

  if (esistente) {
    return { error: "Esiste gia' un'iscrizione o una richiesta per questa classe." };
  }

  // Se la classe ha raggiunto la capienza massima, la richiesta va in lista
  // d'attesa invece che nella coda di approvazione ordinaria.
  const { data: classe } = await supabase
    .from("classi")
    .select("capienza_max")
    .eq("id", classeId)
    .single();

  let stato: "richiesta" | "lista_attesa" = "richiesta";
  if (classe?.capienza_max) {
    const { count } = await supabase
      .from("iscrizioni")
      .select("id", { count: "exact", head: true })
      .eq("classe_id", classeId)
      .eq("stato", "attiva");
    if ((count ?? 0) >= classe.capienza_max) {
      stato = "lista_attesa";
    }
  }

  const { error } = await supabase.from("iscrizioni").insert({
    studente_id: studenteId,
    classe_id: classeId,
    stato,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/orario");
  revalidatePath("/admin/iscrizioni");
  return {};
}

export async function ritiraRichiesta(iscrizioneId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("iscrizioni").delete().eq("id", iscrizioneId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/orario");
  revalidatePath("/admin/iscrizioni");
  return {};
}

export async function approvaIscrizione(iscrizioneId: string): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("iscrizioni")
    .update({ stato: "attiva" })
    .eq("id", iscrizioneId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/iscrizioni");
  revalidatePath("/area-genitore/orario");
  return {};
}

export async function rifiutaIscrizione(iscrizioneId: string): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const supabase = await createClient();
  const { error } = await supabase.from("iscrizioni").delete().eq("id", iscrizioneId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/iscrizioni");
  return {};
}
