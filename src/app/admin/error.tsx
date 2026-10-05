"use client";

import { Button } from "@/components/ui/button";

/**
 * Errore nel caricare una pagina dello staff: meglio un messaggio chiaro
 * che una lista vuota scambiata per "nessun dato".
 */
export default function ErroreAdmin({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel-3d flex max-w-xl flex-col gap-3 rounded-xl p-6">
      <p className="font-display text-xl uppercase">Dati non caricati</p>
      <p className="text-sm text-muted-foreground">
        La pagina non è riuscita a leggere i dati dal database. Se è appena stata aggiunta una
        funzione, potrebbe mancare una migrazione da applicare in Supabase.
      </p>
      <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs break-words">
        {error.message || "Errore sconosciuto"}
        {error.digest && ` (rif. ${error.digest})`}
      </p>
      <div>
        <Button variant="outline" onClick={reset}>
          Riprova
        </Button>
      </div>
    </div>
  );
}
