"use client";

import { useState, useTransition } from "react";
import { segnaComunicazioneLetta } from "@/lib/comunicazioni/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ComunicazioneRiga = {
  id: string;
  titolo: string;
  corpo: string;
  pubblicato_at: string | null;
  created_at: string;
};

export function AnnouncementCard({
  comunicazione,
  letta: lettaIniziale,
}: {
  comunicazione: ComunicazioneRiga;
  letta: boolean;
}) {
  const [letta, setLetta] = useState(lettaIniziale);
  const [pending, startTransition] = useTransition();

  return (
    <li className="rounded-lg panel-3d p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{comunicazione.titolo}</h3>
        {!letta && <Badge variant="secondary">Nuovo</Badge>}
      </div>
      <p className="text-muted-foreground text-xs">
        {new Date(comunicazione.pubblicato_at ?? comunicazione.created_at).toLocaleDateString(
          "it-IT",
          { day: "numeric", month: "long", year: "numeric" }
        )}
      </p>
      <p className="mt-2 text-sm whitespace-pre-wrap">{comunicazione.corpo}</p>
      {!letta && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await segnaComunicazioneLetta(comunicazione.id);
              if (!result.error) {
                setLetta(true);
              }
            })
          }
        >
          Segna come letta
        </Button>
      )}
    </li>
  );
}
