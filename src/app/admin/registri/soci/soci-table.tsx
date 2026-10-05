"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aggiornaSocio, creaQuotaIscrizione } from "@/lib/registri/actions";
import { ATTIVITA, euro } from "@/lib/registri/costanti";
import type { Socio } from "@/lib/registri/dati";
import type { AttivitaSocio } from "@/lib/supabase/database.types";
import { TableSearch } from "@/components/table-search";
import { AvvisoChip } from "@/components/registri/avviso-chip";
import { Badge } from "@/components/ui/badge";
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

type RigaSocio = Socio & {
  ritardo: number;
  aperto: number;
  avvisi: { tipo: "da_versare" | "da_restituire"; importo: number; scaduto: boolean; voce: string }[];
};

export function SociTable({ soci }: { soci: RigaSocio[] }) {
  const [ricerca, setRicerca] = useState("");
  const [filtro, setFiltro] = useState<"attivi" | "tutti" | "ritardo">("attivi");

  const visibili = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    return soci.filter((s) => {
      if (filtro === "attivi" && !s.attivo) return false;
      if (filtro === "ritardo" && s.ritardo === 0) return false;
      if (!q) return true;
      return (
        `${s.nome} ${s.cognome} ${s.referente}`.toLowerCase().includes(q) ||
        String(s.numero_tessera ?? "") === q
      );
    });
  }, [soci, ricerca, filtro]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TableSearch value={ricerca} onChange={setRicerca} placeholder="Cerca per nome o numero tessera..." />
        {(["attivi", "tutti", "ritardo"] as const).map((f) => (
          <Button key={f} size="sm" variant={filtro === f ? "default" : "outline"} onClick={() => setFiltro(f)}>
            {f === "attivi" ? "Attivi" : f === "tutti" ? "Tutti" : "In ritardo"}
          </Button>
        ))}
      </div>

      {visibili.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun socio.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibili.map((s) => (
            <div key={s.id} className="panel-3d flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    Tessera {s.numero_tessera ?? "—"}
                  </p>
                  <Link href={`/admin/registri/soci/${s.id}`} className="block truncate font-display text-lg uppercase hover:text-primary">
                    {s.nome} {s.cognome}
                  </Link>
                  {s.referente !== `${s.nome} ${s.cognome}` && (
                    <p className="text-muted-foreground truncate text-xs">Referente: {s.referente}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline">{ATTIVITA.find((a) => a.value === s.attivita)?.label}</Badge>
                  {!s.attivo && <Badge variant="secondary">Non attivo</Badge>}
                </div>
              </div>
              {s.avvisi.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {s.avvisi.map((a, i) => (
                    <AvvisoChip key={i} avviso={a} contesto={a.voce} />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                {s.ritardo > 0 ? (
                  <span className="font-medium text-primary">
                    {s.ritardo} {s.ritardo === 1 ? "quota" : "quote"} in ritardo
                  </span>
                ) : s.aperto > 0 ? (
                  <span className="text-muted-foreground">Da pagare {euro(s.aperto)}</span>
                ) : (
                  <span className="text-muted-foreground">In regola</span>
                )}
                <div className="flex gap-2">
                  <QuotaIscrizioneButton studenteId={s.id} />
                  <ModificaSocio socio={s} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuotaIscrizioneButton({ studenteId }: { studenteId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const r = await creaQuotaIscrizione(studenteId);
        setPending(false);
        if (r.error) return void toast.error(r.error);
        toast.success("Quota di iscrizione creata.");
        router.refresh();
      }}
    >
      + Iscrizione
    </Button>
  );
}

function ModificaSocio({ socio }: { socio: RigaSocio }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [attivita, setAttivita] = useState<AttivitaSocio>(socio.attivita);
  const [tessera, setTessera] = useState(String(socio.numero_tessera ?? ""));
  const [data, setData] = useState(socio.data_tesseramento);
  const [attivo, setAttivo] = useState(socio.attivo);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const r = await aggiornaSocio(socio.id, {
      attivita,
      numero_tessera: tessera.trim() ? Number(tessera) : null,
      data_tesseramento: data,
      attivo,
    });
    setPending(false);
    if (r.error) return void toast.error(r.error);
    toast.success("Socio aggiornato.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline">Modifica</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {socio.nome} {socio.cognome}
          </DialogTitle>
          <DialogDescription>Dati di tesseramento del socio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={salva} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Attività</Label>
            <div className="flex flex-wrap gap-2">
              {ATTIVITA.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  aria-pressed={attivita === a.value}
                  onClick={() => setAttivita(a.value)}
                  className={
                    attivita === a.value
                      ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-sm"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="tessera">Numero tessera</Label>
              <Input id="tessera" inputMode="numeric" value={tessera} onChange={(e) => setTessera(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tesseramento">Tesseramento</Label>
              <Input id="tesseramento" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={attivo} onChange={(e) => setAttivo(e.target.checked)} />
            Socio attivo (riceve le quote mensili)
          </label>
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
