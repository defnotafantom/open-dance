"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaStudenteStaff } from "@/lib/studenti/actions";
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

export type StudenteRiga = {
  id: string;
  nome: string;
  cognome: string;
  data_nascita: string;
  is_adulto: boolean;
  referente: string;
};

export function StudentiTable({ studenti }: { studenti: StudenteRiga[] }) {
  const router = useRouter();

  if (studenti.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessuno studente ancora.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Data di nascita</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Referente</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studenti.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">
              {s.nome} {s.cognome}
            </TableCell>
            <TableCell>{new Date(s.data_nascita).toLocaleDateString("it-IT")}</TableCell>
            <TableCell>
              <Badge variant={s.is_adulto ? "secondary" : "outline"}>
                {s.is_adulto ? "Allievo adulto" : "Minore"}
              </Badge>
            </TableCell>
            <TableCell>{s.referente}</TableCell>
            <TableCell className="text-right">
              <ConfirmActionDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Elimina
                  </Button>
                }
                title={`Eliminare ${s.nome} ${s.cognome}?`}
                description="Iscrizioni, presenze e pagamenti collegati verranno eliminati."
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await eliminaStudenteStaff(s.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Studente eliminato.");
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
