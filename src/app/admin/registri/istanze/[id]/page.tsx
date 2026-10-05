import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { caricaQuote, caricaSoci, perIncasso } from "@/lib/registri/dati";
import { dataOraRoma } from "@/lib/registri/stato";
import { euro } from "@/lib/registri/costanti";
import { AvvisoChip } from "@/components/registri/avviso-chip";
import { IncassaDialog } from "@/components/registri/incassa-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IstanzaDialog } from "../istanza-dialog";
import { AggiungiAlunni, AzioniVoce, RimborsoDialog } from "./azioni";

export default async function IstanzaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: istanza, error } = await supabase
    .from("istanze")
    .select("id, nome, descrizione, importo_predefinito, scadenza, chiusa, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Istanza non caricata: ${error.message}`);
  if (!istanza) notFound();

  const [voci, soci] = await Promise.all([caricaQuote({ istanzaId: id }), caricaSoci()]);
  const presenti = new Set(voci.map((v) => v.studente_id));

  const tot = voci.reduce(
    (t, v) => ({
      dovuto: t.dovuto + v.importo_dovuto,
      versato: t.versato + v.importo_pagato,
      daVersare: t.daVersare + v.residuo,
      daRestituire: t.daRestituire + v.credito,
    }),
    { dovuto: 0, versato: 0, daVersare: 0, daRestituire: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/registri/istanze" className="text-muted-foreground text-sm hover:text-foreground">
        &larr; Tutte le istanze
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-3xl uppercase">
            {istanza.nome} {istanza.chiusa && <Badge variant="secondary">Chiusa</Badge>}
          </h2>
          <p className="text-muted-foreground text-sm">
            Creata il {dataOraRoma(istanza.created_at)} ·{" "}
            {istanza.scadenza
              ? `scade il ${new Date(istanza.scadenza).toLocaleDateString("it-IT")}`
              : "nessuna scadenza"}
          </p>
          {istanza.descrizione && <p className="mt-2 max-w-2xl text-sm">{istanza.descrizione}</p>}
        </div>
        <div className="flex gap-2">
          <IstanzaDialog
            istanza={{ ...istanza, importo_predefinito: istanza.importo_predefinito != null ? Number(istanza.importo_predefinito) : null }}
            trigger={<Button variant="outline">Modifica</Button>}
          />
          {!istanza.chiusa && (
            <AggiungiAlunni
              istanzaId={id}
              importoPredefinito={istanza.importo_predefinito != null ? Number(istanza.importo_predefinito) : null}
              soci={soci
                .filter((s) => s.attivo && !presenti.has(s.id))
                .map((s) => ({ id: s.id, nome: `${s.nome} ${s.cognome}`, tessera: s.numero_tessera }))}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Totale label="Dovuto" valore={tot.dovuto} />
        <Totale label="Versato" valore={tot.versato} />
        <Totale label="Da versare" valore={tot.daVersare} evidenza={tot.daVersare > 0} />
        <Totale label="Da restituire" valore={tot.daRestituire} />
      </div>

      {voci.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun alunno: aggiungili con &quot;Aggiungi alunni&quot;.</p>
      ) : (
        <div className="panel-3d overflow-hidden rounded-xl">
          <ul className="divide-y divide-border">
            {voci.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="text-sm font-medium">
                    {v.socio}
                    {v.numero_tessera && <span className="text-muted-foreground font-normal"> · n. {v.numero_tessera}</span>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Dovuto {euro(v.importo_dovuto)} · versato {euro(v.importo_pagato)}
                    {v.importo_rimborsato > 0 && ` · restituito ${euro(v.importo_rimborsato)}`}
                    {v.descrizione !== istanza.nome && ` · ${v.descrizione}`}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {v.avvisi.length === 0 ? (
                      <span className="text-xs text-muted-foreground">In regola</span>
                    ) : (
                      v.avvisi.map((a) => <AvvisoChip key={a.tipo} avviso={a} />)
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <IncassaDialog quota={perIncasso(v)} trigger={<Button size="sm">Incassa</Button>} />
                  {v.credito > 0 && (
                    <RimborsoDialog
                      pagamentoId={v.id}
                      massimo={v.credito}
                      beneficiario={v.referente}
                      trigger={<Button size="sm" variant="outline">Restituisci</Button>}
                    />
                  )}
                  <AzioniVoce
                    istanzaId={id}
                    pagamentoId={v.id}
                    dovuto={v.importo_dovuto}
                    nota={v.descrizione === istanza.nome ? "" : v.descrizione}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Totale({ label, valore, evidenza }: { label: string; valore: number; evidenza?: boolean }) {
  return (
    <div className={`panel-3d rounded-xl p-4 ${evidenza ? "tile-red" : ""}`}>
      <p className="font-display text-[0.65rem] tracking-[0.2em] uppercase opacity-70">{label}</p>
      <p className="mt-1 font-display text-2xl leading-none">{euro(valore)}</p>
    </div>
  );
}
