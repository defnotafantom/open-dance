"use client";

import { useActionState } from "react";
import { aggiornaPassword } from "@/lib/auth/actions";
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

export function NuovaPasswordForm() {
  const [state, action, pending] = useActionState(aggiornaPassword, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imposta una nuova password</CardTitle>
        <CardDescription>Scegli la nuova password per il tuo account.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="password">Nuova password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.fieldErrors?.password && (
              <p className="text-destructive text-sm">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confermaPassword">Conferma password</Label>
            <Input
              id="confermaPassword"
              name="confermaPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {state?.fieldErrors?.confermaPassword && (
              <p className="text-destructive text-sm">
                {state.fieldErrors.confermaPassword[0]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Salvataggio..." : "Salva nuova password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
