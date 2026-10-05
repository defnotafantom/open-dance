"use client";

import { useState } from "react";
import { decidiDaNotifica } from "./actions";
import { Button } from "@/components/ui/button";

export function DecisioneButtons({ id, firma }: { id: string; firma: string }) {
  const [esito, setEsito] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function decidi(decisione: "approvato" | "negato") {
    setPending(true);
    const r = await decidiDaNotifica(id, firma, decisione);
    setPending(false);
    setEsito(r.error ?? (decisione === "approvato" ? "Accesso approvato." : "Accesso negato."));
  }

  if (esito) return <p className="font-display text-lg uppercase">{esito}</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" disabled={pending} onClick={() => decidi("approvato")}>
        Approva
      </Button>
      <Button size="lg" variant="outline" disabled={pending} onClick={() => decidi("negato")}>
        Nega
      </Button>
    </div>
  );
}
