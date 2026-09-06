"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

export async function confermaPresenza(
  lezioneId: string,
  studenteId: string,
  verra: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("conferme_presenza").upsert(
    {
      lezione_id: lezioneId,
      studente_id: studenteId,
      verra,
      confermato_at: new Date().toISOString(),
    },
    { onConflict: "lezione_id,studente_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/presenze");
  revalidatePath("/area-insegnante/presenze");
  return {};
}
