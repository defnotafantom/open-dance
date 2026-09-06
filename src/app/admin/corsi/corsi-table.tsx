"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaCorso } from "@/lib/corsi/actions";
import type { CorsoEsistente } from "./corso-form-dialog";
import { CorsoFormDialog } from "./corso-form-dialog";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { TableSearch } from "@/components/table-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CorsiTable({ corsi }: { corsi: CorsoEsistente[] }) {
  const router = useRouter();
  const [ricerca, setRicerca] = useState("");

  const filtrati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return corsi;
    return corsi.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.categoria ?? "").toLowerCase().includes(q) ||
        (c.livello ?? "").toLowerCase().includes(q)
    );
  }, [corsi, ricerca]);

  if (corsi.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nessun corso ancora. Creane uno per iniziare.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TableSearch value={ricerca} onChange={setRicerca} placeholder="Cerca per nome o categoria..." />
      {filtrati.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun corso corrisponde alla ricerca.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Livello</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrati.map((corso) => (
              <TableRow key={corso.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/corsi/${corso.id}`} className="hover:underline">
                    {corso.nome}
                  </Link>
                </TableCell>
                <TableCell>{corso.categoria || "—"}</TableCell>
                <TableCell>{corso.livello || "—"}</TableCell>
                <TableCell>
                  <Badge variant={corso.attivo ? "default" : "secondary"}>
                    {corso.attivo ? "Attivo" : "Non attivo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <CorsoFormDialog
                    corso={corso}
                    trigger={<Button variant="outline" size="sm">Modifica</Button>}
                  />
                  <ConfirmActionDialog
                    trigger={
                      <Button variant="destructive" size="sm">
                        Elimina
                      </Button>
                    }
                    title={`Eliminare "${corso.nome}"?`}
                    description="Questa azione non si puo' annullare. Le classi collegate verranno eliminate."
                    confirmLabel="Elimina"
                    onConfirm={async () => {
                      const result = await eliminaCorso(corso.id);
                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success("Corso eliminato.");
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
