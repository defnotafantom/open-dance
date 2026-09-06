"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaDocumento, urlFirmatoDocumento } from "@/lib/documenti/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DocumentoRiga = {
  id: string;
  studente_nome: string;
  tipo: string;
  data_scadenza: string | null;
  file_path: string;
};

function BadgeScadenza({ dataScadenza }: { dataScadenza: string | null }) {
  if (!dataScadenza) return null;
  const adesso = new Date();
  const oggi = adesso.toISOString().slice(0, 10);
  const tra30Giorni = new Date(adesso.getTime() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  if (dataScadenza < oggi) {
    return <Badge variant="destructive">Scaduto</Badge>;
  }
  if (dataScadenza < tra30Giorni) {
    return <Badge variant="secondary">In scadenza</Badge>;
  }
  return null;
}

export function DocumentiList({ documenti }: { documenti: DocumentoRiga[] }) {
  const router = useRouter();

  if (documenti.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun documento caricato ancora.</p>;
  }

  async function handleScarica(filePath: string) {
    const result = await urlFirmatoDocumento(filePath);
    if (result.error || !result.url) {
      toast.error(result.error ?? "Impossibile aprire il documento.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Figlio/a</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documenti.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.studente_nome}</TableCell>
            <TableCell>{d.tipo}</TableCell>
            <TableCell className="flex items-center gap-2">
              {d.data_scadenza ? new Date(d.data_scadenza).toLocaleDateString("it-IT") : "—"}
              <BadgeScadenza dataScadenza={d.data_scadenza} />
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <Button variant="outline" size="sm" onClick={() => handleScarica(d.file_path)}>
                Scarica
              </Button>
              <ConfirmActionDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Elimina
                  </Button>
                }
                title="Eliminare questo documento?"
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await eliminaDocumento(d.id, d.file_path);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Documento eliminato.");
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
