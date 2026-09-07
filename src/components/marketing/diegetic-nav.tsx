"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-react";
import { vibrataConferma } from "@/lib/haptics";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import type { NavItem } from "@/components/layout/orb-nav";

function chunk<T>(items: T[], size: number): T[][] {
  const righe: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    righe.push(items.slice(i, i + size));
  }
  return righe;
}

export function DiegeticNav({
  items,
  aperto,
  onClose,
}: {
  items: NavItem[];
  aperto: boolean;
  onClose: () => void;
}) {
  // Righe di 3 al massimo: la prima riga (indice 0) è la più vicina/grande,
  // quelle successive si allontanano e rimpiccioliscono sul "palco".
  const righe = chunk(items, 3);

  return (
    <AnimatePresence>
      {aperto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="dark fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background text-foreground"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto size-[520px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 70%) 0%, transparent 62%)",
            }}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-foreground/8"
          >
            <XIcon className="size-4" />
          </button>

          <div className="relative flex flex-col items-center gap-2 pt-16">
            <OdGlyphMark className="w-13 drop-shadow-[0_10px_16px_color-mix(in_oklch,var(--primary),transparent_45%)]" />
            <h2 className="font-display text-xl uppercase tracking-tight">Dove vuoi andare?</h2>
            <p className="text-xs text-muted-foreground">Tocca una luce sul palco</p>
          </div>

          <div className="relative mt-auto flex flex-1 flex-col justify-end gap-8 overflow-hidden pb-16">
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, color-mix(in oklch, var(--foreground), transparent 95%) 0 1px, transparent 1px 56px), repeating-linear-gradient(90deg, color-mix(in oklch, var(--foreground), transparent 95%) 0 1px, transparent 1px 56px)",
                transform: "perspective(600px) rotateX(52deg)",
                transformOrigin: "bottom center",
              }}
            />

            {[...righe].reverse().map((riga, indiceInverso) => {
              const profondita = righe.length - 1 - indiceInverso;
              const size = Math.max(64, 112 - profondita * 18);
              const fontSize = Math.max(9, 15 - profondita * 2);
              return (
                <div
                  key={riga.map((i) => i.href).join("-")}
                  className="relative flex flex-wrap items-end justify-center gap-5 px-6"
                  style={{ opacity: Math.max(0.6, 1 - profondita * 0.15) }}
                >
                  {riga.map((item) => (
                    <PoolLink key={item.href} item={item} onClose={onClose} size={size} fontSize={fontSize} />
                  ))}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PoolLink({
  item,
  onClose,
  size,
  fontSize,
}: {
  item: NavItem;
  onClose: () => void;
  size: number;
  fontSize: number;
}) {
  return (
    <Link
      href={item.href}
      onClick={() => {
        vibrataConferma();
        onClose();
      }}
      className="flex shrink-0 flex-col items-center justify-center rounded-full text-center"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 45%) 0%, color-mix(in oklch, var(--primary), transparent 82%) 55%, transparent 78%)",
      }}
    >
      <span
        className="font-display uppercase tracking-tight text-foreground"
        style={{ fontSize, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
      >
        {item.label}
      </span>
    </Link>
  );
}
