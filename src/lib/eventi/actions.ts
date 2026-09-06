"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { eventoSchema, type EventoInput } from "@/lib/eventi/schemas";

export type ActionResult = { error?: string };

export async function creaEvento(input: EventoInput): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = eventoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati dell'evento non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("eventi").insert(parsed.data);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/area-genitore/eventi");
  revalidatePath("/area-insegnante/eventi");
  return {};
}

export async function aggiornaEvento(id: string, input: EventoInput): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = eventoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati dell'evento non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("eventi").update(parsed.data).eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/area-genitore/eventi");
  revalidatePath("/area-insegnante/eventi");
  return {};
}

export async function eliminaEvento(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("eventi").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/eventi");
  revalidatePath("/area-genitore/eventi");
  revalidatePath("/area-insegnante/eventi");
  return {};
}
