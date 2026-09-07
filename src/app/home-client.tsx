"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Cursor } from "@/components/marketing/cursor";
import { Grain } from "@/components/marketing/grain";
import { Marquee } from "@/components/marketing/marquee";
import { Magnetic } from "@/components/marketing/magnetic";
import { DiegeticNav } from "@/components/marketing/diegetic-nav";
import { OrbNav, type NavItem } from "@/components/layout/orb-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_HOME: NavItem[] = [
  { href: "#punti-forza", label: "Perché noi" },
  { href: "/insegnanti", label: "Insegnanti" },
  { href: "/login", label: "Accedi" },
  { href: "/registrati", label: "Registrati" },
];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const PUNTI_FORZA = [
  {
    numero: "01",
    titolo: "Orari e iscrizioni",
    testo: "Corsi, classi e posti disponibili sempre aggiornati, iscrizione con un tocco.",
  },
  {
    numero: "02",
    titolo: "Pagamenti tracciati",
    testo: "Scadenze e quote sempre chiari, senza rincorrere ricevute e messaggi.",
  },
  {
    numero: "03",
    titolo: "Comunicazioni al posto giusto",
    testo: "Avvisi mirati per corso o classe, con notifiche invece di gruppi WhatsApp.",
  },
];

export function HomeClient() {
  const [scenografica, setScenografica] = useState(false);

  return (
    <main className="flex flex-1 flex-col cursor-none max-lg:cursor-auto">
      <Cursor />
      <Grain />

      <OrbNav nav={NAV_HOME} />
      <ThemeToggle className="fixed top-4 right-4 z-40" />

      <section className="relative flex flex-col items-center gap-8 overflow-hidden bg-background px-6 pt-28 pb-20 text-center text-foreground sm:pt-32 sm:pb-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-44 mx-auto size-[780px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 62%) 0%, color-mix(in oklch, var(--primary), transparent 86%) 32%, transparent 62%)",
          }}
        />
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative flex flex-col items-center gap-7"
        >
          <motion.div
            variants={heroItem}
            className="flex items-center justify-center"
            style={{ transform: "perspective(700px) rotateX(6deg) rotateY(-8deg)" }}
          >
            <Image
              src="/brand/od-glyph.png"
              alt="Open Dance"
              width={150}
              height={98}
              priority
              className="drop-shadow-[0_20px_26px_color-mix(in_oklch,var(--primary),transparent_45%)]"
            />
          </motion.div>
          <motion.div
            variants={heroItem}
            aria-hidden
            className="-mt-4 h-[18px] w-[130px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, color-mix(in oklch, var(--foreground), transparent 82%) 0%, transparent 72%)",
            }}
          />

          <div className="flex flex-col items-center gap-5">
            <motion.p
              variants={heroItem}
              className="text-xs font-semibold tracking-[0.32em] text-primary uppercase"
            >
              Open Dance &middot; dal 1999
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="max-w-3xl font-display text-6xl leading-[0.88] font-normal tracking-tight uppercase text-balance sm:text-7xl lg:text-8xl"
            >
              Fav
              <br />
              Place{" "}
              <span
                className="inline-block font-script text-primary normal-case"
                style={{ transform: "rotate(-4deg)" }}
              >
                to be
              </span>
            </motion.h1>
            <motion.p variants={heroItem} className="max-w-md text-base text-muted-foreground">
              Corsi, orari, iscrizioni, pagamenti e comunicazioni: tutto quello
              che prima girava tra telefonate e messaggi, ora a portata di mano.
            </motion.p>
          </div>

          <motion.div variants={heroItem} className="flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Button size="lg" nativeButton={false} render={<Link href="/login">Accedi</Link>} />
            </Magnetic>
            <Magnetic>
              <Button
                size="lg"
                nativeButton={false}
                variant="outline"
                render={<Link href="/registrati">Registrati</Link>}
              />
            </Magnetic>
          </motion.div>

          <motion.div variants={heroItem}>
            <button
              type="button"
              onClick={() => setScenografica(true)}
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Prova la versione scenografica del menu &rarr;
            </button>
          </motion.div>
        </motion.div>
      </section>

      <Marquee text="Corsi — Orari — Iscrizioni — Pagamenti — Comunicazioni" />

      <section id="punti-forza" className="flex flex-col divide-y divide-border px-6 sm:px-12 lg:px-24">
        {PUNTI_FORZA.map(({ numero, titolo, testo }, i) => (
          <motion.div
            key={numero}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="grid grid-cols-[auto_1fr] items-baseline gap-6 py-10 sm:grid-cols-[6rem_1fr_2fr] sm:gap-10"
          >
            <span className="font-display text-3xl text-primary sm:text-4xl">{numero}</span>
            <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{titolo}</h2>
            <p className="text-muted-foreground col-span-2 text-sm sm:col-span-1 sm:self-center sm:text-base">
              {testo}
            </p>
          </motion.div>
        ))}
      </section>

      <footer className="mt-8 flex flex-col items-center gap-3 bg-sidebar px-6 py-10 text-sidebar-foreground/60">
        <Logo size={24} />
        <p className="text-xs">&copy; {new Date().getFullYear()} Open Dance &mdash; dal 1999</p>
        <div className="flex gap-4 text-xs">
          <Link href="/insegnanti" className="hover:text-sidebar-foreground">
            Insegnanti
          </Link>
          <Link href="/login" className="hover:text-sidebar-foreground">
            Accesso staff
          </Link>
        </div>
      </footer>

      <DiegeticNav items={NAV_HOME} aperto={scenografica} onClose={() => setScenografica(false)} />
    </main>
  );
}
