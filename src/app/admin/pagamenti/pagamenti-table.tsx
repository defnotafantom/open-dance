"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TIPO_LABEL, METODO_LABEL, type StatoPagamento } from "@/lib/pagamenti/schemas";
import { eliminaPagamento } from "@/lib/pagamenti/actions";
import { PagamentoFormDialog, type PagamentoEsistente, type StudenteOpzione } from "./pagamento-form-dialog";
import { StatoPagamentoBadge } from "@/components/pagamenti/stato-pagamento-badge";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { TableSearch } from "@/components/table-search";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataList, DataListItem, DataListRow, DataListLabel } from "@/components/ui/data-list";

export type PagamentoRiga = PagamentoEsistente & {
  studente_nome: string;
  stato: StatoPagamento;
};

export function PagamentiTable({
  pagamenti,
  studenti,
}: {
  pagamenti: PagamentoRiga[];
  studenti: StudenteOpzione[];
}) {
  const router = useRouter();
  const [ricerca, setRicerca] = useState("");

  const filtrati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return pagamenti;
    return pagamenti.filter((p) => p.studente_nome.toLowerCase().includes(q));
  }, [pagamenti, ricerca]);

  if (pagamenti.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun pagamento registrato.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TableSearch value={ricerca} onChange={setRicerca} placeholder="Cerca per studente..." />
      {filtrati.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun pagamento corrisponde alla ricerca.</p>
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
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrati.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.studente_nome}</TableCell>
                  <TableCell>{TIPO_LABEL[p.tipo]}</TableCell>
                  <TableCell>€{p.importo_dovuto.toFixed(2)}</TableCell>
                  <TableCell>€{p.importo_pagato.toFixed(2)}</TableCell>
                  <TableCell>
                    {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString("it-IT") : "—"}
                  </TableCell>
                  <TableCell>{p.metodo ? METODO_LABEL[p.metodo] : "—"}</TableCell>
                  <TableCell>
                    <StatoPagamentoBadge stato={p.stato} />
                  </TableCell>
                  <TableCell className="flex justify-end gap-2 text-right">
                    <PagamentoFormDialog
                      pagamento={p}
                      studenti={studenti}
                      trigger={<Button variant="outline" size="sm">Modifica</Button>}
                    />
                    <ConfirmActionDialog
                      trigger={
                        <Button variant="destructive" size="sm">
                          Elimina
                        </Button>
                      }
                      title="Eliminare questo pagamento?"
                      confirmLabel="Elimina"
                      onConfirm={async () => {
                        const result = await eliminaPagamento(p.id);
                        if (result.error) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success("Pagamento eliminato.");
                        router.refresh();
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DataList>
            {filtrati.map((p) => (
              <DataListItem key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{p.studente_nome}</p>
                  <StatoPagamentoBadge stato={p.stato} />
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
                <div className="mt-1 flex gap-2">
                  <PagamentoFormDialog
                    pagamento={p}
                    studenti={studenti}
                    trigger={
                      <Button variant="outline" size="sm" className="flex-1">
                        Modifica
                      </Button>
                    }
                  />
                  <ConfirmActionDialog
                    trigger={
                      <Button variant="destructive" size="sm" className="flex-1">
                        Elimina
                      </Button>
                    }
                    title="Eliminare questo pagamento?"
                    confirmLabel="Elimina"
                    onConfirm={async () => {
                      const result = await eliminaPagamento(p.id);
                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success("Pagamento eliminato.");
                      router.refresh();
                    }}
                  />
                </div>
              </DataListItem>
            ))}
          </DataList>
        </>
      )}
    </div>
  );
}
