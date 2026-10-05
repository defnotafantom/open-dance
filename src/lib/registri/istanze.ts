"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { credito, statoQuota } from "@/lib/registri/stato";

export type ActionResult = { error?: string };

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const istanzaSchema = z.object({
  nome: z.string().trim().min(1, { error: "Dai un nome all'istanza." }).max(120),
  descrizione: z.string().max(2000).optional(),
  importo_predefinito: z.number().min(0).nullable(),
  // null = nessuna scadenza
  scadenza: data.nullable(),
});

function aggiorna(istanzaId?: string) {
  revalidatePath("/admin/registri", "layout");
  if (istanzaId) revalidatePath(`/admin/registri/istanze/${istanzaId}`);
  revalidatePath("/area-genitore");
  revalidatePath("/area-genitore/pagamenti");
}

/** La data di creazione la mette il database (ora del server), non il telefono. */
export async function creaIstanza(input: unknown): Promise<{ error?: string; id?: string }> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const parsed = istanzaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };

  const supabase = await createClient();
  const { data: istanza, error } = await supabase
    .from("istanze")
    .insert({
      ...parsed.data,
      descrizione: parsed.data.descrizione || null,
      creato_da: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  aggiorna();
  return { id: istanza.id };
}

export async function aggiornaIstanza(id: string, input: unknown, chiusa: boolean): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = istanzaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("istanze")
    .update({ ...parsed.data, descrizione: parsed.data.descrizione || null, chiusa })
    .eq("id", id);
  if (error) return { error: error.message };

  // La scadenza dell'istanza vale per le voci che non ne hanno una propria.
  await supabase
    .from("pagamenti")
    .update({ data_scadenza: parsed.data.scadenza })
    .eq("istanza_id", id);

  aggiorna(id);
  return {};
}

const partecipantiSchema = z
  .array(z.object({ studente_id: z.uuid(), importo: z.number().min(0) }))
  .min(1, { error: "Scegli almeno un alunno." });

export async function aggiungiPartecipanti(istanzaId: string, input: unknown): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = partecipantiSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };

  const supabase = await createClient();
  const [{ data: istanza }, { data: esistenti }] = await Promise.all([
    supabase.from("istanze").select("nome, scadenza, chiusa").eq("id", istanzaId).maybeSingle(),
    supabase.from("pagamenti").select("studente_id").eq("istanza_id", istanzaId),
  ]);
  if (!istanza) return { error: "Istanza non trovata." };
  if (istanza.chiusa) return { error: "L'istanza è chiusa." };

  const gia = new Set((esistenti ?? []).map((e) => e.studente_id));
  const nuove = parsed.data
    .filter((p) => !gia.has(p.studente_id))
    .map((p) => ({
      studente_id: p.studente_id,
      tipo: "altro" as const,
      istanza_id: istanzaId,
      importo_dovuto: p.importo,
      data_scadenza: istanza.scadenza,
      note: istanza.nome,
      stato: statoQuota({ importo_dovuto: p.importo, importo_pagato: 0, data_scadenza: istanza.scadenza }),
    }));
  if (nuove.length === 0) return { error: "Gli alunni scelti sono già nell'istanza." };

  const { error } = await supabase.from("pagamenti").insert(nuove);
  if (error) return { error: error.message };

  aggiorna(istanzaId);
  return {};
}

/** Cambia quanto deve un alunno in questa istanza (dati variabili per alunno). */
export async function aggiornaDovuto(pagamentoId: string, importo: number, nota: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  if (!(importo >= 0)) return { error: "Importo non valido." };

  const supabase = await createClient();
  const { data: voce } = await supabase
    .from("pagamenti")
    .select("importo_pagato, data_scadenza, istanza_id")
    .eq("id", pagamentoId)
    .maybeSingle();
  if (!voce) return { error: "Voce non trovata." };

  const { error } = await supabase
    .from("pagamenti")
    .update({
      importo_dovuto: importo,
      note: nota.trim() || null,
      stato: statoQuota({
        importo_dovuto: importo,
        importo_pagato: Number(voce.importo_pagato),
        data_scadenza: voce.data_scadenza,
      }),
    })
    .eq("id", pagamentoId);
  if (error) return { error: error.message };

  aggiorna(voce.istanza_id ?? undefined);
  return {};
}

export async function rimuoviPartecipante(pagamentoId: string, istanzaId: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("pagamenti").delete().eq("id", pagamentoId);
  if (error) {
    return {
      error:
        error.message.includes("versamenti") || error.message.includes("rimborsi")
          ? "L'alunno ha già versato qualcosa: annulla prima le ricevute o i rimborsi."
          : error.message,
    };
  }
  aggiorna(istanzaId);
  return {};
}

const rimborsoSchema = z.object({
  pagamento_id: z.uuid(),
  importo: z.number().positive({ error: "Importo non valido." }),
  data,
  metodo: z.enum(["contanti", "bonifico", "pos", "altro"]),
  beneficiario: z.string().trim().min(1, { error: "Indica a chi restituisci." }).max(200),
  note: z.string().max(1000).optional(),
});

/** Restituzione di quanto versato in piu'. Non oltre l'eccedenza. */
export async function registraRimborso(input: unknown): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const parsed = rimborsoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };

  const supabase = await createClient();
  const { data: voce } = await supabase
    .from("pagamenti")
    .select("importo_dovuto, importo_pagato, importo_rimborsato, istanza_id")
    .eq("id", parsed.data.pagamento_id)
    .maybeSingle();
  if (!voce) return { error: "Voce non trovata." };

  const daRestituire = credito({
    importo_dovuto: Number(voce.importo_dovuto),
    importo_pagato: Number(voce.importo_pagato),
    importo_rimborsato: Number(voce.importo_rimborsato),
  });
  if (parsed.data.importo > daRestituire + 0.001) {
    return { error: `Si possono restituire al massimo €${daRestituire.toFixed(2)}.` };
  }

  const { error } = await supabase.from("rimborsi").insert({
    ...parsed.data,
    note: parsed.data.note || null,
    registrato_da: profile.id,
  });
  if (error) return { error: error.message };

  aggiorna(voce.istanza_id ?? undefined);
  return {};
}
