"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { confermaPresenza } from "@/lib/conferme/actions";
import { Button } from "@/components/ui/button";
import { vibrataConferma } from "@/lib/haptics";

export type ProssimaLezione = {
  lezioneId: string;
  studenteId: string;
  studenteNome: string;
  corsoNome: string;
  data: string;
  orario: string;
  verra: boolean | null;
};

export function ProssimeLezioniList({ righe }: { righe: ProssimaLezione[] }) {
  const [stati, setStati] = useState<Record<string, boolean | null>>(
    Object.fromEntries(righe.map((r) => [`${r.lezioneId}:${r.studenteId}`, r.verra]))
  );
  const [pending, startTransition] = useTransition();

  if (righe.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nessuna lezione in programma nei prossimi 14 giorni.
      </p>
    );
  }

  function handleClick(lezioneId: string, studenteId: string, verra: boolean) {
    const key = `${lezioneId}:${studenteId}`;
    vibrataConferma();
    setStati((prev) => ({ ...prev, [key]: verra }));
    startTransition(async () => {
      const result = await confermaPresenza(lezioneId, studenteId, verra);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <ul className="flex flex-col gap-2">
      {righe.map((r) => {
        const key = `${r.lezioneId}:${r.studenteId}`;
        const stato = stati[key];
        return (
          <li
            key={key}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {r.corsoNome} — {r.studenteNome}
              </p>
              <p className="text-muted-foreground text-sm">
                {new Date(r.data).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                · {r.orario.slice(0, 5)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                variant={stato === true ? "default" : "outline"}
                onClick={() => handleClick(r.lezioneId, r.studenteId, true)}
              >
                Ci sarà
              </Button>
              <Button
                size="sm"
                disabled={pending}
                variant={stato === false ? "default" : "outline"}
                onClick={() => handleClick(r.lezioneId, r.studenteId, false)}
              >
                Non ci sarà
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
