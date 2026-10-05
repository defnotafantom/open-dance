"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviaPushAProfili } from "@/lib/push/send";
import { IN_CODA } from "@/lib/lavori/voci";

export type ActionResult = { error?: string };

/** "Lo vorrei" su una voce in coda: un secondo clic ritira la richiesta. */
export async function alternaRichiesta(voce: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  if (!IN_CODA.some((v) => v.id === voce)) return { error: "Voce non trovata." };

  const supabase = await createClient();
  const { data: esistente } = await supabase
    .from("richieste_lavori")
    .select("id")
    .eq("voce", voce)
    .eq("profilo_id", profile.id)
    .maybeSingle();

  const { error } = esistente
    ? await supabase.from("richieste_lavori").delete().eq("id", esistente.id)
    : await supabase.from("richieste_lavori").insert({ voce, profilo_id: profile.id });
  if (error) return { error: error.message };

  revalidatePath("/admin/lavori");
  return {};
}

/** Proposta libera: arriva al webmaster anche come notifica. */
export async function proponi(testo: string): Promise<ActionResult> {
  const profile = await requireRuolo(RUOLI_STAFF);
  const pulito = testo.trim().slice(0, 2000);
  if (pulito.length < 3) return { error: "Scrivi cosa vorresti." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("richieste_lavori")
    .insert({ testo: pulito, profilo_id: profile.id });
  if (error) return { error: error.message };

  try {
    const { data: webmaster } = await createAdminClient()
      .from("profiles")
      .select("id")
      .eq("ruolo", "webmaster")
      .neq("id", profile.id);
    await inviaPushAProfili(
      (webmaster ?? []).map((w) => w.id),
      { title: "Nuova proposta per il sito", body: pulito.slice(0, 120), url: "/admin/lavori" }
    );
  } catch {
    // la notifica e' un extra
  }

  revalidatePath("/admin/lavori");
  return {};
}

export async function eliminaProposta(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { error } = await supabase.from("richieste_lavori").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/lavori");
  return {};
}

/** Solo il webmaster (lo impone anche il database). */
export async function segnaEvasa(id: string, evasa: boolean): Promise<ActionResult> {
  await requireRuolo(["webmaster"]);
  const supabase = await createClient();
  const { error } = await supabase.from("richieste_lavori").update({ evasa }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/lavori");
  return {};
}
