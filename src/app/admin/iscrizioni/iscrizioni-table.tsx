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

export type RichiestaIscrizione = {
  id: string;
  studente_nome: string;
  classe_label: string;
  data_iscrizione: string;
};

export function IscrizioniTable({ richieste }: { richieste: RichiestaIscrizione[] }) {
  const router = useRouter();

  if (richieste.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nessuna richiesta in attesa.</p>
    );
  }

  return (
    <Table>
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
              <Button
                size="sm"
                onClick={async () => {
                  const result = await approvaIscrizione(r.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Iscrizione approvata.");
                  router.refresh();
                }}
              >
                Approva
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  const result = await rifiutaIscrizione(r.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Richiesta rifiutata.");
                  router.refresh();
                }}
              >
                Rifiuta
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
