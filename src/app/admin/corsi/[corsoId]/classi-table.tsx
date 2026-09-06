"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { eliminaClasse } from "@/lib/corsi/actions";
import { ClasseFormDialog, type ClasseEsistente, type Insegnante } from "./classe-form-dialog";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
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

export function ClassiTable({
  corsoId,
  classi,
  insegnanti,
}: {
  corsoId: string;
  classi: (ClasseEsistente & { insegnante_nome?: string })[];
  insegnanti: Insegnante[];
}) {
  const router = useRouter();

  if (classi.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nessuna classe per questo corso. Creane una per definire l&apos;orario.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Giorno</TableHead>
          <TableHead>Orario</TableHead>
          <TableHead>Insegnante</TableHead>
          <TableHead>Sala</TableHead>
          <TableHead>Stagione</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classi.map((classe) => (
          <TableRow key={classe.id}>
            <TableCell>{GIORNI_SETTIMANA[classe.giorno_settimana]}</TableCell>
            <TableCell>
              {classe.orario_inizio.slice(0, 5)}–{classe.orario_fine.slice(0, 5)}
            </TableCell>
            <TableCell>{classe.insegnante_nome ?? "—"}</TableCell>
            <TableCell>{classe.sala || "—"}</TableCell>
            <TableCell>{classe.stagione}</TableCell>
            <TableCell>
              <Badge variant={classe.attiva ? "default" : "secondary"}>
                {classe.attiva ? "Attiva" : "Non attiva"}
              </Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2 text-right">
              <ClasseFormDialog
                corsoId={corsoId}
                classe={classe}
                insegnanti={insegnanti}
                trigger={<Button variant="outline" size="sm">Modifica</Button>}
              />
              <ConfirmActionDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Elimina
                  </Button>
                }
                title="Eliminare questa classe?"
                description="Le iscrizioni e le presenze collegate verranno eliminate."
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await eliminaClasse(classe.id, corsoId);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Classe eliminata.");
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
