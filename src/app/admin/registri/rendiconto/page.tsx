import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TIPO_LABEL } from "@/lib/pagamenti/schemas";
import { CATEGORIE_USCITE, MESI, euro } from "@/lib/registri/costanti";
import { EntrateUsciteChart } from "@/components/charts/entrate-uscite-chart";
import { Button } from "@/components/ui/button";
import { UsciteList } from "./uscite-list";

export default async function RendicontoPage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string }>;
}) {
  const { anno: annoParam } = await searchParams;
  const anno = Number(annoParam) || new Date().getFullYear();
  const da = `${anno}-01-01`;
  const a = `${anno}-12-31`;

  const supabase = await createClient();
  const [{ data: versamenti, error: e1 }, { data: uscite, error: e2 }, { data: rimborsi, error: e3 }] = await Promise.all([
    supabase
      .from("versamenti")
      .select("importo, data, pagamento_id")
      .eq("annullato", false)
      .gte("data", da)
      .lte("data", a),
    supabase
      .from("uscite")
      .select("id, data, categoria, descrizione, importo, metodo, note")
      .gte("data", da)
      .lte("data", a)
      .order("data", { ascending: false }),
    supabase
      .from("rimborsi")
      .select("importo, data")
      .eq("annullato", false)
      .gte("data", da)
      .lte("data", a),
  ]);

  if (e1 || e2 || e3) throw new Error(`Movimenti non caricati: ${(e1 ?? e2 ?? e3)!.message}`);

  const pagamentoIds = [...new Set((versamenti ?? []).map((v) => v.pagamento_id))];
  const { data: pagamenti } =
    pagamentoIds.length > 0
      ? await supabase.from("pagamenti").select("id, tipo").in("id", pagamentoIds)
      : { data: [] as { id: string; tipo: keyof typeof TIPO_LABEL }[] };
  const tipoDi = new Map((pagamenti ?? []).map((p) => [p.id, p.tipo]));

  const mesi = MESI.map((m) => ({ mese: m.slice(0, 3), entrate: 0, uscite: 0 }));
  const entratePerVoce = new Map<string, number>();
  for (const v of versamenti ?? []) {
    mesi[Number(v.data.slice(5, 7)) - 1].entrate += Number(v.importo);
    const voce = TIPO_LABEL[tipoDi.get(v.pagamento_id) ?? "altro"];
    entratePerVoce.set(voce, (entratePerVoce.get(voce) ?? 0) + Number(v.importo));
  }
  // Le restituzioni riducono le entrate (non sono spese dell'associazione).
  let totRimborsi = 0;
  for (const r of rimborsi ?? []) {
    mesi[Number(r.data.slice(5, 7)) - 1].entrate -= Number(r.importo);
    totRimborsi += Number(r.importo);
  }
  if (totRimborsi > 0) entratePerVoce.set("Restituzioni", -totRimborsi);
  const uscitePerCategoria = new Map<string, number>();
  for (const u of uscite ?? []) {
    mesi[Number(u.data.slice(5, 7)) - 1].uscite += Number(u.importo);
    uscitePerCategoria.set(u.categoria, (uscitePerCategoria.get(u.categoria) ?? 0) + Number(u.importo));
  }
  const totEntrate = [...entratePerVoce.values()].reduce((t, n) => t + n, 0);
  const totUscite = [...uscitePerCategoria.values()].reduce((t, n) => t + n, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`?anno=${anno - 1}`}>&larr; {anno - 1}</Link>} />
        <span className="font-display text-xl">{anno}</span>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`?anno=${anno + 1}`}>{anno + 1} &rarr;</Link>} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Totale label="Entrate" valore={totEntrate} />
        <Totale label="Uscite" valore={totUscite} />
        <Totale label="Saldo" valore={totEntrate - totUscite} evidenza />
      </div>

      <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
        <h2 className="font-display text-lg uppercase">Mese per mese</h2>
        <EntrateUsciteChart dati={mesi} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Ripartizione titolo="Entrate per voce" voci={entratePerVoce} totale={totEntrate} />
        <Ripartizione titolo="Uscite per categoria" voci={uscitePerCategoria} totale={totUscite} />
      </div>

      <UsciteList
        uscite={(uscite ?? []).map((u) => ({ ...u, importo: Number(u.importo), note: u.note ?? "" }))}
        categorie={[...new Set([...CATEGORIE_USCITE, ...uscitePerCategoria.keys()])]}
      />

      <p className="text-muted-foreground text-xs">
        Le entrate sono le ricevute valide (non annullate) dell&apos;anno. Questo prospetto aiuta a
        preparare il rendiconto annuale da approvare in assemblea: la versione ufficiale va
        verificata con il commercialista.
      </p>
    </div>
  );
}

function Totale({ label, valore, evidenza }: { label: string; valore: number; evidenza?: boolean }) {
  return (
    <div className={`panel-3d rounded-xl p-4 ${evidenza ? "tile-ink" : ""}`}>
      <p className="font-display text-[0.65rem] tracking-[0.2em] uppercase opacity-70">{label}</p>
      <p className={`mt-1 font-display text-3xl leading-none ${evidenza && valore < 0 ? "text-primary" : ""}`}>
        {euro(valore)}
      </p>
    </div>
  );
}

function Ripartizione({ titolo, voci, totale }: { titolo: string; voci: Map<string, number>; totale: number }) {
  const righe = [...voci].sort((x, y) => y[1] - x[1]);
  return (
    <div className="panel-3d flex flex-col gap-3 rounded-xl p-5">
      <h2 className="font-display text-lg uppercase">{titolo}</h2>
      {righe.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun movimento.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {righe.map(([nome, valore]) => (
            <li key={nome} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{nome}</span>
                <span className="font-display">{euro(valore)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${totale ? (valore / totale) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
