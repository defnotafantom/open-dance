"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pagamentoSchema, calcolaStato, type PagamentoInput } from "@/lib/pagamenti/schemas";

export type ActionResult = { error?: string };

export async function registraPagamento(input: PagamentoInput): Promise<ActionResult> {
  const profile = await requireRuolo(["admin", "staff"]);
  const parsed = pagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del pagamento non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pagamenti").insert({
    ...parsed.data,
    stato: calcolaStato(parsed.data),
    registrato_da: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/pagamenti");
  revalidatePath("/area-genitore/pagamenti");
  return {};
}

export async function aggiornaPagamento(id: string, input: PagamentoInput): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const parsed = pagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del pagamento non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pagamenti")
    .update({ ...parsed.data, stato: calcolaStato(parsed.data) })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/pagamenti");
  revalidatePath("/area-genitore/pagamenti");
  return {};
}

export async function eliminaPagamento(id: string): Promise<ActionResult> {
  await requireRuolo(["admin", "staff"]);
  const supabase = await createClient();
  const { error } = await supabase.from("pagamenti").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/pagamenti");
  return {};
}
