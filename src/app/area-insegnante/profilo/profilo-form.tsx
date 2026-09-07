"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { aggiornaProfiloInsegnante, caricaFotoInsegnante } from "@/lib/insegnanti/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CameraIcon, FileUpIcon } from "lucide-react";

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
  profilo,
}: {
  profiloId: string;
  fotoUrl: string | null;
  profilo: Profilo;
}) {
  const router = useRouter();
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        <Label htmlFor="carriera">Carriera</Label>
        <Textarea
          id="carriera"
          rows={4}
          placeholder="Formazione, compagnie, esperienze rilevanti..."
          value={carriera}
          onChange={(e) => setCarriera(e.target.value)}
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
