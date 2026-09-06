"use client";

import { useState, useTransition } from "react";
import { segnaPresenza, type StatoPresenza } from "@/lib/presenze/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type AllievoConPresenza = {
  id: string;
  nome: string;
  cognome: string;
  stato: StatoPresenza | null;
  verra: boolean | null;
};

const OPZIONI: { value: StatoPresenza; label: string }[] = [
  { value: "presente", label: "Presente" },
  { value: "assente", label: "Assente" },
  { value: "giustificato", label: "Giustificato" },
];

function BadgeConferma({ verra }: { verra: boolean | null }) {
  if (verra === true) return <Badge variant="secondary">Ha confermato</Badge>;
  if (verra === false) return <Badge variant="destructive">Non verrà</Badge>;
  return <Badge variant="outline">Nessuna risposta</Badge>;
}

export function RosterPresenze({
  lezioneId,
  allievi,
}: {
  lezioneId: string;
  allievi: AllievoConPresenza[];
}) {
  const [stati, setStati] = useState<Record<string, StatoPresenza | null>>(
    Object.fromEntries(allievi.map((a) => [a.id, a.stato]))
  );
  const [pending, startTransition] = useTransition();

  function handleClick(studenteId: string, stato: StatoPresenza) {
    setStati((prev) => ({ ...prev, [studenteId]: stato }));
    startTransition(async () => {
      const result = await segnaPresenza(lezioneId, studenteId, stato);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  if (allievi.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun allievo iscritto a questa classe.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {allievi.map((allievo) => (
        <li key={allievo.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">
              {allievo.nome} {allievo.cognome}
            </span>
            <BadgeConferma verra={allievo.verra} />
          </div>
          <div className="flex gap-2">
            {OPZIONI.map((opzione) => (
              <Button
                key={opzione.value}
                size="sm"
                disabled={pending}
                variant={stati[allievo.id] === opzione.value ? "default" : "outline"}
                onClick={() => handleClick(allievo.id, opzione.value)}
              >
                {opzione.label}
              </Button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
