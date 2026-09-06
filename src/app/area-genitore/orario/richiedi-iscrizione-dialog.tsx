"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { richiediIscrizione, ritiraRichiesta } from "@/lib/iscrizioni/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type FiglioConStato = {
  id: string;
  nome: string;
  cognome: string;
  iscrizioneId?: string;
  stato?: "richiesta" | "attiva" | "lista_attesa";
};

export function RichiediIscrizioneDialog({
  classeId,
  classeLabel,
  figli,
  trigger,
}: {
  classeId: string;
  classeLabel: string;
  figli: FiglioConStato[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRichiedi(studenteId: string) {
    setPendingId(studenteId);
    const result = await richiediIscrizione(studenteId, classeId);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Richiesta inviata. Lo staff la esaminera' a breve.");
    router.refresh();
  }

  async function handleRitira(iscrizioneId: string) {
    setPendingId(iscrizioneId);
    const result = await ritiraRichiesta(iscrizioneId);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Richiesta ritirata.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iscrivi a {classeLabel}</DialogTitle>
          <DialogDescription>
            Le richieste vengono confermate dallo staff della scuola.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {figli.map((figlio) => (
            <li key={figlio.id} className="flex items-center justify-between gap-3">
              <span>
                {figlio.nome} {figlio.cognome}
              </span>
              {figlio.stato === "attiva" ? (
                <Badge>Iscritto/a</Badge>
              ) : figlio.stato === "richiesta" || figlio.stato === "lista_attesa" ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {figlio.stato === "lista_attesa" ? "In lista d'attesa" : "In attesa"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendingId === figlio.iscrizioneId}
                    onClick={() => figlio.iscrizioneId && handleRitira(figlio.iscrizioneId)}
                  >
                    Ritira
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  disabled={pendingId === figlio.id}
                  onClick={() => handleRichiedi(figlio.id)}
                >
                  Richiedi
                </Button>
              )}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
