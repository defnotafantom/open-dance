import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { avvisiVoce } from "@/lib/registri/stato";
import { dataOraRoma } from "@/lib/registri/stato";
import { euro } from "@/lib/registri/costanti";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IstanzaDialog } from "./istanza-dialog";

export default async function IstanzePage() {
  const supabase = await createClient();
  const [{ data: istanze, error: e1 }, { data: voci, error: e2 }] = await Promise.all([
    supabase
      .from("istanze")
      .select("id, nome, descrizione, importo_predefinito, scadenza, chiusa, created_at")
      .order("chiusa")
      .order("created_at", { ascending: false }),
    supabase
      .from("pagamenti")
      .select("istanza_id, importo_dovuto, importo_pagato, importo_rimborsato, data_scadenza")
      .not("istanza_id", "is", null),
  ]);

  if (e1 || e2) throw new Error(`Istanze non caricate: ${(e1 ?? e2)!.message}`);

  const riepilogo = new Map<string, { alunni: number; dovuto: number; versato: number; avvisi: number }>();
  for (const v of voci ?? []) {
    const r = riepilogo.get(v.istanza_id!) ?? { alunni: 0, dovuto: 0, versato: 0, avvisi: 0 };
    r.alunni += 1;
    r.dovuto += Number(v.importo_dovuto);
    r.versato += Number(v.importo_pagato) - Number(v.importo_rimborsato);
    r.avvisi += avvisiVoce({
      importo_dovuto: Number(v.importo_dovuto),
      importo_pagato: Number(v.importo_pagato),
      importo_rimborsato: Number(v.importo_rimborsato),
      data_scadenza: v.data_scadenza,
    }).length;
    riepilogo.set(v.istanza_id!, r);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-xl text-sm">
          Registri liberi per spese o raccolte con un nome (es. &quot;Abiti concorso&quot;): per
          ogni alunno quanto deve, quanto ha versato e quanto va restituito.
        </p>
        <IstanzaDialog trigger={<Button>Nuova istanza</Button>} />
      </div>
      {(istanze ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna istanza.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(istanze ?? []).map((i) => {
            const r = riepilogo.get(i.id) ?? { alunni: 0, dovuto: 0, versato: 0, avvisi: 0 };
            return (
              <Link
                key={i.id}
                href={`/admin/registri/istanze/${i.id}`}
                className={`panel-3d tile-press flex flex-col gap-3 rounded-xl p-5 ${i.chiusa ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-xl leading-tight uppercase">{i.nome}</p>
                  {i.chiusa ? (
                    <Badge variant="secondary">Chiusa</Badge>
                  ) : r.avvisi > 0 ? (
                    <Badge>{r.avvisi} avvisi</Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  Creata il {dataOraRoma(i.created_at)} ·{" "}
                  {i.scadenza
                    ? `scade il ${new Date(i.scadenza).toLocaleDateString("it-IT")}`
                    : "nessuna scadenza"}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Cifra label="Alunni" valore={String(r.alunni)} />
                  <Cifra label="Dovuto" valore={euro(r.dovuto)} />
                  <Cifra label="Versato" valore={euro(r.versato)} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cifra({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-1 py-2">
      <p className="font-display text-base leading-none">{valore}</p>
      <p className="mt-1 font-display text-[0.55rem] tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
