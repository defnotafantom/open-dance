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
    .in("stato", ["richiesta", "attiva"])
    .maybeSingle();

  if (esistente) {
    return { error: "Esiste gia' un'iscrizione o una richiesta per questa classe." };
  }

  const { error } = await supabase.from("iscrizioni").insert({
    studente_id: studenteId,
    classe_id: classeId,
    stato: "richiesta",
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
