"use client";

import { useEffect } from "react";

/** Badging API: mostra il numero di comunicazioni non lette sull'icona
 * dell'app quando è installata su telefono (Android/desktop; iOS non la
 * supporta ancora) — no-op silenzioso altrove. */
export function AppBadge({ count }: { count: number }) {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else {
      navigator.clearAppBadge?.().catch(() => {});
    }
  }, [count]);

  return null;
}
