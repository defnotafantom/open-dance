"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-react";
import { vibrataConferma } from "@/lib/haptics";
import type { NavItem } from "@/components/layout/orb-nav";

export function DiegeticNav({
  items,
  aperto,
  onClose,
}: {
  items: NavItem[];
  aperto: boolean;
  onClose: () => void;
}) {
  const vicini = items.slice(0, 2);
  const lontani = items.slice(2);

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
            <Image
              src="/brand/od-glyph.png"
              alt=""
              width={52}
              height={34}
              className="drop-shadow-[0_10px_16px_color-mix(in_oklch,var(--primary),transparent_45%)]"
            />
            <h2 className="font-display text-xl uppercase tracking-tight">Dove vuoi andare?</h2>
            <p className="text-xs text-muted-foreground">Tocca una luce sul palco</p>
          </div>

          <div className="relative mt-auto flex flex-1 flex-col justify-end gap-10 overflow-hidden pb-16">
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

            <div className="relative flex flex-wrap items-end justify-center gap-6 px-6 opacity-85">
              {lontani.map((item) => (
                <PoolLink key={item.href} item={item} onClose={onClose} size={78} fontSize={10} />
              ))}
            </div>
            <div className="relative flex flex-wrap items-end justify-center gap-5 px-6">
              {vicini.map((item) => (
                <PoolLink key={item.href} item={item} onClose={onClose} size={108} fontSize={14} />
              ))}
            </div>
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
