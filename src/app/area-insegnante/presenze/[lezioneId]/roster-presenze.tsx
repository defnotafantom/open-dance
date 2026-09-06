"use client";

import { useState, useTransition } from "react";
import { segnaPresenza, type StatoPresenza } from "@/lib/presenze/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type AllievoConPresenza = {
  id: string;
  nome: string;
  cognome: string;
  stato: StatoPresenza | null;
};

const OPZIONI: { value: StatoPresenza; label: string }[] = [
  { value: "presente", label: "Presente" },
  { value: "assente", label: "Assente" },
  { value: "giustificato", label: "Giustificato" },
];

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
        <li
          key={allievo.id}
          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium">
            {allievo.nome} {allievo.cognome}
          </span>
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
