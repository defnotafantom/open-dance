"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { ChevronRightIcon } from "lucide-react";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { Grain } from "@/components/marketing/grain";
import { vibrataConferma } from "@/lib/haptics";

const CHIAVE_SESSIONE = "od-splash-vista";
const LARGHEZZA_TRACCIA = 272;
const DIMENSIONE_MANIGLIA = 60;
const CORSA_MASSIMA = LARGHEZZA_TRACCIA - DIMENSIONE_MANIGLIA;
const SOGLIA_SBLOCCO = CORSA_MASSIMA * 0.82;

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
  const [sbloccato, setSbloccato] = useState(false);
  const [rimossa, setRimossa] = useState(false);
  const x = useMotionValue(0);
  const larghezzaRiempimento = useTransform(x, (v) => v + DIMENSIONE_MANIGLIA);

  function sblocca() {
    if (sbloccato) return;
    vibrataConferma();
    sessionStorage.setItem(CHIAVE_SESSIONE, "1");
    setSbloccato(true);
    animate(x, CORSA_MASSIMA, { type: "spring", stiffness: 260, damping: 26 });
    setTimeout(() => setRimossa(true), 750);
  }

  function alRilascioTrascinamento() {
    if (x.get() >= SOGLIA_SBLOCCO) {
      sblocca();
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 30 });
    }
  }

  if (giaVista || rimossa) return null;

  return (
    <div
      className="dark fixed inset-0 z-[200] flex flex-col items-center justify-center gap-16 overflow-hidden bg-background px-6 transition-opacity duration-500"
      style={{
        opacity: sbloccato ? 0 : 1,
        background:
          "radial-gradient(120% 70% at 50% -6%, oklch(0.32 0.006 60 / 60%) 0%, transparent 60%), radial-gradient(150% 100% at 50% 112%, oklch(0.03 0 0) 0%, oklch(0.1 0.004 60) 100%)",
      }}
    >
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[6%] mx-auto size-[520px] animate-[od-splash-pulse_3.6s_ease-in-out_infinite] rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 68%) 0%, color-mix(in oklch, var(--primary), transparent 90%) 45%, transparent 72%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <OdGlyphMark className="w-[230px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" />
        <div
          aria-hidden
          className="h-[18px] w-[170px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 72%)" }}
        />
        <span className="font-display text-sm tracking-[0.32em] text-foreground/70 uppercase">
          Open Dance
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <p className="text-xs tracking-[0.16em] text-foreground/50 uppercase">
          Trascina per sbloccare
        </p>
        <div
          className="relative flex items-center rounded-full bg-foreground/8 ring-1 ring-foreground/10"
          style={{ width: LARGHEZZA_TRACCIA, height: DIMENSIONE_MANIGLIA }}
        >
          <motion.div
            aria-hidden
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: larghezzaRiempimento,
              background:
                "linear-gradient(90deg, color-mix(in oklch, var(--primary), transparent 55%), var(--primary))",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-6 flex items-center gap-0.5 text-foreground/35"
          >
            <ChevronRightIcon className="size-4 animate-[od-splash-dot_1.4s_ease-in-out_infinite]" />
            <ChevronRightIcon
              className="-ml-2 size-4 animate-[od-splash-dot_1.4s_ease-in-out_infinite]"
              style={{ animationDelay: "0.15s" }}
            />
          </span>
          <motion.button
            type="button"
            aria-label="Trascina per sbloccare la schermata di accesso"
            drag="x"
            dragConstraints={{ left: 0, right: CORSA_MASSIMA }}
            dragElastic={0.04}
            dragMomentum={false}
            onDragEnd={alRilascioTrascinamento}
            onClick={sblocca}
            whileTap={{ scale: 0.94 }}
            style={{ x, width: DIMENSIONE_MANIGLIA, height: DIMENSIONE_MANIGLIA }}
            className="relative z-10 flex touch-none items-center justify-center rounded-full bg-gradient-to-br from-[#2c2c2c] to-[#0a0a0a] shadow-[0_10px_22px_-6px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)_inset]"
          >
            <OdGlyphMark className="w-6" />
          </motion.button>
        </div>
        <button
          type="button"
          onClick={sblocca}
          className="text-[11px] text-foreground/35 underline-offset-4 hover:text-foreground/60 hover:underline"
        >
          Salta
        </button>
      </div>
    </div>
  );
}
