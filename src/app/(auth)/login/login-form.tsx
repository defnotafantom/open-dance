"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth/actions";
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

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-tight">Accedi</CardTitle>
        <CardDescription>
          Entra con il codice iscritto (es. OD-0012) o con l&apos;email, e la password
          ricevuta dalla segreteria.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Codice iscritto o email</Label>
            <Input id="email" name="email" autoComplete="username" autoCapitalize="none" required />
            {state?.fieldErrors?.email && (
              <p className="text-destructive text-sm">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {state?.fieldErrors?.password && (
              <p className="text-destructive text-sm">{state.fieldErrors.password[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Accesso in corso..." : "Accedi"}
          </Button>
          <div className="flex w-full justify-between text-sm">
            <span className="text-muted-foreground">Nuovo? L&apos;accesso lo dà la segreteria.</span>
            <Link
              href="/recupera-password"
              className="text-muted-foreground hover:text-foreground"
            >
              Password dimenticata?
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
