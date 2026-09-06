"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { impostazioniScuolaSchema, type ImpostazioniScuolaInput } from "@/lib/impostazioni/schemas";

export type ActionResult = { error?: string };

export async function aggiornaImpostazioniScuola(input: ImpostazioniScuolaInput): Promise<ActionResult> {
  await requireRuolo(RUOLI_TITOLARI);

  const parsed = impostazioniScuolaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("impostazioni_scuola")
    .update({
      nome_scuola: parsed.data.nome_scuola,
      anno_fondazione: parsed.data.anno_fondazione ?? null,
      indirizzo: parsed.data.indirizzo || null,
      telefono: parsed.data.telefono || null,
      email_contatto: parsed.data.email_contatto || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/impostazioni");
  return {};
}
