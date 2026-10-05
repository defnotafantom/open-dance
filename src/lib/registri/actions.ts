"use server";

import { giornoRoma } from "@/lib/date";
import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  generaQuoteSchema,
  socioSchema,
  tariffaSchema,
  uscitaSchema,
  versamentoSchema,
  type SocioInput,
  type UscitaInput,
  type VersamentoInput,
} from "@/lib/registri/schemas";
import { nomeMese, stagioneDi } from "@/lib/registri/costanti";

export type ActionResult = { error?: string };

function aggiornaPagine() {
  revalidatePath("/admin/registri", "layout");
  revalidatePath("/admin/pagamenti");
  revalidatePath("/area-genitore/pagamenti");
}

// =========================================================
// Listino
// =========================================================

export async function salvaTariffa(input: unknown): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = tariffaSchema.safeParse(input);
  if (!parsed.success) return { error: "Dati del listino non validi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tariffe")
    .upsert(
      { ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "attivita,voce,stagione" }
    );
  if (error) return { error: error.message };

  aggiornaPagine();
  return {};
}

async function listino(stagione: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tariffe")
    .select("attivita, voce, importo")
    .eq("stagione", stagione);
  const prezzo = (attivita: "danza" | "fitness", voce: "iscrizione" | "mensile") =>
    data?.find((t) => t.attivita === attivita && t.voce === voce)?.importo ?? null;
  return prezzo;
}

// =========================================================
// Quote
// =========================================================

/**
 * Crea la quota del mese per ogni socio attivo che non ce l'ha ancora,
 * con il prezzo del listino della stagione. "Danza + Fitness" somma i due.
 */
export async function generaQuoteMese(
  input: unknown
): Promise<{ error?: string; create?: number; giaPresenti?: number; senzaPrezzo?: number }> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = generaQuoteSchema.safeParse(input);
  if (!parsed.success) return { error: "Mese non valido." };
  const { mese, giorno_scadenza } = parsed.data;

  const competenza = `${mese}-01`;
  const scadenza = `${mese}-${String(giorno_scadenza).padStart(2, "0")}`;
  const prezzo = await listino(stagioneDi(new Date(`${competenza}T12:00:00`)));

  const supabase = await createClient();
  const [{ data: soci }, { data: esistenti }] = await Promise.all([
    supabase.from("studenti").select("id, attivita").eq("attivo", true),
    supabase
      .from("pagamenti")
      .select("studente_id")
      .eq("tipo", "quota_corso")
      .eq("competenza", competenza),
  ]);
  const giaFatti = new Set((esistenti ?? []).map((p) => p.studente_id));

  let senzaPrezzo = 0;
  const nuove = [];
  for (const s of soci ?? []) {
    if (giaFatti.has(s.id)) continue;
    const danza = s.attivita !== "fitness" ? prezzo("danza", "mensile") : 0;
    const fitness = s.attivita !== "danza" ? prezzo("fitness", "mensile") : 0;
    if (danza == null || fitness == null) {
      senzaPrezzo += 1;
      continue;
    }
    nuove.push({
      studente_id: s.id,
      tipo: "quota_corso" as const,
      importo_dovuto: danza + fitness,
      competenza,
      data_scadenza: scadenza,
      note: `Quota mensile ${nomeMese(mese)}`,
    });
  }

  if (nuove.length > 0) {
    const { error } = await supabase.from("pagamenti").insert(nuove);
    if (error) return { error: error.message };
  }

  aggiornaPagine();
  return { create: nuove.length, giaPresenti: giaFatti.size, senzaPrezzo };
}

/** Quota di iscrizione annuale dal listino, per un socio. */
export async function creaQuotaIscrizione(studenteId: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data: socio } = await supabase
    .from("studenti")
    .select("attivita")
    .eq("id", studenteId)
    .maybeSingle();
  if (!socio) return { error: "Socio non trovato." };

  const stagione = stagioneDi();
  const prezzo = await listino(stagione);
  const danza = socio.attivita !== "fitness" ? prezzo("danza", "iscrizione") : 0;
  const fitness = socio.attivita !== "danza" ? prezzo("fitness", "iscrizione") : 0;
  if (danza == null || fitness == null) {
    return { error: `Manca il prezzo di iscrizione nel listino ${stagione}.` };
  }

  const { error } = await supabase.from("pagamenti").insert({
    studente_id: studenteId,
    tipo: "iscrizione_annuale",
    importo_dovuto: danza + fitness,
    data_scadenza: giornoRoma(),
    note: `Iscrizione stagione ${stagione}`,
  });
  if (error) return { error: error.message };

  aggiornaPagine();
  return {};
}

// =========================================================
// Incassi e ricevute
// =========================================================

export async function registraVersamento(
  input: VersamentoInput
): Promise<{ error?: string; id?: string }> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const parsed = versamentoSchema.safeParse(input);
  if (!parsed.success) return { error: "Dati dell'incasso non validi." };

  // Si puo' versare anche piu' del dovuto: l'eccedenza risulta "da
  // restituire" finche' non viene rimborsata.
  const supabase = await createClient();
  const { data: pagamento } = await supabase
    .from("pagamenti")
    .select("id")
    .eq("id", parsed.data.pagamento_id)
    .maybeSingle();
  if (!pagamento) return { error: "Quota non trovata." };

  const { data, error } = await supabase
    .from("versamenti")
    .insert({
      ...parsed.data,
      pagatore_codice_fiscale: parsed.data.pagatore_codice_fiscale?.toUpperCase() || null,
      note: parsed.data.note || null,
      // anno e numero della ricevuta li assegna il database
      registrato_da: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  aggiornaPagine();
  return { id: data.id };
}

export async function annullaVersamento(id: string, motivo: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  if (!motivo.trim()) return { error: "Indica il motivo dell'annullamento." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("versamenti")
    .update({ annullato: true, motivo_annullamento: motivo.trim() })
    .eq("id", id);
  if (error) return { error: error.message };

  aggiornaPagine();
  return {};
}

// =========================================================
// Soci
// =========================================================

export async function aggiornaSocio(id: string, input: SocioInput): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = socioSchema.safeParse(input);
  if (!parsed.success) return { error: "Dati del socio non validi." };

  const supabase = await createClient();
  const { error } = await supabase.from("studenti").update(parsed.data).eq("id", id);
  if (error) {
    return {
      error: error.message.includes("numero_tessera")
        ? "Questo numero di tessera è già assegnato a un altro socio."
        : error.message,
    };
  }

  aggiornaPagine();
  revalidatePath("/admin/studenti");
  return {};
}

// =========================================================
// Uscite
// =========================================================

export async function salvaUscita(id: string | null, input: UscitaInput): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const parsed = uscitaSchema.safeParse(input);
  if (!parsed.success) return { error: "Dati della spesa non validi." };

  const supabase = await createClient();
  const valori = { ...parsed.data, note: parsed.data.note || null };
  const { error } = id
    ? await supabase.from("uscite").update(valori).eq("id", id)
    : await supabase.from("uscite").insert({ ...valori, registrato_da: profile.id });
  if (error) return { error: error.message };

  aggiornaPagine();
  return {};
}

export async function eliminaUscita(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("uscite").delete().eq("id", id);
  if (error) return { error: error.message };

  aggiornaPagine();
  return {};
}
