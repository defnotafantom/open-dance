"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { GIORNI_ACCESSO } from "@/lib/manutenzione";

export async function decidiAccesso(
  id: string,
  decisione: "approvato" | "negato" | "revocato"
): Promise<{ error?: string }> {
  const profile = await requireRuolo(["webmaster"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("accessi_sito")
    .update({
      stato: decisione,
      deciso_at: new Date().toISOString(),
      deciso_da: profile.id,
      scade_at:
        decisione === "approvato"
          ? new Date(Date.now() + GIORNI_ACCESSO * 86400000).toISOString()
          : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/accessi");
  return {};
}
