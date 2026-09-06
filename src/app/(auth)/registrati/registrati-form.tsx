"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrati } from "@/lib/auth/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RegistratiForm() {
  const [state, action, pending] = useActionState(registrati, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea un account</CardTitle>
        <CardDescription>
          Per genitori e allievi maggiorenni. Lo staff riceve un invito
          separato dalla segreteria.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
              {state?.fieldErrors?.nome && (
                <p className="text-destructive text-sm">{state.fieldErrors.nome[0]}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cognome">Cognome</Label>
              <Input id="cognome" name="cognome" required />
              {state?.fieldErrors?.cognome && (
                <p className="text-destructive text-sm">{state.fieldErrors.cognome[0]}</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state?.fieldErrors?.email && (
              <p className="text-destructive text-sm">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Tipo di account</Label>
            <Select name="tipo" defaultValue="genitore">
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value === "allievo_adulto" ? "Allievo maggiorenne" : "Genitore"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="genitore">Genitore</SelectItem>
                <SelectItem value="allievo_adulto">Allievo maggiorenne</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
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
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creazione account..." : "Crea account"}
          </Button>
          <Link href="/login" className="text-muted-foreground text-sm hover:text-foreground">
            Hai gia&apos; un account? Accedi
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
