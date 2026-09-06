import { createClient } from "@/lib/supabase/server";
import { TIPO_LABEL, METODO_LABEL, type StatoPagamento } from "@/lib/pagamenti/schemas";
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

  const { data: pagamenti, error: pagamentiError } =
    figliIds.length > 0
      ? await supabase
          .from("pagamenti")
          .select("id, studente_id, tipo, importo_dovuto, importo_pagato, data_scadenza, metodo, stato")
          .in("studente_id", figliIds)
          .order("data_scadenza", { nullsFirst: false })
      : { data: [], error: null };

  const error = figliError ?? pagamentiError;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Pagamenti</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i pagamenti: {error.message}
        </p>
      ) : !pagamenti || pagamenti.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun pagamento registrato al momento.</p>
      ) : (
        <>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Studente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dovuto</TableHead>
                <TableHead>Pagato</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamenti.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {nomeById.get(p.studente_id) ?? "—"}
                  </TableCell>
                  <TableCell>{TIPO_LABEL[p.tipo]}</TableCell>
                  <TableCell>€{p.importo_dovuto.toFixed(2)}</TableCell>
                  <TableCell>€{p.importo_pagato.toFixed(2)}</TableCell>
                  <TableCell>
                    {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString("it-IT") : "—"}
                  </TableCell>
                  <TableCell>{p.metodo ? METODO_LABEL[p.metodo] : "—"}</TableCell>
                  <TableCell>
                    <StatoPagamentoBadge stato={p.stato as StatoPagamento} />
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
                  <StatoPagamentoBadge stato={p.stato as StatoPagamento} />
                </div>
                <DataListRow>
                  <DataListLabel>Tipo</DataListLabel>
                  <span>{TIPO_LABEL[p.tipo]}</span>
                </DataListRow>
                <DataListRow>
                  <DataListLabel>Importo</DataListLabel>
                  <span>
                    €{p.importo_pagato.toFixed(2)} / €{p.importo_dovuto.toFixed(2)}
                  </span>
                </DataListRow>
                <DataListRow>
                  <DataListLabel>Scadenza</DataListLabel>
                  <span>
                    {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString("it-IT") : "—"}
                  </span>
                </DataListRow>
                <DataListRow>
                  <DataListLabel>Metodo</DataListLabel>
                  <span>{p.metodo ? METODO_LABEL[p.metodo] : "—"}</span>
                </DataListRow>
              </DataListItem>
            ))}
          </DataList>
        </>
      )}
    </div>
  );
}
