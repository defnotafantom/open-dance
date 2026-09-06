import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidPronto = false;

function assicuraVapid(): boolean {
  if (vapidPronto) {
    return true;
  }
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return false;
  }
  webpush.setVapidDetails("mailto:info@opendance.local", publicKey, privateKey);
  vapidPronto = true;
  return true;
}

/**
 * Invia una notifica push ai profili indicati. Se le chiavi VAPID non sono
 * configurate (.env.local) non fa nulla, silenziosamente: le notifiche push
 * sono un extra, non devono far fallire l'azione principale (es. pubblicare
 * una comunicazione) se non sono ancora state attivate.
 */
export async function inviaPushAProfili(
  profiloIds: string[],
  payload: { title: string; body: string; url?: string }
) {
  if (profiloIds.length === 0 || !assicuraVapid()) {
    return;
  }

  const admin = createAdminClient();
  const { data: sottoscrizioni } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("profilo_id", profiloIds);

  if (!sottoscrizioni || sottoscrizioni.length === 0) {
    return;
  }

  const testo = JSON.stringify(payload);

  await Promise.all(
    sottoscrizioni.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          testo
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Sottoscrizione non piu' valida (permesso revocato, browser disinstallato...).
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}
