"use server";

import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

export async function salvaSottoscrizionePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<ActionResult> {
  const profile = await getProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profilo_id: profile.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function rimuoviSottoscrizionePush(endpoint: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    return { error: error.message };
  }

  return {};
}
