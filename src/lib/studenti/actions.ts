"use server";

import { revalidatePath } from "next/cache";
import { getProfile, requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { studenteSchema, type StudenteInput } from "@/lib/studenti/schemas";
import { traccia } from "@/lib/attivita/traccia";

export type ActionResult = { error?: string };

export async function aggiornaStudente(id: string, input: StudenteInput): Promise<ActionResult> {
  const parsed = studenteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const profile = await getProfile();
  const supabase = await createClient();
  const { data: prima } = await supabase
    .from("studenti")
    .select("nome, cognome, data_nascita, codice_fiscale")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("studenti")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Non autorizzato o studente non trovato." };
  }

  // Anche le correzioni fatte dalla famiglia finiscono nella storia.
  const cambi = prima
    ? (Object.keys(parsed.data) as (keyof typeof parsed.data)[])
        .filter((k) => (prima[k] ?? "") !== (parsed.data[k] ?? ""))
        .map((k) => `${k.replace("_", " ")}: ${prima[k] || "—"} → ${parsed.data[k] || "—"}`)
    : [];
  if (cambi.length > 0) {
    await traccia(profile, RUOLI_STAFF.includes(profile.ruolo) ? "Dati modificati" : "Dati modificati dalla famiglia", {
      studenteId: id,
      dettaglio: cambi.join(" · "),
    });
  }

  revalidatePath("/area-genitore/figli");
  revalidatePath("/admin/iscritti", "layout");
  return {};
}

export async function eliminaStudenteStaff(id: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data: s } = await supabase
    .from("studenti")
    .select("nome, cognome, numero_tessera")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("studenti").delete().eq("id", id);
  if (error) {
    return {
      error: error.message.includes("versamenti")
        ? "Ci sono ricevute emesse: un iscritto con incassi non si cancella, si segna come non attivo."
        : error.message,
    };
  }

  await traccia(profile, "Iscritto eliminato", {
    dettaglio: s ? `${s.nome} ${s.cognome} · tessera n. ${s.numero_tessera ?? "—"}` : null,
  });
  revalidatePath("/admin/iscritti", "layout");
  revalidatePath("/admin/attivita");
  return {};
}
