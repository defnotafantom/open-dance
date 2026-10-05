import { giornoRoma } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { caricaQuote, perIncasso } from "@/lib/registri/dati";
import { euro, nomeMese, stagioneDi } from "@/lib/registri/costanti";
import { IncassaDialog } from "@/components/registri/incassa-dialog";
import { StatoPagamentoBadge } from "@/components/pagamenti/stato-pagamento-badge";
import { Button } from "@/components/ui/button";
import { Listino } from "./listino";
import { GeneraQuote } from "./genera-quote";

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ mese?: string }>;
}) {
  const { mese: meseParam } = await searchParams;
  const mese = /^\d{4}-\d{2}$/.test(meseParam ?? "") ? meseParam! : giornoRoma().slice(0, 7);
  const stagione = stagioneDi(new Date(`${mese}-15T12:00:00`));

  const supabase = await createClient();
  const [{ data: tariffe, error }, quoteMese, altreAperte] = await Promise.all([
    supabase.from("tariffe").select("attivita, voce, importo").eq("stagione", stagione),
    caricaQuote({ competenza: `${mese}-01` }),
    caricaQuote({ soloAperte: true }),
  ]);
  if (error) throw new Error(`Listino non caricato: ${error.message}`);
  const altre = altreAperte.filter((q) => q.competenza !== `${mese}-01`);

  const atteso = quoteMese.reduce((t, q) => t + q.importo_dovuto, 0);
  const incassato = quoteMese.reduce((t, q) => t + q.importo_pagato, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Listino stagione={stagione} tariffe={tariffe ?? []} />
        <GeneraQuote mese={mese} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl uppercase">Quote di {nomeMese(mese)}</h2>
          <p className="text-muted-foreground text-sm">
            Incassato {euro(incassato)} su {euro(atteso)}
          </p>
        </div>
        <TabellaQuote quote={quoteMese} vuoto="Nessuna quota per questo mese: generale dal riquadro qui sopra." />
      </section>

      {altre.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl uppercase">Altre quote da incassare</h2>
          <TabellaQuote quote={altre} vuoto="" />
        </section>
      )}
    </div>
  );
}

function TabellaQuote({ quote, vuoto }: { quote: Awaited<ReturnType<typeof caricaQuote>>; vuoto: string }) {
  if (quote.length === 0) return <p className="text-muted-foreground text-sm">{vuoto}</p>;
  return (
    <div className="panel-3d overflow-hidden rounded-xl">
      <ul className="divide-y divide-border">
        {quote.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {q.socio}
                {q.numero_tessera && <span className="text-muted-foreground font-normal"> · n. {q.numero_tessera}</span>}
              </p>
              <p className="text-muted-foreground text-xs">
                {q.descrizione}
                {q.data_scadenza && ` · scad. ${new Date(q.data_scadenza).toLocaleDateString("it-IT")}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {euro(q.importo_pagato)} / {euro(q.importo_dovuto)}
              </span>
              <StatoPagamentoBadge stato={q.stato} />
              {q.residuo > 0 && (
                <IncassaDialog quota={perIncasso(q)} trigger={<Button size="sm">Incassa</Button>} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
