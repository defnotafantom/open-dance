"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  eliminaContenutoScuola,
  eliminaPosizione,
  eliminaTraguardo,
  salvaContenutoScuola,
  salvaPosizione,
  salvaTraguardo,
} from "@/lib/sito/actions";
import {
  CATEGORIE_TRAGUARDO,
  SEZIONI_SCUOLA,
  TIPI_POSIZIONE,
  etichetta,
} from "@/lib/sito/costanti";
import { MAX_FOTO_BYTES } from "@/lib/sito/schemas";
import type {
  CategoriaTraguardo,
  SezioneScuola,
  TipoPosizione,
} from "@/lib/supabase/database.types";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

// =========================================================
// Pezzi comuni
// =========================================================

function Scelta<T extends string>({
  id,
  value,
  onChange,
  opzioni,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  opzioni: { value: T; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>{(v: string | null) => etichetta(opzioni, v as T)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opzioni.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CampoFoto({
  anteprima,
  onFile,
}: {
  anteprima: string | null;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {anteprima ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={anteprima} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
        {anteprima ? "Cambia foto" : "Aggiungi foto"}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function Miniatura({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
    </div>
  );
}

function BottoneElimina({
  titolo,
  onConfirm,
}: {
  titolo: string;
  onConfirm: () => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  return (
    <ConfirmActionDialog
      trigger={
        <Button variant="destructive" size="sm">
          Elimina
        </Button>
      }
      title={`Eliminare "${titolo}"?`}
      confirmLabel="Elimina"
      onConfirm={async () => {
        const result = await onConfirm();
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Eliminato.");
        router.refresh();
      }}
    />
  );
}

/** Stato condiviso dai dialog con foto: file scelto + anteprima + invio. */
function useFormConFoto(fotoIniziale: string | null) {
  const router = useRouter();
  const [foto, setFoto] = useState<File | null>(null);
  const [anteprima, setAnteprima] = useState(fotoIniziale);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function scegliFoto(file: File) {
    if (file.size > MAX_FOTO_BYTES) {
      setError("L'immagine supera i 4 MB consentiti.");
      return;
    }
    setError(null);
    setFoto(file);
    setAnteprima(URL.createObjectURL(file));
  }

  function reset() {
    setFoto(null);
    setAnteprima(fotoIniziale);
    setError(null);
  }

  async function invia(
    azione: (fd: FormData) => Promise<{ error?: string }>,
    id: string | undefined,
    dati: unknown
  ) {
    setError(null);
    const formData = new FormData();
    if (id) formData.set("id", id);
    formData.set("dati", JSON.stringify(dati));
    if (foto) formData.set("foto", foto);
    setPending(true);
    const result = await azione(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return false;
    }
    toast.success("Salvato.");
    router.refresh();
    return true;
  }

  return { anteprima, scegliFoto, reset, invia, pending, error };
}

// =========================================================
// La scuola
// =========================================================

type Contenuto = {
  id: string;
  sezione: SezioneScuola;
  titolo: string;
  descrizione: string;
  ordine: number;
  pubblicato: boolean;
  fotoUrl: string | null;
};

export function ContenutiScuola({ contenuti }: { contenuti: Contenuto[] }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <ContenutoDialog trigger={<Button>Nuovo contenuto</Button>} />
      </div>
      {SEZIONI_SCUOLA.map((s) => {
        const voci = contenuti.filter((c) => c.sezione === s.value);
        return (
          <div key={s.value} className="flex flex-col gap-3">
            <h2 className="font-display text-xl uppercase tracking-tight">{s.label}</h2>
            {voci.length === 0 ? (
              <p className="text-muted-foreground text-sm">Ancora nessun contenuto.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {voci.map((c) => (
                  <Card key={c.id}>
                    <CardHeader>
                      <Miniatura url={c.fotoUrl} />
                      <CardTitle className="flex items-center gap-2 text-base">
                        {c.titolo}
                        {!c.pubblicato && <Badge variant="outline">Bozza</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {c.descrizione && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {c.descrizione}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <ContenutoDialog
                          contenuto={c}
                          trigger={
                            <Button variant="outline" size="sm">
                              Modifica
                            </Button>
                          }
                        />
                        <BottoneElimina
                          titolo={c.titolo}
                          onConfirm={() => eliminaContenutoScuola(c.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContenutoDialog({
  contenuto,
  trigger,
}: {
  contenuto?: Contenuto;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const f = useFormConFoto(contenuto?.fotoUrl ?? null);
  const [sezione, setSezione] = useState<SezioneScuola>(contenuto?.sezione ?? "scuola");
  const [titolo, setTitolo] = useState(contenuto?.titolo ?? "");
  const [descrizione, setDescrizione] = useState(contenuto?.descrizione ?? "");
  const [ordine, setOrdine] = useState(String(contenuto?.ordine ?? 0));
  const [pubblicato, setPubblicato] = useState(contenuto?.pubblicato ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await f.invia(salvaContenutoScuola, contenuto?.id, {
      sezione,
      titolo,
      descrizione,
      ordine: Number(ordine) || 0,
      pubblicato,
    });
    if (ok) setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) f.reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contenuto ? "Modifica contenuto" : "Nuovo contenuto"}</DialogTitle>
          <DialogDescription>Una foto con titolo e descrizione nella pagina &quot;La scuola&quot;.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {f.error && (
            <Alert variant="destructive">
              <AlertDescription>{f.error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="sezione">Sezione</Label>
            <Scelta id="sezione" value={sezione} onChange={setSezione} opzioni={SEZIONI_SCUOLA} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titolo">Titolo</Label>
            <Input
              id="titolo"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="Sala grande"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descrizione">Descrizione</Label>
            <Textarea
              id="descrizione"
              rows={4}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Foto</Label>
            <CampoFoto anteprima={f.anteprima} onFile={f.scegliFoto} />
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ordine">Ordine</Label>
              <Input
                id="ordine"
                type="number"
                value={ordine}
                onChange={(e) => setOrdine(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="pubblicato"
                checked={pubblicato}
                onCheckedChange={(v) => setPubblicato(v === true)}
              />
              <Label htmlFor="pubblicato" className="font-normal">
                Pubblicato
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={f.pending}>
              {f.pending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================
// Speciale 28 anni
// =========================================================

type Traguardo = {
  id: string;
  anno: number;
  categoria: CategoriaTraguardo;
  titolo: string;
  contesto: string;
  risultato: string;
  ordine: number;
  pubblicato: boolean;
  fotoUrl: string | null;
};

export function Traguardi({ traguardi }: { traguardi: Traguardo[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground max-w-2xl text-sm">
        Per ogni voce racconta il <strong>contesto</strong>: com&apos;è nata, la preparazione, le
        difficoltà, cosa ha significato per le ragazze e i ragazzi. Il risultato è facoltativo. Le
        voci di categoria &quot;Ambizione&quot; compaiono in apertura della pagina.
      </p>
      <div>
        <TraguardoDialog trigger={<Button>Nuovo traguardo</Button>} />
      </div>
      {traguardi.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ancora nessun traguardo.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {traguardi.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <Miniatura url={t.fotoUrl} />
                <p className="text-sm text-muted-foreground">
                  {t.anno} · {etichetta(CATEGORIE_TRAGUARDO, t.categoria)}
                </p>
                <CardTitle className="flex items-center gap-2 text-base">
                  {t.titolo}
                  {!t.pubblicato && <Badge variant="outline">Bozza</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {t.contesto && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{t.contesto}</p>
                )}
                {t.risultato && <p className="text-sm font-medium">{t.risultato}</p>}
                <div className="flex gap-2">
                  <TraguardoDialog
                    traguardo={t}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    }
                  />
                  <BottoneElimina titolo={t.titolo} onConfirm={() => eliminaTraguardo(t.id)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TraguardoDialog({
  traguardo,
  trigger,
}: {
  traguardo?: Traguardo;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const f = useFormConFoto(traguardo?.fotoUrl ?? null);
  const [anno, setAnno] = useState(String(traguardo?.anno ?? new Date().getFullYear()));
  const [categoria, setCategoria] = useState<CategoriaTraguardo>(
    traguardo?.categoria ?? "concorso"
  );
  const [titolo, setTitolo] = useState(traguardo?.titolo ?? "");
  const [contesto, setContesto] = useState(traguardo?.contesto ?? "");
  const [risultato, setRisultato] = useState(traguardo?.risultato ?? "");
  const [ordine, setOrdine] = useState(String(traguardo?.ordine ?? 0));
  const [pubblicato, setPubblicato] = useState(traguardo?.pubblicato ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await f.invia(salvaTraguardo, traguardo?.id, {
      anno: Number(anno),
      categoria,
      titolo,
      contesto,
      risultato,
      ordine: Number(ordine) || 0,
      pubblicato,
    });
    if (ok) setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) f.reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{traguardo ? "Modifica traguardo" : "Nuovo traguardo"}</DialogTitle>
          <DialogDescription>Una voce dello Speciale 28 anni.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {f.error && (
            <Alert variant="destructive">
              <AlertDescription>{f.error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="anno">Anno</Label>
              <Input
                id="anno"
                type="number"
                min={1999}
                max={2100}
                required
                value={anno}
                onChange={(e) => setAnno(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Scelta
                id="categoria"
                value={categoria}
                onChange={setCategoria}
                opzioni={CATEGORIE_TRAGUARDO}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titolo-traguardo">Titolo</Label>
            <Input
              id="titolo-traguardo"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="La prima trasferta a un concorso nazionale"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contesto">Il contesto</Label>
            <Textarea
              id="contesto"
              rows={6}
              value={contesto}
              onChange={(e) => setContesto(e.target.value)}
              placeholder="Come ci siamo arrivati, quanto ci siamo preparati, cosa è successo prima e dopo, cosa ha insegnato a chi c'era..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="risultato">Risultato (facoltativo)</Label>
            <Input
              id="risultato"
              value={risultato}
              onChange={(e) => setRisultato(e.target.value)}
              placeholder="2° posto categoria gruppi junior"
            />
          </div>
          <div className="grid gap-2">
            <Label>Foto</Label>
            <CampoFoto anteprima={f.anteprima} onFile={f.scegliFoto} />
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ordine-traguardo">Ordine nell&apos;anno</Label>
              <Input
                id="ordine-traguardo"
                type="number"
                value={ordine}
                onChange={(e) => setOrdine(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="pubblicato-traguardo"
                checked={pubblicato}
                onCheckedChange={(v) => setPubblicato(v === true)}
              />
              <Label htmlFor="pubblicato-traguardo" className="font-normal">
                Pubblicato
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={f.pending}>
              {f.pending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================
// Lavora con noi
// =========================================================

type Posizione = {
  id: string;
  tipo: TipoPosizione;
  titolo: string;
  descrizione: string;
  attiva: boolean;
};

export function PosizioniAperte({ posizioni }: { posizioni: Posizione[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <PosizioneDialog trigger={<Button>Nuova posizione</Button>} />
      </div>
      {posizioni.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nessuna posizione aperta: sul sito resta comunque possibile la candidatura spontanea.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posizioni.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <p className="text-sm text-muted-foreground">
                  {etichetta(TIPI_POSIZIONE, p.tipo)}
                </p>
                <CardTitle className="flex items-center gap-2 text-base">
                  {p.titolo}
                  {!p.attiva && <Badge variant="outline">Chiusa</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {p.descrizione && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{p.descrizione}</p>
                )}
                <div className="flex gap-2">
                  <PosizioneDialog
                    posizione={p}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifica
                      </Button>
                    }
                  />
                  <BottoneElimina titolo={p.titolo} onConfirm={() => eliminaPosizione(p.id)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PosizioneDialog({
  posizione,
  trigger,
}: {
  posizione?: Posizione;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [tipo, setTipo] = useState<TipoPosizione>(posizione?.tipo ?? "insegnante_esterno");
  const [titolo, setTitolo] = useState(posizione?.titolo ?? "");
  const [descrizione, setDescrizione] = useState(posizione?.descrizione ?? "");
  const [attiva, setAttiva] = useState(posizione?.attiva ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await salvaPosizione(posizione?.id ?? null, {
      tipo,
      titolo,
      descrizione,
      attiva,
    });
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Salvato.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{posizione ? "Modifica posizione" : "Nuova posizione"}</DialogTitle>
          <DialogDescription>
            Compare nella pagina &quot;Lavora con noi&quot; finché è aperta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Scelta id="tipo" value={tipo} onChange={setTipo} opzioni={TIPI_POSIZIONE} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titolo-posizione">Titolo</Label>
            <Input
              id="titolo-posizione"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="Insegnante di danza contemporanea"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descrizione-posizione">Descrizione</Label>
            <Textarea
              id="descrizione-posizione"
              rows={5}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Cosa cerchiamo, giorni e orari, requisiti..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="attiva" checked={attiva} onCheckedChange={(v) => setAttiva(v === true)} />
            <Label htmlFor="attiva" className="font-normal">
              Posizione aperta
            </Label>
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
