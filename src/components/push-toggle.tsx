"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { salvaSottoscrizionePush, rimuoviSottoscrizionePush } from "@/lib/push/actions";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const nessunaSottoscrizione = () => () => {};

// Capacita' del browser, non stato React: durante il render server questa
// API non esiste, quindi va letta con useSyncExternalStore (snapshot server
// fisso a false) invece che con uno stato impostato in un effetto, per
// evitare un mismatch di idratazione tra HTML del server e primo render client.
function useSupportaPush() {
  return useSyncExternalStore(
    nessunaSottoscrizione,
    () => "serviceWorker" in navigator && "PushManager" in window,
    () => false
  );
}

export function PushToggle() {
  const supportato = useSupportaPush();
  const [attivo, setAttivo] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supportato) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setAttivo(!!sub);
    });
  }, [supportato]);

  async function attiva() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      toast.error("Le notifiche non sono ancora state configurate dallo staff tecnico.");
      return;
    }

    setPending(true);
    try {
      const permesso = await Notification.requestPermission();
      if (permesso !== "granted") {
        toast.error("Permesso per le notifiche negato.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Sottoscrizione non valida.");
        return;
      }

      const result = await salvaSottoscrizionePush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setAttivo(true);
      toast.success("Notifiche attivate.");
    } finally {
      setPending(false);
    }
  }

  async function disattiva() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await rimuoviSottoscrizionePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setAttivo(false);
      toast.success("Notifiche disattivate.");
    } finally {
      setPending(false);
    }
  }

  if (!supportato) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={attivo ? disattiva : attiva}
      className="w-full"
    >
      {attivo ? "Disattiva notifiche" : "Attiva notifiche"}
    </Button>
  );
}
