"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { comunicazioneSchema, type ComunicazioneInput } from "@/lib/comunicazioni/schemas";
import type { RuoloEnum } from "@/lib/supabase/database.types";

export type ActionResult = { error?: string };

export async function pubblicaComunicazione(input: ComunicazioneInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!["admin", "staff", "insegnante"].includes(profile.ruolo)) {
    return { error: "Non sei autorizzato a pubblicare comunicazioni." };
  }

  const parsed = comunicazioneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { data: comunicazione, error } = await supabase
    .from("comunicazioni")
    .insert({
      titolo: parsed.data.titolo,
      corpo: parsed.data.corpo,
      autore_id: profile.id,
      pubblicato_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !comunicazione) {
    return { error: error?.message ?? "Impossibile pubblicare la comunicazione." };
  }

  if (parsed.data.target.tipo !== "tutti") {
    const target = parsed.data.target;
    const targetRow: {
      comunicazione_id: string;
      ruolo?: RuoloEnum;
      corso_id?: string;
      classe_id?: string;
    } = {
      comunicazione_id: comunicazione.id,
    };
    if (target.tipo === "ruolo") targetRow.ruolo = target.ruolo;
    if (target.tipo === "corso") targetRow.corso_id = target.corso_id;
    if (target.tipo === "classe") targetRow.classe_id = target.classe_id;

    const { error: targetError } = await supabase.from("comunicazioni_target").insert(targetRow);
    if (targetError) {
      // Rollback best-effort: senza il target la comunicazione resterebbe
      // visibile a tutti, il contrario di quanto richiesto.
      await supabase.from("comunicazioni").delete().eq("id", comunicazione.id);
      return { error: targetError.message };
    }
  }

  revalidatePath("/admin/comunicazioni");
  revalidatePath("/area-insegnante/comunicazioni");
  revalidatePath("/area-genitore/comunicazioni");
  return {};
}

export async function segnaComunicazioneLetta(comunicazioneId: string): Promise<ActionResult> {
  const profile = await getProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("letture_comunicazioni").upsert(
    { comunicazione_id: comunicazioneId, profilo_id: profile.id },
    { onConflict: "comunicazione_id,profilo_id", ignoreDuplicates: true }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
