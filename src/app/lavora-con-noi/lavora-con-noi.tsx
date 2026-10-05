"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { inviaCandidatura } from "@/lib/sito/actions";
import { TIPI_CANDIDATURA, TIPI_POSIZIONE } from "@/lib/sito/costanti";
import { MAX_CV_BYTES } from "@/lib/sito/schemas";
import type { TipoCandidatura, TipoPosizione } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BriefcaseIcon, CheckCircle2Icon, FileUpIcon, GraduationCapIcon, SparklesIcon } from "lucide-react";

type Posizione = { id: string; tipo: TipoPosizione; titolo: string; descrizione: string | null };

const PRESENTAZIONE_TIPI: Record<TipoPosizione, { icona: React.ElementType; testo: string }> = {
  personale: {
    icona: BriefcaseIcon,
    testo: "Segreteria, accoglienza, organizzazione eventi: le persone che fanno funzionare la scuola.",
  },
  insegnante_esterno: {
    icona: GraduationCapIcon,
    testo: "Insegnanti che vogliono portare il proprio stile e la propria esperienza nelle nostre sale.",
  },
  masterclass: {
    icona: SparklesIcon,
    testo: "Artisti e coreografi per stage e masterclass che aprono nuovi orizzonti alle nostre allieve e ai nostri allievi.",
  },
};

