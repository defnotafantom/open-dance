import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const QUANTI = 300;

function giornoLungo(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ora(iso: string) {
  return new Date(iso).toLocaleTimeString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
}

/** Registro attivita': tutto lo staff vede chi ha fatto cosa, giorno e ora. */
export default async function AttivitaPage() {
  const supabase = await createClient();
  const { data: righe, error } = await supabase
    .from("attivita_staff")
    .select("id, created_at, autore_nome, studente_id, studente_nome, azione, dettaglio")
    .order("created_at", { ascending: false })
    .limit(QUANTI);
  if (error) throw new Error(`Attività non caricate: ${error.message}`);

  const perGiorno = new Map<string, NonNullable<typeof righe>>();
  for (const r of righe ?? []) {
    const g = giornoLungo(r.created_at);
    perGiorno.set(g, [...(perGiorno.get(g) ?? []), r]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Attività staff</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Ogni passaggio sugli iscritti fatto da chi gestisce: nuovi iscritti, corsi, credenziali,
          incassi, modifiche. Giorno e ora sono quelli del server, in ora italiana. Le righe non si
          possono modificare né cancellare.
        </p>
      </div>

      {perGiorno.size === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna attività registrata.</p>
      ) : (
        [...perGiorno].map(([giorno, voci]) => (
          <section key={giorno} className="flex flex-col gap-2">
            <h2 className="font-display text-sm tracking-[0.15em] text-muted-foreground uppercase">{giorno}</h2>
            <div className="panel-3d overflow-hidden rounded-xl">
              <ul className="divide-y divide-border">
                {voci.map((a) => (
                  <li key={a.id} className="flex gap-4 px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground w-12 shrink-0 font-mono text-xs leading-5">{ora(a.created_at)}</span>
                    <div className="min-w-0 flex-1">
                      <p>
                        <span className="font-medium">{a.azione}</span>
                        {a.studente_nome &&
                          (a.studente_id ? (
                            <>
                              {" · "}
                              <Link href={`/admin/iscritti/${a.studente_id}`} className="hover:text-primary">
                                {a.studente_nome}
                              </Link>
                            </>
                          ) : (
                            <> · {a.studente_nome}</>
                          ))}
                      </p>
                      {a.dettaglio && <p className="text-muted-foreground text-xs">{a.dettaglio}</p>}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs leading-5">{a.autore_nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))
      )}
      {(righe ?? []).length === QUANTI && (
        <p className="text-muted-foreground text-xs">Mostrate le ultime {QUANTI} attività.</p>
      )}
    </div>
  );
}
