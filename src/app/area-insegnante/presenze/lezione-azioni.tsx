"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { annullaLezione, programmaRecupero } from "@/lib/lezioni/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LezioneAzioni({
  lezioneId,
  classeId,
  stato,
  orarioInizioDefault,
  orarioFineDefault,
  recuperoData,
}: {
  lezioneId: string;
  classeId: string;
  stato: string;
  orarioInizioDefault: string;
  orarioFineDefault: string;
  recuperoData?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleAnnulla(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const result = await annullaLezione(lezioneId, classeId);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lezione annullata.");
    router.refresh();
  }

  async function handleRecupero(formData: FormData) {
    const data = String(formData.get("data"));
    const orarioInizio = String(formData.get("orario_inizio"));
    const orarioFine = String(formData.get("orario_fine"));
    setPending(true);
    const result = await programmaRecupero(lezioneId, classeId, data, orarioInizio, orarioFine);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Recupero programmato.");
    setOpen(false);
    router.refresh();
  }

  if (recuperoData) {
    return (
      <span className="text-muted-foreground text-xs">
        Recupero: {new Date(recuperoData).toLocaleDateString("it-IT")}
      </span>
    );
  }

  if (stato === "regolare") {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={handleAnnulla}>
        Annulla
      </Button>
    );
  }

  if (stato === "annullata") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button size="sm" variant="outline">
              Programma recupero
            </Button>
          }
        />
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Programma un recupero</DialogTitle>
            <DialogDescription>
              Crea una nuova lezione per questa classe in sostituzione di quella annullata.
            </DialogDescription>
          </DialogHeader>
          <form action={handleRecupero} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="orario_inizio">Inizio</Label>
                <Input
                  id="orario_inizio"
                  name="orario_inizio"
                  type="time"
                  defaultValue={orarioInizioDefault}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="orario_fine">Fine</Label>
                <Input
                  id="orario_fine"
                  name="orario_fine"
                  type="time"
                  defaultValue={orarioFineDefault}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvataggio..." : "Programma"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
