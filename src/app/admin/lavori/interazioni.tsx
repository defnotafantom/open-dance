"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { alternaRichiesta, eliminaProposta, proponi, segnaEvasa } from "@/lib/lavori/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PulsanteRichiesta({ voce, attiva, quanti }: { voce: string; attiva: boolean; quanti: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={attiva ? "default" : "outline"}
      aria-pressed={attiva}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await alternaRichiesta(voce);
          if (r.error) toast.error(r.error);
        })
      }
    >
      {attiva ? "Richiesta ✓" : "Lo vorrei"}
      {quanti > 0 && <span className="opacity-70"> · {quanti}</span>}
    </Button>
  );
}

export function ProponiForm() {
  const [testo, setTesto] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await proponi(testo);
          if (r.error) return void toast.error(r.error);
          toast.success("Proposta inviata.");
          setTesto("");
        });
      }}
    >
      <Textarea
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Cosa ti servirebbe? Descrivi il problema più che la soluzione: es. «perdo tempo a…»"
      />
      <div>
        <Button type="submit" disabled={pending || testo.trim().length < 3}>
          {pending ? "Invio..." : "Invia proposta"}
        </Button>
      </div>
    </form>
  );
}

export function Proposta({
  id,
  testo,
  autore,
  data,
  evasa,
  puoEliminare,
  webmaster,
}: {
  id: string;
  testo: string;
  autore: string;
  data: string;
  evasa: boolean;
  puoEliminare: boolean;
  webmaster: boolean;
}) {
  const [pending, start] = useTransition();
  const esegui = (azione: () => Promise<{ error?: string }>) =>
    start(async () => {
      const r = await azione();
      if (r.error) toast.error(r.error);
    });

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className={`text-sm whitespace-pre-line ${evasa ? "text-muted-foreground line-through" : ""}`}>{testo}</p>
        <p className="text-muted-foreground text-xs">
          {autore} · {data}
          {evasa && " · fatta"}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {webmaster && (
          <Button size="sm" variant="outline" disabled={pending} onClick={() => esegui(() => segnaEvasa(id, !evasa))}>
            {evasa ? "Riapri" : "Fatta"}
          </Button>
        )}
        {puoEliminare && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => esegui(() => eliminaProposta(id))}>
            Elimina
          </Button>
        )}
      </div>
    </li>
  );
}
