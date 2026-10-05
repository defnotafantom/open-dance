import Link from "next/link";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  AGGIORNATO_AL,
  APPENA_FATTO,
  IN_CODA,
  IN_LAVORAZIONE,
  IN_PROGRAMMA,
} from "@/lib/lavori/voci";
import { PulsanteRichiesta, ProponiForm, Proposta } from "./interazioni";

function dataBreve(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
}

export default async function LavoriPage() {
  const profile = await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();

  const { data: richieste, error } = await supabase
    .from("richieste_lavori")
    .select("id, voce, testo, profilo_id, evasa, created_at")
    .order("created_at", { ascending: false });
  // Senza la tabella (migrazione 0019 non ancora applicata) il pannello si
  // legge lo stesso; mancano solo le richieste.
  const richiesteAttive = !error;

  const autoriIds = [...new Set((richieste ?? []).map((r) => r.profilo_id))];
  const { data: autori } =
    autoriIds.length > 0
      ? await supabase.from("profiles").select("id, nome, cognome").in("id", autoriIds)
      : { data: [] as { id: string; nome: string; cognome: string }[] };
  const nomeDi = new Map((autori ?? []).map((a) => [a.id, `${a.nome} ${a.cognome}`.trim() || "Staff"]));

  const perVoce = new Map<string, string[]>();
  for (const r of richieste ?? []) {
    if (!r.voce) continue;
    perVoce.set(r.voce, [...(perVoce.get(r.voce) ?? []), r.profilo_id]);
  }
  const proposte = (richieste ?? []).filter((r) => !r.voce);
  const coda = [...IN_CODA].sort((a, b) => (perVoce.get(b.id)?.length ?? 0) - (perVoce.get(a.id)?.length ?? 0));
  const webmaster = profile.ruolo === "webmaster";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl uppercase">Lavori sul sito</h1>
        <p className="text-muted-foreground text-sm">
          Cosa è pronto, cosa si sta facendo e cosa viene dopo. Prima di chiedere una funzione
          guarda qui: se è in coda basta un clic su &quot;Lo vorrei&quot;. Aggiornato al{" "}
          {dataBreve(AGGIORNATO_AL)}.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-3d flex flex-col gap-3 rounded-xl p-5">
          <Titolo colore="bg-primary" testo="In lavorazione" />
          {IN_LAVORAZIONE.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Niente in corso adesso: si riparte dalle voci in programma appena arriva quello che serve.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {IN_LAVORAZIONE.map((v) => (
              <li key={v.titolo}>
                <p className="font-medium">{v.titolo}</p>
                <p className="text-muted-foreground text-sm">{v.dettaglio}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-3d flex flex-col gap-3 rounded-xl p-5">
          <Titolo colore="bg-primary/40" testo="In programma" />
          <ul className="flex flex-col divide-y divide-border">
            {IN_PROGRAMMA.map((v) => (
              <li key={v.titolo} className="py-2.5 first:pt-0">
                <p className="font-medium">{v.titolo}</p>
                <p className="text-muted-foreground text-sm">{v.dettaglio}</p>
                <p className="mt-1 text-xs">
                  <span className="font-display tracking-wider text-primary uppercase">Serve:</span>{" "}
                  {v.serve}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <Titolo colore="bg-foreground" testo="Appena fatto" />
        <div className="panel-3d overflow-hidden rounded-xl">
          <ul className="divide-y divide-border">
            {APPENA_FATTO.map((v) => (
              <li key={v.titolo} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {v.link ? (
                      <Link href={v.link} className="hover:text-primary">
                        {v.titolo} &rarr;
                      </Link>
                    ) : (
                      v.titolo
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm">{v.dettaglio}</p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">{dataBreve(v.data)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <Titolo colore="bg-muted-foreground" testo="In coda: chiedi tu" />
        <p className="text-muted-foreground text-sm">
          Idee pronte da fare. Le più richieste salgono in cima e passano in programma.
        </p>
        {!richiesteAttive && (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
            Le richieste si attivano quando viene applicata la migrazione 0019 nel database.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {coda.map((v) => {
            const chi = perVoce.get(v.id) ?? [];
            return (
              <div key={v.id} className="panel-3d flex flex-col gap-2 rounded-xl p-4">
                <p className="font-display text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                  {v.area}
                </p>
                <p className="font-medium leading-tight">{v.titolo}</p>
                <p className="text-muted-foreground flex-1 text-sm">{v.dettaglio}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-muted-foreground text-xs">
                    {chi.length > 0 ? `Richiesta da ${chi.map((id) => nomeDi.get(id) ?? "Staff").join(", ")}` : ""}
                  </span>
                  {richiesteAttive && (
                    <PulsanteRichiesta voce={v.id} attiva={chi.includes(profile.id)} quanti={chi.length} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {richiesteAttive && (
        <section className="flex flex-col gap-3">
          <Titolo colore="bg-primary" testo="Proponi qualcos'altro" />
          <ProponiForm />
          {proposte.length > 0 && (
            <div className="panel-3d overflow-hidden rounded-xl">
              <ul className="divide-y divide-border">
                {proposte.map((p) => (
                  <Proposta
                    key={p.id}
                    id={p.id}
                    testo={p.testo ?? ""}
                    autore={nomeDi.get(p.profilo_id) ?? "Staff"}
                    data={new Date(p.created_at).toLocaleDateString("it-IT", { timeZone: "Europe/Rome" })}
                    evasa={p.evasa}
                    puoEliminare={webmaster || p.profilo_id === profile.id}
                    webmaster={webmaster}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Titolo({ colore, testo }: { colore: string; testo: string }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg uppercase">
      <span className={`size-2.5 rounded-full ${colore}`} aria-hidden />
      {testo}
    </h2>
  );
}
