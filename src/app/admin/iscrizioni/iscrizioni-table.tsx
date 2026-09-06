"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approvaIscrizione, rifiutaIscrizione } from "@/lib/iscrizioni/actions";
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

export type RichiestaIscrizione = {
  id: string;
  studente_nome: string;
  classe_label: string;
  data_iscrizione: string;
};

export function IscrizioniTable({
  richieste,
  messaggioVuoto = "Nessuna richiesta in attesa.",
  etichettaApprova = "Approva",
  etichettaRifiuta = "Rifiuta",
}: {
  richieste: RichiestaIscrizione[];
  messaggioVuoto?: string;
  etichettaApprova?: string;
  etichettaRifiuta?: string;
}) {
  const router = useRouter();

  if (richieste.length === 0) {
    return <p className="text-muted-foreground text-sm">{messaggioVuoto}</p>;
  }

  async function approva(id: string) {
    const result = await approvaIscrizione(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Iscrizione approvata.");
    router.refresh();
  }

  async function rifiuta(id: string) {
    const result = await rifiutaIscrizione(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Rimossa.");
    router.refresh();
  }

  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Studente</TableHead>
            <TableHead>Classe</TableHead>
            <TableHead>Richiesta il</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {richieste.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.studente_nome}</TableCell>
              <TableCell>{r.classe_label}</TableCell>
              <TableCell>{new Date(r.data_iscrizione).toLocaleDateString("it-IT")}</TableCell>
              <TableCell className="flex justify-end gap-2 text-right">
                <Button size="sm" onClick={() => approva(r.id)}>
                  {etichettaApprova}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => rifiuta(r.id)}>
                  {etichettaRifiuta}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataList>
        {richieste.map((r) => (
          <DataListItem key={r.id}>
            <p className="font-medium">{r.studente_nome}</p>
            <DataListRow>
              <DataListLabel>Classe</DataListLabel>
              <span>{r.classe_label}</span>
            </DataListRow>
            <DataListRow>
              <DataListLabel>Richiesta il</DataListLabel>
              <span>{new Date(r.data_iscrizione).toLocaleDateString("it-IT")}</span>
            </DataListRow>
            <div className="mt-1 flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => approva(r.id)}>
                {etichettaApprova}
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => rifiuta(r.id)}>
                {etichettaRifiuta}
              </Button>
            </div>
          </DataListItem>
        ))}
      </DataList>
    </>
  );
}
