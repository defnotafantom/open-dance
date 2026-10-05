"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aggiornaIstanza, creaIstanza } from "@/lib/registri/istanze";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type IstanzaEsistente = {
  id: string;
  nome: string;
  descrizione: string | null;
  importo_predefinito: number | null;
  scadenza: string | null;
  chiusa: boolean;
};

export function IstanzaDialog({
  istanza,
  trigger,
}: {
  istanza?: IstanzaEsistente;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [nome, setNome] = useState(istanza?.nome ?? "");
  const [descrizione, setDescrizione] = useState(istanza?.descrizione ?? "");
  const [importo, setImporto] = useState(istanza?.importo_predefinito != null ? String(istanza.importo_predefinito) : "");
  const [conScadenza, setConScadenza] = useState(!!istanza?.scadenza);
  const [scadenza, setScadenza] = useState(istanza?.scadenza ?? "");
  const [chiusa, setChiusa] = useState(istanza?.chiusa ?? false);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    const dati = {
      nome,
      descrizione,
      importo_predefinito: importo.trim() ? Number(importo.replace(",", ".")) : null,
      scadenza: conScadenza && scadenza ? scadenza : null,
    };
    setPending(true);
    const r = istanza ? await aggiornaIstanza(istanza.id, dati, chiusa) : await creaIstanza(dati);
    setPending(false);
    if (r.error) return void toast.error(r.error);
    toast.success(istanza ? "Istanza aggiornata." : "Istanza creata.");
    setOpen(false);
    if (!istanza && "id" in r && r.id) router.push(`/admin/registri/istanze/${r.id}`);
    else router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{istanza ? "Modifica istanza" : "Nuova istanza"}</DialogTitle>
          <DialogDescription>
            La data di creazione la registra il server, in orario italiano.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={salva} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="i-nome">Nome</Label>
            <Input id="i-nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Abiti concorso" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="i-descrizione">Descrizione</Label>
            <Textarea id="i-descrizione" rows={3} value={descrizione} onChange={(e) => setDescrizione(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="i-importo">Importo per alunno (€, modificabile per ognuno)</Label>
            <Input id="i-importo" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label>Scadenza</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: false, l: "Nessuna scadenza" },
                { v: true, l: "Con scadenza" },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  aria-pressed={conScadenza === o.v}
                  onClick={() => setConScadenza(o.v)}
                  className={
                    conScadenza === o.v
                      ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-sm"
                  }
                >
                  {o.l}
                </button>
              ))}
            </div>
            {conScadenza && (
              <Input type="date" required value={scadenza} onChange={(e) => setScadenza(e.target.value)} />
            )}
          </div>
          {istanza && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={chiusa} onChange={(e) => setChiusa(e.target.checked)} />
              Istanza chiusa (non si aggiungono altri alunni)
            </label>
          )}
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
