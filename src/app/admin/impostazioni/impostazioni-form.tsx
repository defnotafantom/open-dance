"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aggiornaImpostazioniScuola } from "@/lib/impostazioni/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Impostazioni = {
  nome_scuola: string;
  anno_fondazione: number | null;
  indirizzo: string | null;
  telefono: string | null;
  email_contatto: string | null;
  denominazione_asd: string | null;
  codice_fiscale_asd: string | null;
  sede_legale: string | null;
  numero_registro: string | null;
};

export function ImpostazioniForm({ impostazioni }: { impostazioni: Impostazioni }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [nomeScuola, setNomeScuola] = useState(impostazioni.nome_scuola);
  const [annoFondazione, setAnnoFondazione] = useState(
    impostazioni.anno_fondazione?.toString() ?? ""
  );
  const [indirizzo, setIndirizzo] = useState(impostazioni.indirizzo ?? "");
  const [telefono, setTelefono] = useState(impostazioni.telefono ?? "");
  const [emailContatto, setEmailContatto] = useState(impostazioni.email_contatto ?? "");
  const [denominazione, setDenominazione] = useState(impostazioni.denominazione_asd ?? "");
  const [codiceFiscale, setCodiceFiscale] = useState(impostazioni.codice_fiscale_asd ?? "");
  const [sedeLegale, setSedeLegale] = useState(impostazioni.sede_legale ?? "");
  const [registro, setRegistro] = useState(impostazioni.numero_registro ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nomeScuola.trim()) {
      setError("Inserisci il nome della scuola.");
      return;
    }

    setPending(true);
    const result = await aggiornaImpostazioniScuola({
      nome_scuola: nomeScuola.trim(),
      anno_fondazione: annoFondazione.trim() ? Number(annoFondazione) : null,
      indirizzo: indirizzo.trim(),
      telefono: telefono.trim(),
      email_contatto: emailContatto.trim(),
      denominazione_asd: denominazione.trim(),
      codice_fiscale_asd: codiceFiscale.trim(),
      sede_legale: sedeLegale.trim(),
      numero_registro: registro.trim(),
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast.success("Impostazioni aggiornate.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="nome-scuola">Nome scuola</Label>
          <Input id="nome-scuola" value={nomeScuola} onChange={(e) => setNomeScuola(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="anno-fondazione">Anno di fondazione</Label>
          <Input
            id="anno-fondazione"
            type="number"
            value={annoFondazione}
            onChange={(e) => setAnnoFondazione(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="indirizzo">Indirizzo</Label>
        <Input id="indirizzo" value={indirizzo} onChange={(e) => setIndirizzo(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email-contatto">Email di contatto</Label>
          <Input
            id="email-contatto"
            type="email"
            value={emailContatto}
            onChange={(e) => setEmailContatto(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
        <div>
          <p className="text-sm font-medium">Dati dell&apos;associazione (ASD)</p>
          <p className="text-muted-foreground text-xs">
            Compaiono nell&apos;intestazione delle ricevute e in fondo al sito.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="denominazione">Denominazione ASD</Label>
          <Input
            id="denominazione"
            value={denominazione}
            onChange={(e) => setDenominazione(e.target.value)}
            placeholder="Es. Open Dance A.S.D."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="cf-asd">Codice fiscale</Label>
            <Input
              id="cf-asd"
              maxLength={16}
              value={codiceFiscale}
              onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="registro">N. Registro sport (RAS)</Label>
            <Input id="registro" value={registro} onChange={(e) => setRegistro(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sede-legale">Sede legale</Label>
          <Input id="sede-legale" value={sedeLegale} onChange={(e) => setSedeLegale(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
