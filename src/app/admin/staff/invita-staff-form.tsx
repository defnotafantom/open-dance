"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export function InvitaStaffForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      nome: formData.get("nome"),
      cognome: formData.get("cognome"),
      email: formData.get("email"),
      ruolo: formData.get("ruolo"),
    };

    const res = await fetch("/api/invite-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(
        typeof body?.error === "string" ? body.error : "Invio dell'invito non riuscito."
      );
      return;
    }

    toast.success("Invito inviato.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cognome">Cognome</Label>
          <Input id="cognome" name="cognome" required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label>Ruolo</Label>
        <Select name="ruolo" defaultValue="staff">
          <SelectTrigger className="w-full">
            <SelectValue>
              {(value: string | null) =>
                value === "insegnante" ? "Insegnante" : "Staff / segreteria"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">Staff / segreteria</SelectItem>
            <SelectItem value="insegnante">Insegnante</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Invio in corso..." : "Invia invito"}
      </Button>
    </form>
  );
}
