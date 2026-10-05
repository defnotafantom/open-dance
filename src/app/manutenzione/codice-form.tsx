"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { controllaRichiesta, richiediAccesso } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CodiceForm({ statoIniziale }: { statoIniziale: string | null }) {
  const router = useRouter();
  const [stato, azione, pending] = useActionState(richiediAccesso, undefined);
  const [esito, setEsito] = useState<string | null>(statoIniziale);
  const inAttesa = stato?.inviata || esito === "in_attesa";

  // In attesa: chiede ogni 4 secondi se la richiesta e' stata decisa.
  useEffect(() => {
    if (!inAttesa) return;
    const timer = setInterval(async () => {
      const nuovo = await controllaRichiesta();
      if (nuovo === "approvato") {
        router.replace("/");
      } else if (nuovo && nuovo !== "in_attesa") {
        setEsito(nuovo);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [inAttesa, router]);

  // Gia' approvato (es. pagina ricaricata): fa partire la sessione ed entra.
  useEffect(() => {
    if (statoIniziale !== "approvato") return;
    controllaRichiesta().then(() => router.replace("/"));
  }, [statoIniziale, router]);

  if (esito === "approvato") {
    return <p className="font-display text-sm tracking-[0.15em] uppercase">Accesso in corso...</p>;
  }

  if (inAttesa && esito !== "negato" && esito !== "revocato") {
    return (
      <div className="panel-3d flex max-w-xs flex-col items-center gap-2 rounded-xl px-6 py-5">
        <span className="size-3 animate-pulse rounded-full bg-primary" aria-hidden />
        <p className="font-display text-sm tracking-[0.15em] uppercase">Richiesta inviata</p>
        <p className="text-sm text-muted-foreground">
          Attendi l&apos;approvazione della scuola. Questa pagina si aggiorna da sola.
        </p>
      </div>
    );
  }

  return (
    <form action={azione} className="flex w-full max-w-xs flex-col gap-3">
      {(esito === "negato" || esito === "revocato" || esito === "scaduto") && (
        <p className="text-sm text-primary">
          {esito === "scaduto"
            ? "Il tuo accesso è scaduto: puoi chiederne uno nuovo."
            : "L'accesso non è stato autorizzato."}
        </p>
      )}
      <Input name="nome" autoComplete="name" placeholder="Il tuo nome" aria-label="Il tuo nome" className="text-center" required />
      <Input
        name="codice"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Codice d'accesso"
        aria-label="Codice d'accesso"
        className="text-center"
        required
      />
      {stato?.error && <p className="text-sm text-primary">{stato.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Invio..." : "Chiedi l'accesso"}
      </Button>
    </form>
  );
}
