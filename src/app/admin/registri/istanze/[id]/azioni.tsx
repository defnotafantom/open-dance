"use client";

import { giornoRoma } from "@/lib/date";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aggiornaDovuto, aggiungiPartecipanti, registraRimborso, rimuoviPartecipante } from "@/lib/registri/istanze";
import { METODI, euro } from "@/lib/registri/costanti";
import type { PagamentoMetodoEnum } from "@/lib/supabase/database.types";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Opzione = { id: string; nome: string; tessera: number | null };

export function AggiungiAlunni({
  istanzaId,
  importoPredefinito,
  soci,
}: {
  istanzaId: string;
  importoPredefinito: number | null;
  soci: Opzione[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [cerca, setCerca] = useState("");
  const [scelti, setScelti] = useState<Record<string, string>>({});

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return soci.filter((s) => !q || s.nome.toLowerCase().includes(q) || String(s.tessera ?? "") === q);
  }, [soci, cerca]);

  function attiva(id: string, on: boolean) {
    setScelti((prev) => {
      const nuovo = { ...prev };
      if (on) nuovo[id] = importoPredefinito != null ? String(importoPredefinito) : "";
      else delete nuovo[id];
      return nuovo;
    });
  }

  async function salva() {
    const lista = Object.entries(scelti).map(([studente_id, importo]) => ({
      studente_id,
      importo: Number((importo || "0").replace(",", ".")),
    }));
    setPending(true);
    const r = await aggiungiPartecipanti(istanzaId, lista);
    setPending(false);
    if (r.error) return void toast.error(r.error);
    toast.success(`${lista.length} alunni aggiunti.`);
    setScelti({});
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Aggiungi alunni</Button>} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi alunni</DialogTitle>
          <DialogDescription>Scegli gli alunni e, se serve, cambia l&apos;importo di ognuno.</DialogDescription>
        </DialogHeader>
        <Input value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder="Cerca per nome o tessera..." />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => visibili.forEach((s) => attiva(s.id, true))}>
            Seleziona tutti
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setScelti({})}>
            Nessuno
          </Button>
        </div>
        <ul className="flex max-h-[45dvh] flex-col divide-y divide-border overflow-y-auto">
          {visibili.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nessun socio disponibile.</li>}
          {visibili.map((s) => {
            const on = s.id in scelti;
            return (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <input type="checkbox" checked={on} onChange={(e) => attiva(s.id, e.target.checked)} />
                <span className="flex-1 text-sm">
                  {s.nome}
                  {s.tessera && <span className="text-muted-foreground"> · n. {s.tessera}</span>}
                </span>
                {on && (
                  <Input
                    className="w-24"
                    inputMode="decimal"
                    aria-label={`Importo per ${s.nome}`}
                    value={scelti[s.id]}
                    onChange={(e) => setScelti((p) => ({ ...p, [s.id]: e.target.value }))}
                    placeholder="€"
                  />
                )}
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button disabled={pending || Object.keys(scelti).length === 0} onClick={salva}>
            {pending ? "Salvataggio..." : `Aggiungi (${Object.keys(scelti).length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AzioniVoce({
  istanzaId,
  pagamentoId,
  dovuto,
  nota,
}: {
  istanzaId: string;
  pagamentoId: string;
  dovuto: number;
  nota: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [importo, setImporto] = useState(String(dovuto));
  const [testo, setTesto] = useState(nota);
  const [pending, setPending] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline">Modifica</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quanto deve</DialogTitle>
            <DialogDescription>Importo e nota solo per questo alunno.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="v-importo">Dovuto (€)</Label>
            <Input id="v-importo" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="v-nota">Nota</Label>
            <Input id="v-nota" value={testo} onChange={(e) => setTesto(e.target.value)} placeholder="Es. taglia M, sconto fratelli" />
          </div>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                const r = await aggiornaDovuto(pagamentoId, Number(importo.replace(",", ".")), testo);
                setPending(false);
                if (r.error) return void toast.error(r.error);
                toast.success("Aggiornato.");
                setOpen(false);
                router.refresh();
              }}
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        trigger={<Button size="sm" variant="ghost">Togli</Button>}
        title="Togliere l'alunno da questa istanza?"
        description="Possibile solo se non ha ancora versato nulla."
        confirmLabel="Togli"
        onConfirm={async () => {
          const r = await rimuoviPartecipante(pagamentoId, istanzaId);
          if (r.error) return void toast.error(r.error);
          toast.success("Alunno tolto.");
          router.refresh();
        }}
      />
    </>
  );
}

export function RimborsoDialog({
  pagamentoId,
  massimo,
  beneficiario,
  trigger,
}: {
  pagamentoId: string;
  massimo: number;
  beneficiario: string;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [importo, setImporto] = useState(massimo.toFixed(2));
  const [data, setData] = useState(giornoRoma());
  const [metodo, setMetodo] = useState<PagamentoMetodoEnum>("contanti");
  const [chi, setChi] = useState(beneficiario);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restituisci</DialogTitle>
          <DialogDescription>Eccedenza da restituire: {euro(massimo)}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="r-importo">Importo (€)</Label>
            <Input id="r-importo" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="r-data">Data</Label>
            <Input id="r-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
        </div>
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
        <div className="grid gap-2">
          <Label htmlFor="r-chi">A chi</Label>
          <Input id="r-chi" value={chi} onChange={(e) => setChi(e.target.value)} />
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const r = await registraRimborso({
                pagamento_id: pagamentoId,
                importo: Number(importo.replace(",", ".")),
                data,
                metodo,
                beneficiario: chi,
              });
              setPending(false);
              if (r.error) return void toast.error(r.error);
              toast.success("Restituzione registrata.");
              setOpen(false);
              router.refresh();
            }}
          >
            Registra restituzione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
