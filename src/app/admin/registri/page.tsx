import { giornoRoma } from "@/lib/date";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { caricaQuote, caricaSoci, perIncasso, type RigaQuota } from "@/lib/registri/dati";
import { GIORNI_IN_SCADENZA } from "@/lib/registri/stato";
import { MESI, euro } from "@/lib/registri/costanti";
import { IncassiChart } from "@/components/charts/incassi-chart";
import { IncassaDialog } from "@/components/registri/incassa-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, ClockIcon } from "lucide-react";

export default async function RegistriPanoramica() {
  const supabase = await createClient();
  const oggi = new Date();
  const oggiIso = giornoRoma(oggi);
  const traGiorni = giornoRoma(new Date(oggi.getTime() + GIORNI_IN_SCADENZA * 86400000));
  const inizioMese = `${oggiIso.slice(0, 7)}-01`;
  const dodiciMesiFa = giornoRoma(new Date(oggi.getFullYear(), oggi.getMonth() - 11, 1));
  const trentaGiorniFa = giornoRoma(new Date(oggi.getTime() - 30 * 86400000));

  const [soci, aperte, { data: versamenti, error: e1 }, { data: lezioni, error: e2 }] = await Promise.all([
    caricaSoci(),
    caricaQuote({ soloAperte: true }),
    supabase
      .from("versamenti")
      .select("importo, data")
      .eq("annullato", false)
      .gte("data", dodiciMesiFa),
    supabase.from("lezioni").select("id").gte("data", trentaGiorniFa).lte("data", oggiIso),
  ]);

  if (e1 || e2) throw new Error((e1 ?? e2)!.message);

  const attivi = soci.filter((s) => s.attivo);
  const inRitardo = aperte.filter((q) => q.stato === "scaduto");
  const inScadenza = aperte.filter(
    (q) => q.stato !== "scaduto" && q.data_scadenza && q.data_scadenza <= traGiorni
  );
  const totaleRitardo = inRitardo.reduce((t, q) => t + q.residuo, 0);
  const daRestituire = aperte.filter((q) => q.credito > 0);
  const incassatoMese = (versamenti ?? [])
    .filter((v) => v.data >= inizioMese)
    .reduce((t, v) => t + Number(v.importo), 0);

  // Incassi per mese, ultimi 12 mesi
  const perMese = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
    perMese.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const v of versamenti ?? []) {
    const k = v.data.slice(0, 7);
    if (perMese.has(k)) perMese.set(k, (perMese.get(k) ?? 0) + Number(v.importo));
  }
  const graficoIncassi = [...perMese].map(([k, totale]) => ({
    mese: MESI[Number(k.slice(5)) - 1].slice(0, 3),
    totale,
  }));

  // Presenze ultimi 30 giorni: soci con almeno 4 appelli e meno del 50% di presenze
  const lezioneIds = (lezioni ?? []).map((l) => l.id);
  const { data: presenze } =
    lezioneIds.length > 0
      ? await supabase.from("presenze").select("studente_id, stato").in("lezione_id", lezioneIds)
      : { data: [] as { studente_id: string; stato: string }[] };
  const conteggio = new Map<string, { tot: number; presenti: number }>();
  for (const p of presenze ?? []) {
    const c = conteggio.get(p.studente_id) ?? { tot: 0, presenti: 0 };
    c.tot += 1;
    if (p.stato === "presente") c.presenti += 1;
    conteggio.set(p.studente_id, c);
  }
  const presenzeBasse = attivi
    .map((s) => ({ socio: s, c: conteggio.get(s.id) }))
    .filter((x) => x.c && x.c.tot >= 4 && x.c.presenti / x.c.tot < 0.5)
    .map((x) => ({ ...x, perc: Math.round((x.c!.presenti / x.c!.tot) * 100) }));

  const kpi = [
    { label: "Soci attivi", valore: String(attivi.length), nota: contaAttivita(attivi) },
    { label: "Incassato questo mese", valore: euro(incassatoMese) },
    { label: "In ritardo", valore: String(inRitardo.length), nota: euro(totaleRitardo), allarme: inRitardo.length > 0 },
    { label: `In scadenza (${GIORNI_IN_SCADENZA} gg)`, valore: String(inScadenza.length) },
    ...(daRestituire.length > 0
      ? [{ label: "Da restituire", valore: String(daRestituire.length), nota: euro(daRestituire.reduce((t, q) => t + q.credito, 0)) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpi.map((k) => (
          <div key={k.label} className={`panel-3d rounded-xl p-4 ${k.allarme ? "tile-red" : ""}`}>
            <p className="font-display text-[0.65rem] tracking-[0.2em] uppercase opacity-70">{k.label}</p>
            <p className="mt-1 font-display text-3xl leading-none">{k.valore}</p>
            {k.nota && <p className="mt-1 text-xs opacity-75">{k.nota}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListaQuote
          titolo="In ritardo"
          icona={<AlertTriangleIcon className="size-4 text-primary" />}
          vuoto="Nessuna quota in ritardo."
          quote={inRitardo}
        />
        <ListaQuote
          titolo="In scadenza"
          icona={<ClockIcon className="size-4" />}
          vuoto="Nessuna quota in scadenza nei prossimi giorni."
          quote={inScadenza}
        />
      </div>

      {daRestituire.length > 0 && (
        <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
          <h2 className="font-display text-lg uppercase">Da restituire ({daRestituire.length})</h2>
          <ul className="flex flex-col divide-y divide-border">
            {daRestituire.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  {q.socio} <span className="text-muted-foreground">· {q.descrizione}</span>
                </span>
                {q.istanza_id ? (
                  <Link href={`/admin/registri/istanze/${q.istanza_id}`} className="font-display text-primary">
                    {euro(q.credito)} &rarr;
                  </Link>
                ) : (
                  <span className="font-display">{euro(q.credito)}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg uppercase">Incassi, ultimi 12 mesi</h2>
          <Link href="/admin/registri/rendiconto" className="text-xs text-muted-foreground hover:text-foreground">
            Entrate e uscite &rarr;
          </Link>
        </div>
        <IncassiChart dati={graficoIncassi} />
      </div>

      <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
        <h2 className="font-display text-lg uppercase">Presenze basse (ultimi 30 giorni)</h2>
        {presenzeBasse.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nessun socio sotto il 50% di presenze (contano solo i soci con almeno 4 appelli).
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {presenzeBasse.map(({ socio, c, perc }) => (
              <li key={socio.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {socio.nome} {socio.cognome}
                  {socio.numero_tessera && (
                    <span className="text-muted-foreground"> · n. {socio.numero_tessera}</span>
                  )}
                </span>
                <span className="font-display text-primary">
                  {perc}% <span className="text-muted-foreground text-xs">({c!.presenti}/{c!.tot})</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function contaAttivita(soci: { attivita: string }[]) {
  const danza = soci.filter((s) => s.attivita !== "fitness").length;
  const fitness = soci.filter((s) => s.attivita !== "danza").length;
  return `Danza ${danza} · Fitness ${fitness}`;
}

function ListaQuote({
  titolo,
  icona,
  vuoto,
  quote,
}: {
  titolo: string;
  icona: React.ReactNode;
  vuoto: string;
  quote: RigaQuota[];
}) {
  return (
    <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
      <h2 className="flex items-center gap-2 font-display text-lg uppercase">
        {icona} {titolo} <span className="text-muted-foreground">({quote.length})</span>
      </h2>
      {quote.length === 0 ? (
        <p className="text-muted-foreground text-sm">{vuoto}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {quote.slice(0, 12).map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {q.socio}
                  {q.numero_tessera && (
                    <span className="text-muted-foreground font-normal"> · n. {q.numero_tessera}</span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {q.descrizione}
                  {q.data_scadenza && ` · scad. ${new Date(q.data_scadenza).toLocaleDateString("it-IT")}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-display">{euro(q.residuo)}</span>
                <IncassaDialog quota={perIncasso(q)} trigger={<Button size="sm">Incassa</Button>} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {quote.length > 12 && (
        <Link href="/admin/registri/quote" className="text-xs text-muted-foreground hover:text-foreground">
          Vedi tutte ({quote.length}) &rarr;
        </Link>
      )}
    </div>
  );
}
