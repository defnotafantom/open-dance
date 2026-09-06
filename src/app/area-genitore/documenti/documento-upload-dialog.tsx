"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { caricaDocumento } from "@/lib/documenti/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CameraIcon, FileUpIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DocumentoUploadDialog({
  studenti,
  trigger,
}: {
  studenti: { id: string; nome: string; cognome: string }[];
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [studenteId, setStudenteId] = useState(studenti[0]?.id ?? "");
  const [fileScelto, setFileScelto] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileScelto) {
      toast.error("Scatta una foto o scegli un file da caricare.");
      return;
    }
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("file", fileScelto);
    const result = await caricaDocumento(formData);
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Documento caricato.");
    setOpen(false);
    setFileScelto(null);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Carica documento</DialogTitle>
          <DialogDescription>PDF o immagine, massimo 10 MB.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="studente_id" value={studenteId} />
          {studenti.length > 1 && (
            <div className="grid gap-2">
              <Label>Figlio/a</Label>
              <Select value={studenteId} onValueChange={(v) => setStudenteId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string | null) => {
                      const s = studenti.find((s) => s.id === v);
                      return s ? `${s.nome} ${s.cognome}` : "Seleziona";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {studenti.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome} {s.cognome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo di documento</Label>
            <Input id="tipo" name="tipo" placeholder="Certificato medico sportivo" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="data_scadenza">Scadenza (opzionale)</Label>
            <Input id="data_scadenza" name="data_scadenza" type="date" />
          </div>
          <div className="grid gap-2">
            <Label>Documento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fotoInputRef.current?.click()}
              >
                <CameraIcon /> Scatta una foto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUpIcon /> Scegli un file
              </Button>
            </div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFileScelto(e.target.files?.[0] ?? null)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => setFileScelto(e.target.files?.[0] ?? null)}
            />
            {fileScelto && (
              <p className="text-muted-foreground truncate text-sm">
                Selezionato: {fileScelto.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Caricamento..." : "Carica"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
