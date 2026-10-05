"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  aggiornaProfiloInsegnante,
  caricaCvInsegnante,
  caricaFotoInsegnante,
  rimuoviCvInsegnante,
} from "@/lib/insegnanti/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CameraIcon, FileTextIcon, FileUpIcon } from "lucide-react";

type Profilo = {
  bio: string;
  carriera: string;
  specializzazioni: string;
  anni_esperienza: number | null;
  pubblicato: boolean;
};

export function ProfiloInsegnanteForm({
  profiloId,
  fotoUrl,
  cvUrl,
  profilo,
}: {
  profiloId: string;
  fotoUrl: string | null;
  cvUrl: string | null;
  profilo: Profilo;
}) {
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [pendingCv, setPendingCv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingFoto, setPendingFoto] = useState(false);
  const [anteprimaFoto, setAnteprimaFoto] = useState(fotoUrl);

  const [bio, setBio] = useState(profilo.bio);
  const [carriera, setCarriera] = useState(profilo.carriera);
  const [specializzazioni, setSpecializzazioni] = useState(profilo.specializzazioni);
  const [anniEsperienza, setAnniEsperienza] = useState(profilo.anni_esperienza?.toString() ?? "");
  const [pubblicato, setPubblicato] = useState(profilo.pubblicato);

  async function handleFotoChange(file: File | undefined) {
    if (!file) return;
    setAnteprimaFoto(URL.createObjectURL(file));
    setPendingFoto(true);
    const formData = new FormData();
    formData.set("profilo_id", profiloId);
    formData.set("file", file);
    const result = await caricaFotoInsegnante(formData);
    setPendingFoto(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Foto aggiornata.");
    router.refresh();
  }

  async function handleCvChange(file: File | undefined) {
    if (!file) return;
    setPendingCv(true);
    const formData = new FormData();
    formData.set("profilo_id", profiloId);
    formData.set("file", file);
    const result = await caricaCvInsegnante(formData);
    setPendingCv(false);
    if (cvInputRef.current) cvInputRef.current.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("CV caricato.");
    router.refresh();
  }

  async function handleCvRemove() {
    setPendingCv(true);
    const result = await rimuoviCvInsegnante(profiloId);
    setPendingCv(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("CV rimosso.");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await aggiornaProfiloInsegnante(profiloId, {
      bio,
      carriera,
      specializzazioni,
      anni_esperienza: anniEsperienza.trim() ? Number(anniEsperienza) : null,
      pubblicato,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Profilo salvato.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <Label>Foto</Label>
        <div className="flex items-center gap-4">
          <div className="size-20 shrink-0 overflow-hidden rounded-full bg-muted">
            {anteprimaFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={anteprimaFoto} alt="" className="size-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingFoto}
              onClick={() => fotoInputRef.current?.click()}
            >
              <CameraIcon /> Scatta una foto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingFoto}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUpIcon /> Scegli un file
            </Button>
          </div>
        </div>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => handleFotoChange(e.target.files?.[0])}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFotoChange(e.target.files?.[0])}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="specializzazioni">Specializzazioni</Label>
        <Input
          id="specializzazioni"
          placeholder="Hip Hop, Contemporaneo"
          value={specializzazioni}
          onChange={(e) => setSpecializzazioni(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="anni">Anni di esperienza</Label>
        <Input
          id="anni"
          type="number"
          min="0"
          value={anniEsperienza}
          onChange={(e) => setAnniEsperienza(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Chi sei (bio)</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Racconta chi sei e il tuo percorso nella danza..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="carriera">Il mio percorso</Label>
        <Textarea
          id="carriera"
          rows={6}
          placeholder={"Una tappa per riga, es.\n2008 · Diploma all'Accademia...\n2012 · Compagnia...\n2018 · Inizio a insegnare a Open Dance"}
          value={carriera}
          onChange={(e) => setCarriera(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <Label>Curriculum (PDF)</Label>
        <p className="text-muted-foreground text-xs">
          Chi visita la tua pagina potrà scaricarlo. Massimo 4 MB.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {cvUrl && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a href={cvUrl} target="_blank" rel="noreferrer">
                  <FileTextIcon /> Vedi CV attuale
                </a>
              }
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingCv}
            onClick={() => cvInputRef.current?.click()}
          >
            <FileUpIcon /> {cvUrl ? "Sostituisci CV" : "Carica CV"}
          </Button>
          {cvUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pendingCv}
              onClick={handleCvRemove}
            >
              Rimuovi
            </Button>
          )}
        </div>
        <input
          ref={cvInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleCvChange(e.target.files?.[0])}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="pubblicato"
          checked={pubblicato}
          onCheckedChange={(v) => setPubblicato(v === true)}
        />
        <Label htmlFor="pubblicato" className="font-normal">
          Visibile pubblicamente nella pagina &quot;Gli insegnanti&quot;
        </Label>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvataggio..." : "Salva"}
      </Button>
    </form>
  );
}
