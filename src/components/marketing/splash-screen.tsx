"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";

const CHIAVE_SESSIONE = "od-splash-vista";

function subscribeNoop() {
  return () => {};
}
function leggiGiaVista() {
  return sessionStorage.getItem(CHIAVE_SESSIONE) === "1";
}
function leggiGiaVistaServer() {
  // Sul server non si puo' sapere: si assume "gia' vista" cosi' il primo
  // render client (prima dell'idratazione) combacia, evitando un flash.
  return true;
}

export function SplashScreen() {
  const giaVista = useSyncExternalStore(subscribeNoop, leggiGiaVista, leggiGiaVistaServer);
  const [uscita, setUscita] = useState(false);
  const [rimossa, setRimossa] = useState(false);

  useEffect(() => {
    if (giaVista) return;
    sessionStorage.setItem(CHIAVE_SESSIONE, "1");

    const timerUscita = setTimeout(() => setUscita(true), 1500);
    const timerRimuovi = setTimeout(() => setRimossa(true), 1900);
    return () => {
      clearTimeout(timerUscita);
      clearTimeout(timerRimuovi);
    };
  }, [giaVista]);

  if (giaVista || rimossa) return null;

  return (
    <div
      className="dark fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-400"
      style={{
        opacity: uscita ? 0 : 1,
        background:
          "radial-gradient(120% 90% at 50% 38%, oklch(0.2 0 0) 0%, oklch(0.09 0 0) 62%, oklch(0.06 0 0) 100%)",
      }}
      aria-hidden
    >
      <div className="relative flex size-[420px] max-w-[90vw] items-center justify-center">
        <div className="absolute size-full animate-[od-splash-pulse_2.6s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary),transparent_55%)_0%,color-mix(in_oklch,var(--primary),transparent_86%)_45%,transparent_70%)]" />
        <div
          className="absolute size-[260px] animate-[od-splash-ring_2.2s_linear_infinite] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0%, var(--primary) 12%, transparent 30%)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
        />
        <Image
          src="/brand/od-glyph.png"
          alt=""
          width={172}
          height={112}
          priority
          className="relative animate-[od-splash-spin_4.8s_ease-in-out_infinite] drop-shadow-[0_24px_32px_color-mix(in_oklch,var(--primary),transparent_40%)]"
        />
      </div>
      <span className="relative -mt-6 font-display text-sm tracking-[0.3em] text-foreground/75 uppercase">
        Open Dance
      </span>
      <div className="relative mt-5 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-[od-splash-dot_1.3s_ease-in-out_infinite] rounded-full bg-primary"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
