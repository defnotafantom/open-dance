"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function VerificaForm() {
  const router = useRouter();
  const [codice, setCodice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function verifica(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { data: fattori } = await supabase.auth.mfa.listFactors();
    const totp = fattori?.totp.find((f) => f.status === "verified");
    if (!totp) {
      setPending(false);
      router.replace("/app");
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: codice });
    setPending(false);
    if (error) {
      setError("Codice non valido o scaduto. Riprova con quello nuovo.");
      setCodice("");
      return;
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase">Verifica accesso</CardTitle>
        <CardDescription>Inserisci il codice a 6 cifre dell&apos;app di autenticazione.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={verifica} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={codice}
            onChange={(e) => setCodice(e.target.value.replace(/\D/g, ""))}
            className="text-center font-display text-2xl tracking-[0.5em]"
            placeholder="000000"
          />
          <Button type="submit" disabled={pending || codice.length !== 6}>
            {pending ? "Verifica..." : "Entra"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
