"use client";

import { useActionState } from "react";
import Link from "next/link";
import { richiediResetPassword } from "@/lib/auth/actions";
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

export function RecuperaPasswordForm() {
  const [state, action, pending] = useActionState(richiediResetPassword, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-tight">Recupera password</CardTitle>
        <CardDescription>
          Inserisci la tua email: se l&apos;account esiste ti invieremo le
          istruzioni per reimpostare la password.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {state?.success && (
            <Alert>
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email && (
              <p className="text-destructive text-sm">{state.fieldErrors.email[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Invio in corso..." : "Invia istruzioni"}
          </Button>
          <Link href="/login" className="text-muted-foreground text-sm hover:text-foreground">
            Torna al login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
