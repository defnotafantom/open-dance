"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { corsoSchema, classeSchema, type CorsoInput, type ClasseInput } from "@/lib/corsi/schemas";

export type ActionResult = { error?: string } | { error?: undefined };

export async function creaCorso(input: CorsoInput): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const parsed = corsoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del corso non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("corsi").insert(parsed.data);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/corsi");
  return {};
}

export async function aggiornaCorso(id: string, input: CorsoInput): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const parsed = corsoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del corso non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("corsi").update(parsed.data).eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/corsi");
  revalidatePath(`/admin/corsi/${id}`);
  return {};
}

export async function eliminaCorso(id: string): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const supabase = await createClient();
  const { error } = await supabase.from("corsi").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/corsi");
  return {};
}

export async function creaClasse(input: ClasseInput): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const parsed = classeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati della classe non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classi").insert(parsed.data);
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/corsi/${parsed.data.corso_id}`);
  revalidatePath("/area-genitore/orario");
  return {};
}

export async function aggiornaClasse(id: string, input: ClasseInput): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const parsed = classeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati della classe non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classi").update(parsed.data).eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/corsi/${parsed.data.corso_id}`);
  revalidatePath("/area-genitore/orario");
  return {};
}

export async function eliminaClasse(id: string, corsoId: string): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const supabase = await createClient();
  const { error } = await supabase.from("classi").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/corsi/${corsoId}`);
  revalidatePath("/area-genitore/orario");
  return {};
}
