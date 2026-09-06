"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };
export type StatoPresenza = "presente" | "assente" | "giustificato";

export async function segnaPresenza(
  lezioneId: string,
  studenteId: string,
  stato: StatoPresenza
): Promise<ActionResult> {
  const profile = await requireRuolo(["admin", "staff", "insegnante"]);
  const supabase = await createClient();

  const { error } = await supabase.from("presenze").upsert(
    {
      lezione_id: lezioneId,
      studente_id: studenteId,
      stato,
      segnato_da: profile.id,
      segnato_at: new Date().toISOString(),
    },
    { onConflict: "lezione_id,studente_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/area-insegnante/presenze/${lezioneId}`);
  return {};
}
