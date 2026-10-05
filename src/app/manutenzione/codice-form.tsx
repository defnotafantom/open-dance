"use client";

import { useActionState } from "react";
import { entra } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CodiceForm() {
  const [stato, azione, pending] = useActionState(entra, undefined);
  return (
    <form action={azione} className="flex w-full max-w-xs flex-col gap-3">
      <Input
        name="codice"
        type="password"
        autoComplete="off"
        placeholder="Codice d'accesso"
        aria-label="Codice d'accesso"
        className="text-center"
        required
      />
      {stato?.error && <p className="text-sm text-primary">{stato.error}</p>}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Verifica..." : "Entra"}
      </Button>
    </form>
  );
}
