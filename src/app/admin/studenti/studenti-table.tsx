"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaStudenteStaff } from "@/lib/studenti/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { TableSearch } from "@/components/table-search";
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
  const [ricerca, setRicerca] = useState("");

  const filtrati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return studenti;
    return studenti.filter(
      (s) =>
        `${s.nome} ${s.cognome}`.toLowerCase().includes(q) ||
        s.referente.toLowerCase().includes(q)
    );
  }, [studenti, ricerca]);

  if (studenti.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessuno studente ancora.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <TableSearch value={ricerca} onChange={setRicerca} placeholder="Cerca per nome o referente..." />
      {filtrati.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuno studente corrisponde alla ricerca.</p>
      ) : (
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
            {filtrati.map((s) => (
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
      )}
    </div>
  );
}
