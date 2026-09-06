"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TIPO_LABEL, METODO_LABEL, type StatoPagamento } from "@/lib/pagamenti/schemas";
import { eliminaPagamento } from "@/lib/pagamenti/actions";
import { PagamentoFormDialog, type PagamentoEsistente, type StudenteOpzione } from "./pagamento-form-dialog";
import { StatoPagamentoBadge } from "@/components/pagamenti/stato-pagamento-badge";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  if (pagamenti.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun pagamento registrato.</p>;
  }

  return (
    <Table>
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
        {pagamenti.map((p) => (
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
  );
}
