"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { ChevronRightIcon } from "lucide-react";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
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
  const pathname = usePathname();
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

  // Le pagine di stampa (ricevute) non devono mai essere coperte dalla splash.
  if (giaVista || rimossa || pathname.startsWith("/stampa") || pathname.startsWith("/manutenzione")) return null;

  return (
    <div
      className="dark fixed inset-0 z-[200] flex flex-col items-center justify-center gap-16 overflow-hidden bg-background px-6 text-foreground transition-opacity duration-500"
      style={{ opacity: sbloccato ? 0 : 1 }}
    >
      <div className="relative flex flex-col items-center gap-8">
        <div className="[perspective:800px]">
          <div className="animate-[od-ondeggia_8s_ease-in-out_infinite]">
            <OdGlyphMark estruso className="w-[230px] drop-shadow-[0_24px_20px_rgb(142_9_18/0.35)]" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="pl-[0.6em] font-wordmark text-lg tracking-[0.6em] uppercase">Open Dance</span>
          <span className="pl-[0.32em] font-display text-[0.65rem] tracking-[0.32em] text-muted-foreground uppercase">
            Since 1999
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <p className="font-display text-[0.7rem] tracking-[0.3em] text-muted-foreground uppercase">
          Trascina per sbloccare
        </p>
        <div
          className="panel-3d relative flex items-center rounded-full [--tile-d:4px]"
          style={{ width: LARGHEZZA_TRACCIA, height: DIMENSIONE_MANIGLIA }}
        >
          <motion.div
            aria-hidden
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: larghezzaRiempimento,
              background: "linear-gradient(90deg, rgb(227 18 31 / 25%), var(--red))",
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
            className="panel-3d tile-red relative z-10 flex touch-none items-center justify-center rounded-full [--tile-d:3px]"
          >
            <span className="font-display text-xs tracking-[0.1em]">OD</span>
          </motion.button>
        </div>
        <button
          type="button"
          onClick={sblocca}
          className="font-display text-[0.65rem] tracking-[0.25em] text-muted-foreground uppercase hover:text-foreground"
        >
          Salta
        </button>
      </div>
    </div>
  );
}