export function LavoraConNoi({ posizioni }: { posizioni: Posizione[] }) {
  const formRef = useRef<HTMLElement>(null);
  const [tipo, setTipo] = useState<TipoCandidatura>("spontanea");
  const [posizioneId, setPosizioneId] = useState<string | null>(null);

  function candidati(p: Posizione) {
    setTipo(p.tipo);
    setPosizioneId(p.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {TIPI_POSIZIONE.map((t, i) => {
        const { icona: Icona, testo } = PRESENTAZIONE_TIPI[t.value];
        const aperte = posizioni.filter((p) => p.tipo === t.value);
        return (
          <section key={t.value} className="border-t border-border px-6 py-14 sm:px-12 lg:px-24">
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
              <div className="flex flex-col gap-2">
                <span className="font-display text-3xl text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="flex items-center gap-2 font-display text-3xl uppercase tracking-tight">
                  <Icona className="size-6 text-primary" /> {t.label}
                </h2>
                <p className="text-muted-foreground">{testo}</p>
              </div>
              <div className="flex flex-col gap-4">
                {aperte.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Al momento nessuna posizione aperta: puoi comunque inviarci una candidatura
                    spontanea qui sotto.
                  </p>
                ) : (
                  aperte.map((p) => (
                    <article key={p.id} className="flex flex-col gap-3 rounded-xl panel-3d p-5">
                      <h3 className="font-display text-xl uppercase tracking-tight">{p.titolo}</h3>
                      {p.descrizione && (
                        <p className="whitespace-pre-line text-sm text-muted-foreground">
                          {p.descrizione}
                        </p>
                      )}
                      <Button size="sm" className="w-fit" onClick={() => candidati(p)}>
                        Candidati
                      </Button>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        );
      })}

      <section
        ref={formRef}
        id="candidatura"
        className="scroll-mt-16 border-t border-border bg-muted/40 px-6 py-16 sm:px-12 lg:px-24"
      >
        <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
          Invia la tua candidatura
        </h2>
        <p className="mt-1 mb-8 max-w-xl text-muted-foreground">
          Raccontaci chi sei e allega il tuo CV. Ti ricontatteremo se il tuo profilo è in linea con
          quello che cerchiamo.
        </p>
        <FormCandidatura
          posizioni={posizioni}
          tipo={tipo}
          setTipo={(t) => {
            setTipo(t);
            setPosizioneId(null);
          }}
          posizioneId={posizioneId}
          setPosizioneId={setPosizioneId}
        />
      </section>
    </>
  );
}

function FormCandidatura({
  posizioni,
  tipo,
  setTipo,
  posizioneId,
  setPosizioneId,
}: {
  posizioni: Posizione[];
  tipo: TipoCandidatura;
  setTipo: (t: TipoCandidatura) => void;
  posizioneId: string | null;
  setPosizioneId: (id: string | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviata, setInviata] = useState(false);
  const [cv, setCv] = useState<File | null>(null);
  const [consenso, setConsenso] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const posizioniTipo = posizioni.filter((p) => p.tipo === tipo);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const campi = new FormData(e.currentTarget);

    if (!consenso) {
      setError("Per inviare la candidatura serve il consenso al trattamento dei dati.");
      return;
    }
    if (cv && cv.size > MAX_CV_BYTES) {
      setError("Il CV supera i 4 MB consentiti.");
      return;
    }

    const formData = new FormData();
    formData.set(
      "dati",
      JSON.stringify({
        tipo,
        posizione_id: posizioneId,
        nome: campi.get("nome"),
        cognome: campi.get("cognome"),
        email: campi.get("email"),
        telefono: campi.get("telefono"),
        messaggio: campi.get("messaggio"),
        link_portfolio: campi.get("link_portfolio"),
        consenso_privacy: consenso,
      })
    );
    formData.set("sito_web", String(campi.get("sito_web") ?? ""));
    if (cv) formData.set("cv", cv);

    setPending(true);
    const result = await inviaCandidatura(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success("Candidatura inviata.");
    setInviata(true);
  }

  if (inviata) {
    return (
      <div className="flex max-w-xl items-start gap-3 rounded-xl panel-3d p-6">
        <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-primary" />
        <div>
          <p className="font-medium">Grazie, abbiamo ricevuto la tua candidatura.</p>
          <p className="text-sm text-muted-foreground">
            La leggeremo con attenzione e ti ricontatteremo all&apos;indirizzo email che ci hai
            lasciato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Per cosa ti candidi?</legend>
        <div className="flex flex-wrap gap-2">
          {TIPI_CANDIDATURA.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tipo === t.value}
              onClick={() => setTipo(t.value)}
              className={
                tipo === t.value
                  ? "rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground"
                  : "rounded-full border border-border bg-background px-4 py-1.5 text-sm hover:border-primary"
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      {posizioniTipo.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Posizione</legend>
          <div className="flex flex-wrap gap-2">
            <ChipPosizione attivo={posizioneId === null} onClick={() => setPosizioneId(null)}>
              Nessuna in particolare
            </ChipPosizione>
            {posizioniTipo.map((p) => (
              <ChipPosizione
                key={p.id}
                attivo={posizioneId === p.id}
                onClick={() => setPosizioneId(p.id)}
              >
                {p.titolo}
              </ChipPosizione>
            ))}
          </div>
        </fieldset>
      )}

      {/* Campo trappola per i bot: invisibile e ignorato da chi usa il sito. */}
      <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="sito_web">Lascia vuoto questo campo</label>
        <input id="sito_web" name="sito_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" name="nome" required autoComplete="given-name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cognome">Cognome *</Label>
          <Input id="cognome" name="cognome" required autoComplete="family-name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input id="telefono" name="telefono" type="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="messaggio">Presentati</Label>
        <Textarea
          id="messaggio"
          name="messaggio"
          rows={5}
          placeholder="La tua formazione, le tue esperienze, cosa vorresti portare a Open Dance..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="link_portfolio">Link a video o portfolio</Label>
        <Input
          id="link_portfolio"
          name="link_portfolio"
          type="url"
          placeholder="https://www.youtube.com/..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Curriculum (PDF, max 4 MB)</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => cvRef.current?.click()}>
            <FileUpIcon /> {cv ? "Cambia file" : "Allega CV"}
          </Button>
          {cv && <span className="text-sm text-muted-foreground">{cv.name}</span>}
        </div>
        <input
          ref={cvRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setCv(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="consenso"
          checked={consenso}
          onCheckedChange={(v) => setConsenso(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="consenso" className="font-normal leading-snug text-muted-foreground">
          Acconsento al trattamento dei miei dati personali e del CV da parte di Open Dance al solo
          scopo di valutare la mia candidatura. Posso chiederne la cancellazione in qualsiasi
          momento scrivendo alla scuola. *
        </Label>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Invio in corso..." : "Invia candidatura"}
      </Button>
    </form>
  );
}

function ChipPosizione({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={attivo}
      onClick={onClick}
      className={
        attivo
          ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm text-primary"
          : "rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:border-primary"
      }
    >
      {children}
    </button>
  );
}
