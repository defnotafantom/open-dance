"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaEvento } from "@/lib/eventi/actions";
import { EventoFormDialog, type EventoEsistente } from "./evento-form-dialog";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EventiList({ eventi }: { eventi: EventoEsistente[] }) {
  const router = useRouter();

  if (eventi.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun evento in programma.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {eventi.map((evento) => (
        <Card key={evento.id}>
          <CardHeader>
            <CardTitle className="text-base">{evento.nome}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {new Date(evento.data).toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {evento.luogo ? ` · ${evento.luogo}` : ""}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {evento.descrizione && <p className="text-sm">{evento.descrizione}</p>}
            <div className="flex gap-2">
              <EventoFormDialog
                evento={evento}
                trigger={
                  <Button variant="outline" size="sm">
                    Modifica
                  </Button>
                }
              />
              <ConfirmActionDialog
                trigger={
                  <Button variant="destructive" size="sm">
                    Elimina
                  </Button>
                }
                title={`Eliminare "${evento.nome}"?`}
                confirmLabel="Elimina"
                onConfirm={async () => {
                  const result = await eliminaEvento(evento.id);
                  if (result.error) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Evento eliminato.");
                  router.refresh();
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
