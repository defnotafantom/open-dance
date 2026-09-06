"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Cursor } from "@/components/marketing/cursor";
import { Grain } from "@/components/marketing/grain";
import { Marquee } from "@/components/marketing/marquee";
import { Magnetic } from "@/components/marketing/magnetic";

const RIGHE_TITOLO = ["La tua scuola", "di danza,", "tutta in un posto."];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const heroLine = {
  hidden: { y: "100%" },
  show: { y: "0%", transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
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
  return (
    <main className="flex flex-1 flex-col cursor-none max-lg:cursor-auto">
      <Cursor />
      <Grain />

      <section className="dark relative flex flex-col items-center gap-10 overflow-hidden bg-background px-6 py-24 text-center text-foreground sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary), transparent 78%), transparent)",
          }}
        />
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative flex flex-col items-center gap-10"
        >
          <motion.div variants={heroItem}>
            <Logo size={40} />
          </motion.div>

          <div className="flex flex-col items-center gap-5">
            <motion.p
              variants={heroItem}
              className="text-xs font-semibold tracking-[0.3em] text-primary uppercase"
            >
              Since 1999
            </motion.p>
            <h1 className="max-w-3xl font-display text-5xl leading-[0.95] font-normal tracking-tight uppercase text-balance sm:text-7xl lg:text-8xl">
              {RIGHE_TITOLO.map((riga) => (
                <span key={riga} className="block overflow-hidden">
                  <motion.span variants={heroLine} className="block">
                    {riga}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p variants={heroItem} className="max-w-md text-base text-muted-foreground">
              Corsi, orari, iscrizioni, pagamenti e comunicazioni: tutto quello
              che prima girava tra telefonate e messaggi, ora a portata di mano.
            </motion.p>
          </div>

          <motion.div variants={heroItem} className="flex gap-4">
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
        </motion.div>
      </section>

      <Marquee text="Corsi — Orari — Iscrizioni — Pagamenti — Comunicazioni" />

      <section className="flex flex-col divide-y divide-border px-6 sm:px-12 lg:px-24">
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

      <footer className="dark mt-8 flex flex-col items-center gap-3 bg-sidebar px-6 py-10 text-sidebar-foreground/60">
        <Logo size={24} />
        <p className="text-xs">&copy; {new Date().getFullYear()} Open Dance &mdash; dal 1999</p>
      </footer>
    </main>
  );
}
