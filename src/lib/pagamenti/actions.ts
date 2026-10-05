"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { pagamentoSchema, calcolaStato, type PagamentoInput } from "@/lib/pagamenti/schemas";

export type ActionResult = { error?: string };

export async function registraPagamento(input: PagamentoInput): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const parsed = pagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del pagamento non validi." };
  }

  // Quanto e' stato pagato non si scrive qui: arriva dagli incassi
  // (versamenti), ognuno con la sua ricevuta.
  const { importo_dovuto, data_scadenza, tipo, studente_id, note } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("pagamenti").insert({
    studente_id,
    tipo,
    importo_dovuto,
    data_scadenza: data_scadenza || null,
    note: note || null,
    stato: calcolaStato({ importo_dovuto, importo_pagato: 0, data_scadenza }),
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
  await requireRuolo(RUOLI_STAFF);
  const parsed = pagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati del pagamento non validi." };
  }

  const supabase = await createClient();
  const { data: attuale } = await supabase
    .from("pagamenti")
    .select("importo_pagato")
    .eq("id", id)
    .maybeSingle();
  const { importo_dovuto, data_scadenza, tipo, studente_id, note } = parsed.data;
  const { error } = await supabase
    .from("pagamenti")
    .update({
      studente_id,
      tipo,
      importo_dovuto,
      data_scadenza: data_scadenza || null,
      note: note || null,
      stato: calcolaStato({
        importo_dovuto,
        importo_pagato: Number(attuale?.importo_pagato ?? 0),
        data_scadenza,
      }),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/pagamenti");
  revalidatePath("/area-genitore/pagamenti");
  return {};
}

export async function eliminaPagamento(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("pagamenti").delete().eq("id", id);

  if (error) {
    return {
      error: error.message.includes("versamenti")
        ? "Questa quota ha già delle ricevute: annulla prima le ricevute dal registro."
        : error.message,
    };
  }

  revalidatePath("/admin/pagamenti");
  revalidatePath("/admin/registri", "layout");
  return {};
}
