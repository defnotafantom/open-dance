import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InArrivo, PublicHero, PublicPage } from "@/components/marketing/public-page";
import { TAPPE_PERCORSO } from "@/lib/sito/costanti";
import { CheckIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "I corsi · Open Dance",
  description:
    "Studiare danza gradualmente: dai primi passi all'alta formazione, cosa sviluppa ogni corso.",
};

type Corso = {
  id: string;
  nome: string;
  descrizione: string | null;
  categoria: string | null;
  livello: string | null;
  tappa: number | null;
  eta_consigliata: string | null;
  impatto: string | null;
};

export default async function CorsiPubbliciPage() {
  const supabase = await createClient();
  const [{ data: corsi }, { data: scuola }] = await Promise.all([
    supabase
      .from("corsi")
      .select("id, nome, descrizione, categoria, livello, tappa, eta_consigliata, impatto")
      .eq("pubblicato", true)
      .eq("attivo", true)
      .order("nome"),
    supabase
      .from("impostazioni_scuola")
      .select("telefono, email_contatto, indirizzo")
      .maybeSingle(),
  ]);

  const tutti = corsi ?? [];
  const senzaTappa = tutti.filter((c) => c.tappa == null);

  return (
    <PublicPage>
      <PublicHero
        eyebrow="Studiare danza, un passo alla volta"
        titolo="I corsi"
        intro="Nessuno nasce ballerino. Il nostro percorso accompagna ogni allieva e ogni allievo per gradi: ecco le tappe e cosa sviluppa davvero ogni corso, dentro e fuori dalla sala."
      />

      {tutti.length === 0 ? (
        <section className="px-6 py-16">
          <InArrivo>Stiamo preparando la presentazione dei corsi della nuova stagione.</InArrivo>
        </section>
      ) : (
        <>
          {TAPPE_PERCORSO.map((tappa) => {
            const corsiTappa = tutti.filter((c) => c.tappa === tappa.value);
            if (corsiTappa.length === 0) return null;
            return (
              <section
                key={tappa.value}
                className="border-t border-border px-6 py-16 sm:px-12 lg:px-24"
              >
                <div className="mb-10 grid gap-3 sm:grid-cols-[8rem_1fr]">
                  <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0">
                    <span className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                      Tappa
                    </span>
                    <span className="font-display text-5xl text-primary">{tappa.value}</span>
                  </div>
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
                      {tappa.label}
                    </h2>
                    <p className="mt-1 max-w-xl text-muted-foreground">{tappa.descrizione}</p>
                  </div>
                </div>
                <CorsiGrid corsi={corsiTappa} />
              </section>
            );
          })}

          {senzaTappa.length > 0 && (
            <section className="border-t border-border px-6 py-16 sm:px-12 lg:px-24">
              <h2 className="mb-10 font-display text-3xl uppercase tracking-tight sm:text-4xl">
                Altri corsi
              </h2>
              <CorsiGrid corsi={senzaTappa} />
            </section>
          )}
        </>
      )}

      <section className="border-t border-border bg-sidebar px-6 py-14 text-sidebar-foreground sm:px-12 lg:px-24">
        <h2 className="font-display text-3xl uppercase tracking-tight">Non sai da dove iniziare?</h2>
        <p className="mt-2 max-w-xl text-sidebar-foreground/70">
          Vieni a trovarci o scrivici: ti aiutiamo a scegliere il corso giusto, anche con una
          lezione di prova.
        </p>
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {scuola?.telefono && (
            <a href={`tel:${scuola.telefono}`} className="flex items-center gap-2 hover:text-primary">
              <PhoneIcon className="size-4" /> {scuola.telefono}
            </a>
          )}
          {scuola?.email_contatto && (
            <a
              href={`mailto:${scuola.email_contatto}`}
              className="flex items-center gap-2 hover:text-primary"
            >
              <MailIcon className="size-4" /> {scuola.email_contatto}
            </a>
          )}
          {scuola?.indirizzo && (
            <p className="flex items-center gap-2">
              <MapPinIcon className="size-4" /> {scuola.indirizzo}
            </p>
          )}
        </div>
      </section>
    </PublicPage>
  );
}

function CorsiGrid({ corsi }: { corsi: Corso[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {corsi.map((c) => {
        const impatti = (c.impatto ?? "")
          .split("\n")
          .map((r) => r.replace(/^[-•·\s]+/, "").trim())
          .filter(Boolean);
        return (
          <article key={c.id} className="flex flex-col gap-4 rounded-xl panel-3d p-6">
            <div>
              <h3 className="font-display text-2xl uppercase tracking-tight">{c.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {[c.categoria, c.livello, c.eta_consigliata].filter(Boolean).join(" · ")}
              </p>
            </div>
            {c.descrizione && (
              <p className="whitespace-pre-line text-sm">{c.descrizione}</p>
            )}
            {impatti.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
                  Cosa sviluppa
                </p>
                <ul className="flex flex-col gap-1.5">
                  {impatti.map((riga) => (
                    <li key={riga} className="flex gap-2 text-sm">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      {riga}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
