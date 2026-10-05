"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { Cursor } from "@/components/marketing/cursor";
import { Grain } from "@/components/marketing/grain";
import { Marquee } from "@/components/marketing/marquee";
import { Magnetic } from "@/components/marketing/magnetic";
import { DiegeticNav } from "@/components/marketing/diegetic-nav";
import { OrbNav, type NavItem } from "@/components/layout/orb-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_PUBBLICO, PublicFooter } from "@/components/marketing/public-page";
import { REGISTRAZIONI_APERTE } from "@/lib/registrazioni";
import { ANNI_SPECIALE, ANNO_FONDAZIONE, TAPPE_PERCORSO } from "@/lib/sito/costanti";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  CalendarCheckIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  WalletIcon,
} from "lucide-react";

export type DatiHome = {
  corsi: { nome: string; categoria: string | null; tappa: number | null }[];
  foto: { id: string; titolo: string; url: string }[];
  ambizioni: { id: string; titolo: string }[];
  traguardiRaccontati: number;
  insegnanti: { id: string; nome: string; specializzazioni: string | null; fotoUrl: string | null }[];
  posizioniAperte: number;
  contatti: { indirizzo: string | null; telefono: string | null; email: string | null };
};

const NAV_HOME: NavItem[] = [
  ...NAV_PUBBLICO.filter((i) => i.href !== "/"),
  ...(REGISTRAZIONI_APERTE ? [{ href: "/registrati", label: "Registrati" }] : []),
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

const comparsa = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: EASE_OUT_EXPO },
} as const;

/** Cosa trova nell'app chi e' gia' iscritto: il "perche'" del gestionale. */
const VANTAGGI_ISCRITTI = [
  { icona: CalendarCheckIcon, testo: "Orari, presenze e recuperi sempre aggiornati" },
  { icona: WalletIcon, testo: "Quote e scadenze chiare, senza rincorrere ricevute" },
  { icona: BellIcon, testo: "Avvisi della scuola con una notifica, non nei gruppi" },
];

