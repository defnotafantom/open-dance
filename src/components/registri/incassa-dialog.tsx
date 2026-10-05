"use client";

import { giornoRoma } from "@/lib/date";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registraVersamento } from "@/lib/registri/actions";
import { METODI, NOTA_DETRAZIONE, euro } from "@/lib/registri/costanti";
import type { PagamentoMetodoEnum } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type QuotaDaIncassare = {
  id: string;
  socio: string;
  causale: string;
  residuo: number;
  pagatore: string;
};

export function IncassaDialog({
  quota,
  trigger,
}: {
  quota: QuotaDaIncassare;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importo, setImporto] = useState(quota.residuo.toFixed(2));
  const [data, setData] = useState(giornoRoma());
  const [metodo, setMetodo] = useState<PagamentoMetodoEnum>("contanti");
  const [pagatore, setPagatore] = useState(quota.pagatore);
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [causale, setCausale] = useState(quota.causale);
  const [stampa, setStampa] = useState(true);

  function reset() {
    setImporto(quota.residuo.toFixed(2));
    setData(giornoRoma());
    setMetodo("contanti");
    setPagatore(quota.pagatore);
    setCodiceFiscale("");
    setCausale(quota.causale);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await registraVersamento({
      pagamento_id: quota.id,
      importo: Number(importo.replace(",", ".")),
      data,
      metodo,
      pagatore_nome: pagatore,
      pagatore_codice_fiscale: codiceFiscale,
      causale,
    });
    setPending(false);
    if (result.error || !result.id) {
      setError(result.error ?? "Incasso non registrato.");
      return;
    }
    toast.success("Incasso registrato.");
    setOpen(false);
    router.refresh();
    if (stampa) window.open(`/stampa/ricevuta/${result.id}`, "_blank");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Incassa</DialogTitle>
          <DialogDescription>
            {quota.socio} · residuo {euro(quota.residuo)}. Viene emessa una ricevuta numerata.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="importo">Importo (€)</Label>
              <Input
                id="importo"
                inputMode="decimal"
                required
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          {Number(importo.replace(",", ".")) > quota.residuo + 0.001 && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs">
              Supera il dovuto di{" "}
              {euro(Number(importo.replace(",", ".")) - quota.residuo)}: l&apos;eccedenza risulterà
              &quot;da restituire&quot; finché non registri il rimborso.
            </p>
          )}
          <div className="grid gap-2">
            <Label>Metodo</Label>
            <div className="flex flex-wrap gap-2">
              {METODI.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={metodo === m.value}
                  onClick={() => setMetodo(m.value)}
                  className={
                    metodo === m.value
                      ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-sm"
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
            {metodo === "contanti" && (
              <p className="text-muted-foreground text-xs">{NOTA_DETRAZIONE}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pagatore">Chi paga (intestatario ricevuta)</Label>
            <Input id="pagatore" required value={pagatore} onChange={(e) => setPagatore(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cf">Codice fiscale di chi paga (facoltativo)</Label>
            <Input
              id="cf"
              maxLength={16}
              value={codiceFiscale}
              onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
              placeholder="Serve alla famiglia per la detrazione"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="causale">Causale</Label>
            <Input id="causale" required value={causale} onChange={(e) => setCausale(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={stampa} onChange={(e) => setStampa(e.target.checked)} />
            Apri la ricevuta da stampare
          </label>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Registrazione..." : "Registra incasso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
