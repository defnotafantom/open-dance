"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BenvenutoForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== conferma) {
      setError("Le password non coincidono.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = userData.user
      ? await supabase.from("profiles").select("ruolo").eq("id", userData.user.id).single()
      : { data: null };

    const area = ["webmaster", "proprietario", "co_proprietario", "segretario"].includes(
      profile?.ruolo ?? ""
    )
      ? "/admin"
      : profile?.ruolo === "insegnante"
        ? "/area-insegnante"
        : "/area-genitore";

    router.push(area);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benvenuto in Open Dance</CardTitle>
        <CardDescription>
          Imposta una password per completare l&apos;attivazione del tuo account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="conferma">Conferma password</Label>
            <Input
              id="conferma"
              type="password"
              autoComplete="new-password"
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Attivazione in corso..." : "Attiva account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
