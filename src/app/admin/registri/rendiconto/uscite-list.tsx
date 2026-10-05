"use client";

import { giornoRoma } from "@/lib/date";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eliminaUscita, salvaUscita } from "@/lib/registri/actions";
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

type Uscita = {
  id: string;
  data: string;
  categoria: string;
  descrizione: string;
  importo: number;
  metodo: PagamentoMetodoEnum;
  note: string;
};

export function UsciteList({ uscite, categorie }: { uscite: Uscita[]; categorie: string[] }) {
  const router = useRouter();
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase">Uscite</h2>
        <UscitaDialog categorie={categorie} trigger={<Button>Nuova spesa</Button>} />
      </div>
      {uscite.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna spesa registrata quest&apos;anno.</p>
      ) : (
        <div className="panel-3d overflow-hidden rounded-xl">
          <ul className="divide-y divide-border">
            {uscite.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{u.descrizione}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(u.data).toLocaleDateString("it-IT")} · {u.categoria} ·{" "}
                    {METODI.find((m) => m.value === u.metodo)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display">{euro(u.importo)}</span>
                  <UscitaDialog
                    uscita={u}
                    categorie={categorie}
                    trigger={<Button size="sm" variant="outline">Modifica</Button>}
                  />
                  <ConfirmActionDialog
                    trigger={<Button size="sm" variant="destructive">Elimina</Button>}
                    title="Eliminare questa spesa?"
                    confirmLabel="Elimina"
                    onConfirm={async () => {
                      const r = await eliminaUscita(u.id);
                      if (r.error) return void toast.error(r.error);
                      toast.success("Spesa eliminata.");
                      router.refresh();
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function UscitaDialog({
  uscita,
  categorie,
  trigger,
}: {
  uscita?: Uscita;
  categorie: string[];
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [data, setData] = useState(uscita?.data ?? giornoRoma());
  const [categoria, setCategoria] = useState(uscita?.categoria ?? categorie[0]);
  const [descrizione, setDescrizione] = useState(uscita?.descrizione ?? "");
  const [importo, setImporto] = useState(uscita ? String(uscita.importo) : "");
  const [metodo, setMetodo] = useState<PagamentoMetodoEnum>(uscita?.metodo ?? "bonifico");
  const [note, setNote] = useState(uscita?.note ?? "");

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await salvaUscita(uscita?.id ?? null, {
      data,
      categoria,
      descrizione,
      importo: Number(importo.replace(",", ".")),
      metodo,
      note,
    });
    setPending(false);
    if (r.error) return void toast.error(r.error);
    toast.success("Spesa salvata.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{uscita ? "Modifica spesa" : "Nuova spesa"}</DialogTitle>
          <DialogDescription>Conserva la fattura o lo scontrino della spesa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={salva} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="u-data">Data</Label>
              <Input id="u-data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-importo">Importo (€)</Label>
              <Input id="u-importo" inputMode="decimal" required value={importo} onChange={(e) => setImporto(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="u-categoria">Categoria</Label>
            <Input
              id="u-categoria"
              list="categorie-uscite"
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            <datalist id="categorie-uscite">
              {categorie.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="u-descrizione">Descrizione</Label>
            <Input id="u-descrizione" required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Es. Affitto sala ottobre" />
          </div>
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="u-note">Note</Label>
            <Input id="u-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
