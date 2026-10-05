"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { firmaValida } from "@/lib/accessi/firma";
import { GIORNI_ACCESSO } from "@/lib/manutenzione";

/** Decisione dal link della notifica: valida solo con la firma giusta. */
export async function decidiDaNotifica(
  id: string,
  firma: string,
  decisione: "approvato" | "negato"
): Promise<{ error?: string }> {
  if (!firmaValida(id, firma)) return { error: "Link non valido." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("accessi_sito")
    .update({
      stato: decisione,
      deciso_at: new Date().toISOString(),
      scade_at:
        decisione === "approvato"
          ? new Date(Date.now() + GIORNI_ACCESSO * 86400000).toISOString()
          : null,
    })
    .eq("id", id)
    .eq("stato", "in_attesa")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Questa richiesta è già stata decisa." };
  return {};
}
