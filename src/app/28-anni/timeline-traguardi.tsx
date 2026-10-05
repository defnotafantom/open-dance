"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CATEGORIE_TRAGUARDO, etichetta } from "@/lib/sito/costanti";
import type { CategoriaTraguardo } from "@/lib/supabase/database.types";
import { TrophyIcon } from "lucide-react";

type Traguardo = {
  id: string;
  anno: number;
  categoria: CategoriaTraguardo;
  titolo: string;
  contesto: string | null;
  risultato: string | null;
  fotoUrl: string | null;
};

export function TimelineTraguardi({ traguardi }: { traguardi: Traguardo[] }) {
  const [filtro, setFiltro] = useState<CategoriaTraguardo | null>(null);

  const presenti = CATEGORIE_TRAGUARDO.filter((c) =>
    traguardi.some((t) => t.categoria === c.value)
  );
  const visibili = filtro ? traguardi.filter((t) => t.categoria === filtro) : traguardi;
  const anni = [...new Set(visibili.map((t) => t.anno))];

  return (
    <div className="flex flex-col gap-10">
      {presenti.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FiltroChip attivo={filtro === null} onClick={() => setFiltro(null)}>
            Tutto
          </FiltroChip>
          {presenti.map((c) => (
            <FiltroChip
              key={c.value}
              attivo={filtro === c.value}
              onClick={() => setFiltro(c.value)}
            >
              {c.label}
            </FiltroChip>
          ))}
        </div>
      )}

      <div className="flex flex-col">
        {anni.map((anno) => (
          <div key={anno} className="grid gap-4 border-l border-border pb-12 pl-6 sm:grid-cols-[7rem_1fr] sm:border-l-0 sm:pl-0">
            <div className="relative sm:border-r sm:border-border sm:pr-6">
              <span
                aria-hidden
                className="absolute top-3 -left-[1.95rem] size-3 rounded-full bg-primary sm:left-auto sm:-right-1.5"
              />
              <span className="font-display text-4xl text-primary sm:sticky sm:top-20">{anno}</span>
            </div>
            <div className="flex flex-col gap-8 sm:pl-4">
              {visibili
                .filter((t) => t.anno === anno)
                .map((t) => (
                  <motion.article
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5 }}
                    className="grid gap-5 lg:grid-cols-[1fr_18rem]"
                  >
                    <div className="flex flex-col gap-3">
                      <span className="w-fit rounded-full bg-primary/12 px-3 py-0.5 text-xs font-medium text-primary">
                        {etichetta(CATEGORIE_TRAGUARDO, t.categoria)}
                      </span>
                      <h3 className="font-display text-2xl uppercase tracking-tight">{t.titolo}</h3>
                      {t.contesto && (
                        <p className="max-w-2xl whitespace-pre-line text-muted-foreground">
                          {t.contesto}
                        </p>
                      )}
                      {t.risultato && (
                        <p className="flex w-fit items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                          <TrophyIcon className="size-4 text-primary" />
                          {t.risultato}
                        </p>
                      )}
                    </div>
                    {t.fotoUrl && (
                      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.fotoUrl}
                          alt={t.titolo}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                  </motion.article>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FiltroChip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={
        attivo
          ? "rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground"
          : "rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary hover:text-primary"
      }
    >
      {children}
    </button>
  );
}
