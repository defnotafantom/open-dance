"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheckIcon } from "lucide-react";

type Stato =
  | { fase: "caricamento" }
  | { fase: "attiva"; factorId: string }
  | { fase: "non-attiva" }
  | { fase: "configurazione"; factorId: string; qr: string; segreto: string };

export function DueFattori() {
  const [stato, setStato] = useState<Stato>({ fase: "caricamento" });
  const [codice, setCodice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function leggiStato(): Promise<Stato> {
    const { data } = await createClient().auth.mfa.listFactors();
    const attivo = data?.totp.find((f) => f.status === "verified");
    return attivo ? { fase: "attiva", factorId: attivo.id } : { fase: "non-attiva" };
  }

  async function aggiorna() {
    setStato(await leggiStato());
  }

  useEffect(() => {
    let montato = true;
    leggiStato().then((s) => {
      if (montato) setStato(s);
    });
    return () => {
      montato = false;
    };
  }, []);

  async function inizia() {
    setError(null);
    setPending(true);
    const supabase = createClient();
    // Elimina eventuali configurazioni lasciate a meta' in passato.
    const { data: esistenti } = await supabase.auth.mfa.listFactors();
    for (const f of esistenti?.all ?? []) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Open Dance ${new Date().toLocaleDateString("it-IT")}`,
    });
    setPending(false);
    if (error || !data) {
      setError(error?.message ?? "Impossibile avviare la configurazione.");
      return;
    }
    setStato({ fase: "configurazione", factorId: data.id, qr: data.totp.qr_code, segreto: data.totp.secret });
  }

  async function conferma(e: React.FormEvent) {
    e.preventDefault();
    if (stato.fase !== "configurazione") return;
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: stato.factorId, code: codice });
    setPending(false);
    if (error) {
      setError("Codice non valido. Controlla l'ora del telefono e usa il codice più recente.");
      return;
    }
    toast.success("Verifica in due passaggi attivata.");
    setCodice("");
    await aggiorna();
  }

  async function disattiva() {
    if (stato.fase !== "attiva") return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: stato.factorId });
    setPending(false);
    if (error) return void toast.error(error.message);
    toast.success("Verifica in due passaggi disattivata.");
    await aggiorna();
  }

  if (stato.fase === "caricamento") {
    return <p className="text-muted-foreground text-sm">Caricamento...</p>;
  }

  if (stato.fase === "attiva") {
    return (
      <div className="panel-3d flex flex-col gap-4 rounded-xl p-5">
        <p className="flex items-center gap-2 font-display text-lg uppercase">
          <ShieldCheckIcon className="size-5 text-primary" /> Attiva
        </p>
        <p className="text-muted-foreground text-sm">
          A ogni accesso, dopo la password, ti verrà chiesto il codice dell&apos;app.
        </p>
        <div>
          <Button variant="outline" disabled={pending} onClick={disattiva}>
            Disattiva
          </Button>
        </div>
      </div>
    );
  }

  if (stato.fase === "non-attiva") {
    return (
      <div className="panel-3d flex flex-col gap-4 rounded-xl p-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm">
          Ti serve un&apos;app di autenticazione sul telefono, per esempio Google Authenticator o
          Microsoft Authenticator (gratuite).
        </p>
        <div>
          <Button disabled={pending} onClick={inizia}>
            Attiva la verifica in due passaggi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={conferma} className="panel-3d flex flex-col gap-4 rounded-xl p-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>Apri l&apos;app di autenticazione e scegli &quot;aggiungi account&quot; / &quot;scansiona QR&quot;.</li>
        <li>Inquadra questo codice:</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stato.qr} alt="Codice QR da inquadrare" className="size-48 self-center rounded-lg bg-white p-2" />
      <p className="text-muted-foreground text-center text-xs break-all">
        Non riesci a inquadrarlo? Inserisci a mano: <span className="font-mono">{stato.segreto}</span>
      </p>
      <ol start={3} className="flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>Scrivi qui il codice a 6 cifre che compare nell&apos;app.</li>
      </ol>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={codice}
        onChange={(e) => setCodice(e.target.value.replace(/\D/g, ""))}
        className="text-center font-display text-2xl tracking-[0.5em]"
        placeholder="000000"
      />
      <Button type="submit" disabled={pending || codice.length !== 6}>
        {pending ? "Verifica..." : "Conferma e attiva"}
      </Button>
    </form>
  );
}
