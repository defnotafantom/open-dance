"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { richiediIscrizione } from "@/lib/iscrizioni/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type RinnovoDisponibile = {
  figlioId: string;
  figlioNome: string;
  corsoNome: string;
  classeVecchiaLabel: string;
  classeNuovaId: string;
  classeNuovaLabel: string;
};

export function RinnoviDisponibili({ rinnovi }: { rinnovi: RinnovoDisponibile[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  if (rinnovi.length === 0) {
    return null;
  }

  async function handleRinnova(r: RinnovoDisponibile) {
    setPending(r.classeNuovaId + r.figlioId);
    const result = await richiediIscrizione(r.figlioId, r.classeNuovaId);
    setPending(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Richiesta di rinnovo inviata.");
    router.refresh();
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-3 pt-6">
        <p className="font-medium">Rinnovi disponibili per la nuova stagione</p>
        <ul className="flex flex-col gap-2">
          {rinnovi.map((r) => (
            <li
              key={r.classeNuovaId + r.figlioId}
              className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span>
                <b>{r.figlioNome}</b> — {r.corsoNome}: da {r.classeVecchiaLabel} a{" "}
                {r.classeNuovaLabel}
              </span>
              <Button
                size="sm"
                disabled={pending === r.classeNuovaId + r.figlioId}
                onClick={() => handleRinnova(r)}
              >
                Rinnova
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
