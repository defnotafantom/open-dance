"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { studenteSchema, type StudenteInput } from "@/lib/studenti/schemas";

export type ActionResult = { error?: string };

export async function creaFiglio(input: StudenteInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (profile.ruolo !== "allievo") {
    return { error: "Non sei autorizzato ad aggiungere un iscritto." };
  }

  const parsed = studenteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("studenti").insert({
    ...parsed.data,
    genitore_id: profile.id,
    is_adulto: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/figli");
  revalidatePath("/area-genitore/orario");
  return {};
}

export async function aggiornaStudente(id: string, input: StudenteInput): Promise<ActionResult> {
  const parsed = studenteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("studenti")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Non autorizzato o studente non trovato." };
  }

  revalidatePath("/area-genitore/figli");
  revalidatePath("/admin/studenti");
  return {};
}

/** Aggiunge se stesso/a come iscritto/a (un solo record di questo tipo per account). */
export async function iscriviTeStesso(input: StudenteInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (profile.ruolo !== "allievo") {
    return { error: "Non sei autorizzato a iscriverti." };
  }

  const parsed = studenteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("studenti")
    .upsert(
      { ...parsed.data, profilo_id: profile.id, is_adulto: true },
      { onConflict: "profilo_id" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/figli");
  revalidatePath("/area-genitore/orario");
  return {};
}

export async function eliminaStudenteStaff(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("studenti").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/studenti");
  return {};
}
