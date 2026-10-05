"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";
import { OrbNav, type NavItem } from "@/components/layout/orb-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Eyebrow, NAV_PUBBLICO, PublicFooter } from "@/components/marketing/public-page";
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

const EASE = [0.16, 1, 0.3, 1] as const;

/** Unica animazione d'ingresso: i tasselli salgono in posizione. */
const sale = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.6, ease: EASE },
} as const;

function ritardo(i: number) {
  return { ...sale, transition: { ...sale.transition, delay: i * 0.07 } };
}

const VANTAGGI_ISCRITTI = [
  { icona: CalendarCheckIcon, testo: "Orari, presenze e recuperi" },
  { icona: WalletIcon, testo: "Quote e scadenze" },
  { icona: BellIcon, testo: "Avvisi con una notifica" },
];

export function HomeClient({
  dati,
  areaPersonale,
}: {
  dati: DatiHome;
  /** Per chi ha gia' fatto l'accesso: il link alla propria area. */
  areaPersonale: string | null;
}) {
  const indirizzoMappa = dati.contatti.indirizzo
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Open Dance ${dati.contatti.indirizzo}`)}`
    : null;

  const numeri = [
    { valore: ANNI_SPECIALE, etichetta: "anni" },
    dati.corsi.length > 0 && { valore: dati.corsi.length, etichetta: "corsi" },
    { valore: TAPPE_PERCORSO.length, etichetta: "tappe" },
    dati.insegnanti.length > 0 && { valore: dati.insegnanti.length, etichetta: "insegnanti" },
  ].filter(Boolean) as { valore: number; etichetta: string }[];

  return (
    <main className="flex flex-1 flex-col">
      <OrbNav nav={NAV_HOME} />
      <ThemeToggle className="fixed top-4 right-4 z-40" />

      {/* ================= Apertura ================= */}
      <section className="flex flex-col items-center px-6 pt-28 pb-16 text-center sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="[perspective:800px]"
        >
          <div className="animate-[od-ondeggia_8s_ease-in-out_infinite]">
            <OdGlyphMark
              estruso
              className="w-[210px] drop-shadow-[0_22px_18px_rgb(142_9_18/0.3)] sm:w-[260px]"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-9 flex flex-col items-center gap-1.5"
        >
          <p className="pl-[0.6em] font-wordmark text-lg tracking-[0.6em] uppercase">Open Dance</p>
          <p className="pl-[0.32em] font-display text-[0.65rem] tracking-[0.32em] text-muted-foreground uppercase">
            Since {ANNO_FONDAZIONE}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <h1 className="font-display text-5xl leading-[0.9] uppercase sm:text-7xl">
            Fav place <em className="font-wordmark text-primary italic">to be</em>
          </h1>
          <p className="max-w-xs text-muted-foreground">
            Scuola di danza a Terme Vigliatore. Dai primi passi al palco.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/corsi">Scopri i corsi</Link>} />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="#contatti">Contatti</Link>}
            />
          </div>
          <Link
            href={areaPersonale ?? "/login"}
            className="mt-1 font-display text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
          >
            {areaPersonale ? "Vai alla tua area" : "Area riservata"} &rarr;
          </Link>
        </motion.div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-5 pb-20 sm:px-8">
        {/* ================= Numeri ================= */}
        <section
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${numeri.length}, minmax(0, 1fr))` }}
        >
          {numeri.map((n, i) => (
            <motion.div
              key={n.etichetta}
              {...ritardo(i)}
              className="panel-3d flex flex-col items-center rounded-xl py-4"
            >
              <span className="font-display text-4xl leading-none sm:text-5xl">{n.valore}</span>
              <span className="mt-1 font-display text-[0.6rem] tracking-[0.25em] text-muted-foreground uppercase">
                {n.etichetta}
              </span>
            </motion.div>
          ))}
        </section>

        {/* ================= Il percorso ================= */}
        <section className="flex flex-col gap-5">
          <TitoloSezione eyebrow="Un passo alla volta" titolo="Il percorso" href="/corsi" link="Tutti i corsi" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {TAPPE_PERCORSO.map((tappa, i) => {
              const ultima = i === TAPPE_PERCORSO.length - 1;
              const corsiTappa = dati.corsi.filter((c) => c.tappa === tappa.value);
              return (
                <motion.div key={tappa.value} {...ritardo(i)}>
                  <Link
                    href="/corsi"
                    className={`panel-3d tile-press flex h-full min-h-40 flex-col justify-between gap-4 rounded-xl p-4 sm:p-5 ${ultima ? "tile-ink" : ""}`}
                  >
                    <span className="font-display text-4xl leading-none">{tappa.value}</span>
                    <div>
                      <p className="font-display text-lg leading-none uppercase">{tappa.label}</p>
                      {corsiTappa.length > 0 && (
                        <p className="mt-1.5 text-xs opacity-70">
                          {corsiTappa.map((c) => c.nome).join(" · ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ================= Speciale 28 anni ================= */}
        <motion.section {...sale}>
          <Link
            href="/28-anni"
            className="panel-3d tile-ink tile-press flex flex-col gap-6 rounded-xl p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8"
          >
            <div className="flex flex-col gap-3">
              <p className="font-display text-[0.7rem] tracking-[0.32em] uppercase opacity-60">
                {ANNO_FONDAZIONE} — {ANNO_FONDAZIONE + ANNI_SPECIALE}
              </p>
              <p className="font-display text-3xl leading-none uppercase sm:text-4xl">
                Anni di
                <br />
                Open Dance
              </p>
              {dati.ambizioni.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 text-sm opacity-75">
                  {dati.ambizioni.slice(0, 2).map((a) => (
                    <li key={a.id}>— {a.titolo}</li>
                  ))}
                </ul>
              )}
              <span className="mt-2 flex items-center gap-1.5 font-display text-xs tracking-[0.2em] uppercase">
                Scopri lo Speciale <ArrowRightIcon className="size-4" />
              </span>
            </div>
            <span className="text-estruso self-end font-display text-[8.5rem] leading-[0.8] sm:text-[11rem]">
              {ANNI_SPECIALE}
            </span>
          </Link>
        </motion.section>

        {/* ================= La scuola ================= */}
        <section className="flex flex-col gap-5">
          <TitoloSezione eyebrow="Terme Vigliatore" titolo="La scuola" href="/scuola" link="Entra" />
          {dati.foto.length > 0 ? (
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-1 pb-4 sm:-mx-8 sm:px-8">
              {dati.foto.map((f) => (
                <Link
                  key={f.id}
                  href="/scuola"
                  className="panel-3d tile-press w-[72%] shrink-0 snap-start rounded-xl p-2 sm:w-[40%] lg:w-[30%]"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.titolo} loading="lazy" className="size-full object-cover" />
                  </div>
                  <p className="px-2 pt-3 pb-1 font-display text-sm uppercase">{f.titolo}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Le foto della scuola arriveranno presto.</p>
          )}
        </section>

        {/* ================= Insegnanti ================= */}
        {dati.insegnanti.length > 0 && (
          <section className="flex flex-col gap-5">
            <TitoloSezione eyebrow="Le persone" titolo="Chi ti insegna" href="/insegnanti" link="Tutti" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {dati.insegnanti.map((ins, i) => (
                <motion.div key={ins.id} {...ritardo(i)}>
                  <Link
                    href={`/insegnanti/${ins.id}`}
                    className="panel-3d tile-press flex h-full flex-col gap-3 rounded-xl p-2"
                  >
                    <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-muted">
                      {ins.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ins.fotoUrl} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center font-display text-4xl text-muted-foreground/40 uppercase">
                          {ins.nome.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="px-2 pb-2">
                      <p className="font-display text-base leading-tight uppercase">{ins.nome}</p>
                      {ins.specializzazioni && (
                        <p className="text-xs text-muted-foreground">{ins.specializzazioni}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ================= Lavora con noi ================= */}
        <motion.section {...sale}>
          <Link
            href="/lavora-con-noi"
            className="panel-3d tile-press flex items-center justify-between gap-4 rounded-xl p-6 sm:p-8"
          >
            <div>
              <Eyebrow>
                {dati.posizioniAperte > 0
                  ? `${dati.posizioniAperte} ${dati.posizioniAperte === 1 ? "posizione aperta" : "posizioni aperte"}`
                  : "Candidature aperte"}
              </Eyebrow>
              <p className="mt-2 font-display text-2xl leading-none uppercase sm:text-3xl">
                Lavora con noi
              </p>
            </div>
            <span className="panel-3d tile-red flex size-12 shrink-0 items-center justify-center rounded-full [--tile-d:3px]">
              <ArrowRightIcon className="size-5" />
            </span>
          </Link>
        </motion.section>

        {/* ================= Contatti + area riservata ================= */}
        <section id="contatti" className="grid scroll-mt-20 gap-4 lg:grid-cols-2">
          <motion.div {...sale} className="panel-3d flex flex-col gap-5 rounded-xl p-6 sm:p-8">
            <div>
              <Eyebrow>Vieni a trovarci</Eyebrow>
              <p className="mt-2 font-display text-2xl leading-none uppercase sm:text-3xl">Contatti</p>
            </div>
            <div className="flex flex-col gap-3 text-sm">
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

          <motion.div {...ritardo(1)} className="panel-3d tile-ink flex flex-col gap-5 rounded-xl p-6 sm:p-8">
            <div>
              <p className="font-display text-[0.7rem] tracking-[0.32em] uppercase opacity-60">
                Per chi è già iscritto
              </p>
              <p className="mt-2 font-display text-2xl leading-none uppercase sm:text-3xl">
                Area riservata
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              {VANTAGGI_ISCRITTI.map(({ icona: Icona, testo }) => (
                <li key={testo} className="flex items-center gap-3">
                  <Icona className="size-4 shrink-0 opacity-70" />
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
      </div>

      <PublicFooter />
    </main>
  );
}

function TitoloSezione({
  eyebrow,
  titolo,
  href,
  link,
}: {
  eyebrow: string;
  titolo: string;
  href: string;
  link: string;
}) {
  return (
    <motion.div {...sale} className="flex items-end justify-between gap-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-1.5 font-display text-3xl leading-none uppercase sm:text-4xl">{titolo}</h2>
      </div>
      <Link
        href={href}
        className="group flex shrink-0 items-center gap-1 font-display text-xs tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
      >
        {link}
        <ArrowUpRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </motion.div>
  );
}
