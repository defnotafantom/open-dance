import { createClient } from "@/lib/supabase/server";
import { TIPO_LABEL } from "@/lib/pagamenti/schemas";
import { credito, statoQuota } from "@/lib/registri/stato";
import { euro } from "@/lib/registri/costanti";
import { StatoPagamentoBadge } from "@/components/pagamenti/stato-pagamento-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataList, DataListItem, DataListRow, DataListLabel } from "@/components/ui/data-list";

export default async function PagamentiGenitorePage() {
  const supabase = await createClient();

  const { data: figli, error: figliError } = await supabase
    .from("studenti")
    .select("id, nome, cognome");
  const figliIds = (figli ?? []).map((f) => f.id);
  const nomeById = new Map((figli ?? []).map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  const { data: righe, error: pagamentiError } =
    figliIds.length > 0
      ? await supabase
          .from("pagamenti")
          .select("id, studente_id, tipo, note, importo_dovuto, importo_pagato, importo_rimborsato, data_scadenza")
          .in("studente_id", figliIds)
          .order("data_scadenza", { nullsFirst: false })
      : { data: [], error: null };

  const error = figliError ?? pagamentiError;

  // Stato e voce calcolati come nei Registri dello staff: il ritardo dipende
  // da oggi, e le istanze (es. abiti) si chiamano col loro nome.
  const pagamenti = (righe ?? []).map((p) => {
    const q = {
      importo_dovuto: Number(p.importo_dovuto),
      importo_pagato: Number(p.importo_pagato),
      importo_rimborsato: Number(p.importo_rimborsato),
      data_scadenza: p.data_scadenza,
    };
    return {
      ...p,
      ...q,
      voce: p.note || TIPO_LABEL[p.tipo],
      stato: statoQuota(q),
      daRestituire: credito(q),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Pagamenti</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i pagamenti: {error.message}
        </p>
      ) : pagamenti.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun pagamento registrato al momento.</p>
      ) : (
        <>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Studente</TableHead>
                <TableHead>Voce</TableHead>
                <TableHead>Dovuto</TableHead>
                <TableHead>Pagato</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamenti.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {nomeById.get(p.studente_id) ?? "—"}
                  </TableCell>
                  <TableCell>{p.voce}</TableCell>
                  <TableCell>{euro(p.importo_dovuto)}</TableCell>
                  <TableCell>{euro(p.importo_pagato - p.importo_rimborsato)}</TableCell>
                  <TableCell>
                    {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString("it-IT") : "—"}
                  </TableCell>
                  <TableCell>
                    <StatoPagamentoBadge stato={p.stato} />
                    {p.daRestituire > 0 && (
                      <p className="mt-1 text-xs">La scuola ti restituisce {euro(p.daRestituire)}</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DataList>
            {pagamenti.map((p) => (
              <DataListItem key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{nomeById.get(p.studente_id) ?? "—"}</p>
                  <StatoPagamentoBadge stato={p.stato} />
                </div>
                {p.daRestituire > 0 && (
                  <p className="text-xs">La scuola ti restituisce {euro(p.daRestituire)}</p>
                )}
                <DataListRow>
                  <DataListLabel>Voce</DataListLabel>
                  <span>{p.voce}</span>
                </DataListRow>
                <DataListRow>
                  <DataListLabel>Importo</DataListLabel>
                  <span>
                    {euro(p.importo_pagato - p.importo_rimborsato)} / {euro(p.importo_dovuto)}
                  </span>
                </DataListRow>
                <DataListRow>
                  <DataListLabel>Scadenza</DataListLabel>
                  <span>
                    {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString("it-IT") : "—"}
                  </span>
                </DataListRow>
              </DataListItem>
            ))}
          </DataList>
        </>
      )}
    </div>
  );
}
