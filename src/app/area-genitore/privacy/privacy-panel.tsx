"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  esportaIMieiDati,
  richiediCancellazioneDati,
  ritiraRichiestaCancellazione,
} from "@/lib/privacy/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RichiestaInAttesa = { id: string; stato: string; richiesto_at: string } | null;

export function PrivacyPanel({ richiestaInAttesa }: { richiestaInAttesa: RichiestaInAttesa }) {
  const router = useRouter();
  const [esportando, setEsportando] = useState(false);
  const [pending, setPending] = useState(false);
  const [confermaVisibile, setConfermaVisibile] = useState(false);

  async function handleEsporta() {
    setEsportando(true);
    const dati = await esportaIMieiDati();
    setEsportando(false);

    const blob = new Blob([JSON.stringify(dati, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "open-dance-i-miei-dati.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleRichiedi() {
    setPending(true);
    const result = await richiediCancellazioneDati();
    setPending(false);
    setConfermaVisibile(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Richiesta di cancellazione inviata. Lo staff la evadera' a breve.");
    router.refresh();
  }

  async function handleRitira() {
    if (!richiestaInAttesa) return;
    setPending(true);
    const result = await ritiraRichiestaCancellazione(richiestaInAttesa.id);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Richiesta ritirata.");
    router.refresh();
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <h2 className="font-semibold">Esporta i tuoi dati</h2>
        <p className="text-muted-foreground text-sm">
          Scarica un file con il tuo profilo, gli iscritti collegati, le
          iscrizioni, i pagamenti registrati e le presenze.
        </p>
        <Button variant="outline" className="w-fit" disabled={esportando} onClick={handleEsporta}>
          {esportando ? "Preparazione..." : "Scarica i miei dati"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <h2 className="font-semibold">Cancellazione dell&apos;account</h2>
        {richiestaInAttesa ? (
          <>
            <Alert>
              <AlertDescription>
                Richiesta inviata il{" "}
                {new Date(richiestaInAttesa.richiesto_at).toLocaleDateString("it-IT")}, in attesa
                che lo staff la evada.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-fit" disabled={pending} onClick={handleRitira}>
              Ritira la richiesta
            </Button>
          </>
        ) : confermaVisibile ? (
          <>
            <p className="text-sm text-muted-foreground">
              I dati identificativi tuoi e degli iscritti collegati (nome,
              codice fiscale, documenti, note mediche) verranno rimossi e non
              potrai piu&apos; accedere con questo account. Lo storico di
              iscrizioni e pagamenti resta, in forma anonima, per gli obblighi
              contabili della scuola. Confermi?
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" disabled={pending} onClick={handleRichiedi}>
                Si&apos;, richiedi la cancellazione
              </Button>
              <Button variant="ghost" onClick={() => setConfermaVisibile(false)}>
                Annulla
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              Puoi chiedere la cancellazione dei tuoi dati personali in
              qualsiasi momento.
            </p>
            <Button
              variant="destructive"
              className="w-fit"
              onClick={() => setConfermaVisibile(true)}
            >
              Richiedi la cancellazione dei dati
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