export function HomeClient({
  dati,
  areaPersonale,
}: {
  dati: DatiHome;
  /** Per chi ha gia' fatto l'accesso: il link alla propria area. */
  areaPersonale: string | null;
}) {
  const [scenografica, setScenografica] = useState(false);

  const stili = [...new Set(dati.corsi.map((c) => c.categoria).filter(Boolean))] as string[];
  const testoMarquee =
    stili.length >= 2 ? stili.join(" — ") : "Danza — Palco — Crescita — Passione";
  const indirizzoMappa = dati.contatti.indirizzo
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Open Dance ${dati.contatti.indirizzo}`)}`
    : null;

  const numeri = [
    { valore: ANNI_SPECIALE, etichetta: "anni di danza" },
    dati.corsi.length > 0 && { valore: dati.corsi.length, etichetta: "corsi" },
    { valore: TAPPE_PERCORSO.length, etichetta: "tappe di crescita" },
    dati.insegnanti.length > 0 && { valore: dati.insegnanti.length, etichetta: "insegnanti" },
  ].filter(Boolean) as { valore: number; etichetta: string }[];

  return (
    <main className="flex flex-1 flex-col cursor-none max-lg:cursor-auto">
      <Cursor />
      <Grain />

      <OrbNav nav={NAV_HOME} />
      <ThemeToggle className="fixed top-4 right-4 z-40" />

      {/* ================= Apertura ================= */}
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
            <OdGlyphMark className="w-[150px] drop-shadow-[0_20px_26px_color-mix(in_oklch,var(--primary),transparent_45%)]" />
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
              Scuola di danza &middot; dal {ANNO_FONDAZIONE}
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
              Dai primi passi al palco: da {ANNI_SPECIALE} anni a Terme Vigliatore insegniamo
              danza a bambini, ragazzi e adulti, un passo alla volta.
            </motion.p>
          </div>

          <motion.div variants={heroItem} className="flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Button size="lg" nativeButton={false} render={<Link href="/corsi">Scopri i corsi</Link>} />
            </Magnetic>
            <Magnetic>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="#contatti">Vieni a trovarci</Link>}
              />
            </Magnetic>
          </motion.div>

          <motion.div variants={heroItem} className="flex items-center gap-4 text-sm">
            <Link
              href={areaPersonale ?? "/login"}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {areaPersonale ? "Vai alla tua area" : "Area riservata"} &rarr;
            </Link>
            <span aria-hidden className="text-muted-foreground/40">
              |
            </span>
            <button
              type="button"
              onClick={() => setScenografica(true)}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Menu scenografico
            </button>
          </motion.div>
        </motion.div>
      </section>

      <Marquee text={testoMarquee} />

      {/* ================= Numeri ================= */}
      <section
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `repeat(${numeri.length}, minmax(0, 1fr))` }}
      >
        {numeri.map((n, i) => (
          <motion.div
            key={n.etichetta}
            {...comparsa}
            transition={{ ...comparsa.transition, delay: i * 0.06 }}
            className="flex flex-col items-center gap-1 border-r border-border px-2 py-10 text-center last:border-r-0"
          >
            <span className="font-display text-4xl text-primary sm:text-6xl">{n.valore}</span>
            <span className="text-[0.65rem] font-medium tracking-[0.15em] text-muted-foreground uppercase sm:text-xs sm:tracking-[0.2em]">
              {n.etichetta}
            </span>
          </motion.div>
        ))}
      </section>

      {/* ================= Il percorso ================= */}
      <section className="px-6 py-16 sm:px-12 lg:px-24">
        <motion.div {...comparsa} className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
              Studiare danza, un passo alla volta
            </p>
            <h2 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-5xl">
              Il percorso
            </h2>
          </div>
          <LinkSezione href="/corsi">Tutti i corsi</LinkSezione>
        </motion.div>
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {TAPPE_PERCORSO.map((tappa, i) => {
            const corsiTappa = dati.corsi.filter((c) => c.tappa === tappa.value);
            return (
              <motion.div
                key={tappa.value}
                {...comparsa}
                transition={{ ...comparsa.transition, delay: i * 0.08 }}
                className="w-[78%] shrink-0 snap-start sm:w-auto"
              >
                <Link
                  href="/corsi"
                  className="group flex h-full flex-col gap-3 rounded-xl panel-3d p-6 transition-transform hover:-translate-y-1"
                >
                  <span className="font-display text-5xl text-primary">{tappa.value}</span>
                  <h3 className="font-display text-2xl uppercase tracking-tight group-hover:text-primary">
                    {tappa.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tappa.descrizione}</p>
                  {corsiTappa.length > 0 && (
                    <p className="mt-auto pt-2 text-sm font-medium">
                      {corsiTappa.map((c) => c.nome).join(" · ")}
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ================= Speciale 28 anni ================= */}
      <section className="dark relative overflow-hidden bg-background px-6 py-20 text-foreground sm:px-12 lg:px-24">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -bottom-40 size-[620px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 65%) 0%, transparent 65%)",
          }}
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <motion.div {...comparsa} className="flex flex-col">
            <span className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
              {ANNO_FONDAZIONE} — {ANNO_FONDAZIONE + ANNI_SPECIALE}
            </span>
            <span className="font-display text-[9rem] leading-none text-primary sm:text-[12rem]">
              {ANNI_SPECIALE}
            </span>
            <span className="font-display text-3xl uppercase tracking-tight">anni di Open Dance</span>
          </motion.div>
          <motion.div {...comparsa} className="flex flex-col gap-6">
            <p className="max-w-xl text-lg text-muted-foreground">
              Concorsi, contest, trasferte e palchi: ma soprattutto le persone che siamo diventati
              lungo la strada. La nostra storia raccontata oltre i premi.
            </p>
            {dati.ambizioni.length > 0 && (
              <ul className="flex flex-col divide-y divide-border border-y border-border">
                {dati.ambizioni.slice(0, 3).map((a, i) => (
                  <li key={a.id} className="flex items-baseline gap-4 py-3">
                    <span className="font-mono text-xs text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-xl uppercase tracking-tight">{a.titolo}</span>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <Button nativeButton={false} render={<Link href="/28-anni">Scopri lo Speciale</Link>} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= La scuola ================= */}
      <section className="py-16">
        <motion.div
          {...comparsa}
          className="mb-8 flex flex-wrap items-end justify-between gap-4 px-6 sm:px-12 lg:px-24"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
              Via IV Novembre, Terme Vigliatore
            </p>
            <h2 className="mt-2 font-display text-4xl uppercase tracking-tight sm:text-5xl">
              La scuola
            </h2>
          </div>
          <LinkSezione href="/scuola">Entra nella scuola</LinkSezione>
        </motion.div>
        {dati.foto.length > 0 ? (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:px-12 lg:px-24">
            {dati.foto.map((f) => (
              <Link
                key={f.id}
                href="/scuola"
                className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[42%] lg:w-[30%]"
              >
                <div className="aspect-[4/5] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.titolo}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 font-display text-lg uppercase tracking-tight text-white">
                  {f.titolo}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-6 text-sm text-muted-foreground sm:px-12 lg:px-24">
            Le foto della scuola arriveranno presto.
          </p>
        )}
      </section>

      {/* ================= Insegnanti ================= */}
      {dati.insegnanti.length > 0 && (
        <section className="border-t border-border px-6 py-16 sm:px-12 lg:px-24">
          <motion.div {...comparsa} className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">
              Chi ti insegna
            </h2>
            <LinkSezione href="/insegnanti">Tutti gli insegnanti</LinkSezione>
          </motion.div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {dati.insegnanti.map((i) => (
              <Link key={i.id} href={`/insegnanti/${i.id}`} className="group flex flex-col gap-3">
                <div className="aspect-square overflow-hidden rounded-full bg-muted">
                  {i.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.fotoUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display text-4xl text-muted-foreground/40 uppercase">
                      {i.nome.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-display text-lg uppercase tracking-tight group-hover:text-primary">
                    {i.nome}
                  </p>
                  {i.specializzazioni && (
                    <p className="text-xs text-muted-foreground">{i.specializzazioni}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= Lavora con noi ================= */}
      <section className="border-t border-border px-6 py-14 sm:px-12 lg:px-24">
        <motion.div {...comparsa}>
          <Link
            href="/lavora-con-noi"
            className="group flex flex-col gap-4 rounded-2xl panel-3d p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
                {dati.posizioniAperte > 0
                  ? `${dati.posizioniAperte} ${dati.posizioniAperte === 1 ? "posizione aperta" : "posizioni aperte"}`
                  : "Candidature sempre aperte"}
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-tight sm:text-4xl">
                Vuoi lavorare con noi?
              </h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Staff, insegnanti esterni, masterclass: mandaci il tuo CV.
              </p>
            </div>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-1">
              <ArrowRightIcon className="size-6" />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* ================= Contatti + area riservata ================= */}
      <section
        id="contatti"
        className="grid scroll-mt-16 gap-10 border-t border-border px-6 py-16 sm:px-12 lg:grid-cols-2 lg:px-24"
      >
        <motion.div {...comparsa} className="flex flex-col gap-5">
          <h2 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">
            Vieni a{" "}
            <span className="font-script text-primary normal-case">trovarci</span>
          </h2>
          <p className="max-w-md text-muted-foreground">
            Passa in sede o scrivici: ti aiutiamo a scegliere il corso giusto, anche con una
            lezione di prova.
          </p>
          <div className="flex flex-col gap-3">
            {dati.contatti.indirizzo && (
              <a
                href={indirizzoMappa ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-primary"
              >
                <MapPinIcon className="size-5 text-primary" /> {dati.contatti.indirizzo}
              </a>
            )}
            {dati.contatti.telefono && (
              <a href={`tel:${dati.contatti.telefono}`} className="flex items-center gap-3 hover:text-primary">
                <PhoneIcon className="size-5 text-primary" /> {dati.contatti.telefono}
              </a>
            )}
            {dati.contatti.email && (
              <a href={`mailto:${dati.contatti.email}`} className="flex items-center gap-3 hover:text-primary">
                <MailIcon className="size-5 text-primary" /> {dati.contatti.email}
              </a>
            )}
          </div>
        </motion.div>

        <motion.div {...comparsa} className="flex flex-col gap-5 rounded-2xl panel-3d p-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
              Sei già dei nostri?
            </p>
            <h3 className="mt-2 font-display text-3xl uppercase tracking-tight">Area riservata</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Famiglie, allievi, insegnanti e staff: tutta la scuola in tasca, installabile sul
              telefono come un&apos;app.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {VANTAGGI_ISCRITTI.map(({ icona: Icona, testo }) => (
              <li key={testo} className="flex items-center gap-3 text-sm">
                <Icona className="size-5 shrink-0 text-primary" />
                {testo}
              </li>
            ))}
          </ul>
          <div>
            <Button
              nativeButton={false}
              render={
                <Link href={areaPersonale ?? "/login"}>
                  {areaPersonale ? "Vai alla tua area" : "Accedi"}
                </Link>
              }
            />
          </div>
        </motion.div>
      </section>

      <PublicFooter />

      <DiegeticNav items={NAV_HOME} aperto={scenografica} onClose={() => setScenografica(false)} />
    </main>
  );
}

function LinkSezione({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      {children}
      <ArrowUpRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}
