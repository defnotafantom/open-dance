"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { annullaVersamento } from "@/lib/registri/actions";
import { METODI, euro } from "@/lib/registri/costanti";
import type { PagamentoMetodoEnum } from "@/lib/supabase/database.types";
import { TableSearch } from "@/components/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Ricevuta = {
  id: string;
  anno: number;
  numero: number;
  importo: number;
  data: string;
  metodo: PagamentoMetodoEnum;
  pagatore_nome: string;
  causale: string;
  annullato: boolean;
  motivo_annullamento: string | null;
};

export function RicevuteList({ anno, ricevute }: { anno: number; ricevute: Ricevuta[] }) {
  const router = useRouter();
  const [ricerca, setRicerca] = useState("");
  const visibili = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    if (!q) return ricevute;
    return ricevute.filter(
      (r) =>
        `${r.pagatore_nome} ${r.causale}`.toLowerCase().includes(q) || String(r.numero) === q
    );
  }, [ricevute, ricerca]);
  const totale = ricevute.filter((r) => !r.annullato).reduce((t, r) => t + Number(r.importo), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/registri/ricevute?anno=${anno - 1}`)}>
          &larr; {anno - 1}
        </Button>
        <span className="font-display text-xl">{anno}</span>
        <Button size="sm" variant="outline" onClick={() => router.push(`/admin/registri/ricevute?anno=${anno + 1}`)}>
          {anno + 1} &rarr;
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<a href={`/admin/registri/ricevute/export?anno=${anno}`}>CSV ricevute {anno}</a>} />
        <Button size="sm" variant="outline" nativeButton={false} render={<a href="/admin/pagamenti/export">CSV situazione quote</a>} />
        <span className="text-muted-foreground ml-auto text-sm">
          {ricevute.length} ricevute · valide {euro(totale)}
        </span>
      </div>
      <TableSearch value={ricerca} onChange={setRicerca} placeholder="Cerca per nome, causale o numero..." />
      {visibili.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna ricevuta.</p>
      ) : (
        <div className="panel-3d overflow-hidden rounded-xl">
          <ul className="divide-y divide-border">
            {visibili.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span className="font-display">
                      N. {r.numero}/{r.anno}
                    </span>{" "}
                    · {r.pagatore_nome}
                    {r.annullato && (
                      <Badge variant="destructive" className="ml-2">
                        Annullata
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {new Date(r.data).toLocaleDateString("it-IT")} · {METODI.find((m) => m.value === r.metodo)?.label} ·{" "}
                    {r.causale}
                    {r.annullato && r.motivo_annullamento && ` · motivo: ${r.motivo_annullamento}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-display ${r.annullato ? "line-through opacity-50" : ""}`}>
                    {euro(Number(r.importo))}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a href={`/stampa/ricevuta/${r.id}`} target="_blank" rel="noreferrer">
                        Stampa
                      </a>
                    }
                  />
                  {!r.annullato && <AnnullaRicevuta id={r.id} numero={`${r.numero}/${r.anno}`} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AnnullaRicevuta({ id, numero }: { id: string; numero: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="destructive">Annulla</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annullare la ricevuta n. {numero}?</DialogTitle>
          <DialogDescription>
            La ricevuta resta nel registro come annullata (la numerazione non si interrompe) e
            l&apos;importo torna da pagare sulla quota.
          </DialogDescription>
        </DialogHeader>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (es. importo sbagliato)" />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || !motivo.trim()}
            onClick={async () => {
              setPending(true);
              const r = await annullaVersamento(id, motivo);
              setPending(false);
              if (r.error) return void toast.error(r.error);
              toast.success("Ricevuta annullata.");
              setOpen(false);
              router.refresh();
            }}
          >
            Annulla ricevuta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
