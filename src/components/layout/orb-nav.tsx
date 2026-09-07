"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { XIcon, SparklesIcon } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PushToggle } from "@/components/push-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { DiegeticNav } from "@/components/marketing/diegetic-nav";
import { vibrataConferma } from "@/lib/haptics";

export type NavItem = { href: string; label: string };

const LAYOUT_ID = "od-orb-nav";
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function OrbNav({
  nav,
  title,
  profile,
}: {
  nav: NavItem[];
  title?: string;
  profile?: { nome: string; cognome: string; email: string };
}) {
  const [aperto, setAperto] = useState(false);
  const [scenografica, setScenografica] = useState(false);
  const pathname = usePathname();

  function chiudi() {
    setAperto(false);
  }

  const iniziali = profile
    ? `${profile.nome[0] ?? ""}${profile.cognome[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <>
      <motion.button
        type="button"
        layoutId={LAYOUT_ID}
        onClick={() => {
          vibrataConferma();
          setAperto(true);
        }}
        aria-label="Apri il menu"
        className="fixed top-4 left-4 z-40 flex size-11 items-center justify-center rounded-full bg-card shadow-[0_10px_24px_-8px_color-mix(in_oklch,var(--primary),transparent_35%)] ring-1 ring-foreground/10"
        style={{ visibility: aperto ? "hidden" : "visible" }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      >
        <OdGlyphMark className="w-6" />
      </motion.button>

      <AnimatePresence>
        {aperto && (
          <motion.div
            layoutId={LAYOUT_ID}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background text-foreground"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="flex flex-1 flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5">
                <OdGlyphMark className="w-7" />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      vibrataConferma();
                      setScenografica(true);
                    }}
                    aria-label="Prova la versione scenografica"
                    className="flex size-9 items-center justify-center rounded-full bg-foreground/6"
                  >
                    <SparklesIcon className="size-4" />
                  </button>
                  <ThemeToggle />
                  <button
                    type="button"
                    onClick={chiudi}
                    aria-label="Chiudi il menu"
                    className="flex size-9 items-center justify-center rounded-full bg-foreground/6"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>

              {title && (
                <p className="px-5 pt-6 text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  {title}
                </p>
              )}

              <nav className="flex flex-col pt-2">
                {nav.map((item, i) => {
                  const attivo =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={chiudi}
                      className="group flex items-baseline gap-3 border-t border-foreground/8 px-5 py-3.5 first:border-t-0"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="font-display text-3xl uppercase tracking-tight transition-colors sm:text-4xl"
                        style={{ color: attivo ? "var(--primary)" : undefined }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {profile && (
                <div className="mt-auto flex flex-col gap-3 border-t border-foreground/8 p-5">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {iniziali || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {profile.nome} {profile.cognome}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <PushToggle />
                  <form action={logout}>
                    <Button type="submit" variant="outline" size="sm" className="w-full">
                      Esci
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DiegeticNav
        items={nav}
        aperto={scenografica}
        onClose={() => setScenografica(false)}
      />
    </>
  );
}
