"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cercaReferentePerEmail, creaIscrizioneManuale } from "@/lib/staff/actions";
import type { ReferenteTrovato } from "@/lib/staff/schemas";
import { CredenzialiCard, type CredenzialiMostrate } from "@/components/iscritti/credenziali-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ClasseOpzione = { id: string; label: string };

export function NuovaIscrizioneForm({
  classi,
  emailIniziale = "",
}: {
  classi: ClasseOpzione[];
  emailIniziale?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [esito, setEsito] = useState<{
    studenteId: string;
    credenziali?: CredenzialiMostrate;
    inAttesa: number;
  } | null>(null);

  // Passo 1: referente (chi gestisce l'account — genitore o allievo maggiorenne).
  const [email, setEmail] = useState(emailIniziale);
  const [ricercaFatta, setRicercaFatta] = useState(false);
  const [referenteTrovato, setReferenteTrovato] = useState<ReferenteTrovato | null>(null);
  const [nuovoReferenteNome, setNuovoReferenteNome] = useState("");
  const [nuovoReferenteCognome, setNuovoReferenteCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [privacyFirmata, setPrivacyFirmata] = useState(false);
  const [consensoFoto, setConsensoFoto] = useState(false);

  // Passo 2: iscritto (nuovo o gia' presente sotto il referente trovato).
  const [studenteEsistenteId, setStudenteEsistenteId] = useState("");
  const [nuovoIscritto, setNuovoIscritto] = useState(true);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [isAdulto, setIsAdulto] = useState(false);

  // Passo 3: iscrizione.
  const [classiScelte, setClassiScelte] = useState<string[]>([]);
  const [attivita, setAttivita] = useState<"danza" | "fitness" | "entrambe">("danza");
  const [quota, setQuota] = useState("");

  async function handleCerca() {
    if (!email.trim()) {
      toast.error("Inserisci un'email da cercare.");
      return;
    }
    setError(null);
    const risultato = await cercaReferentePerEmail(email);
    setReferenteTrovato(risultato);
    setRicercaFatta(true);
    setNuovoIscritto(!risultato || risultato.figli.length === 0);
    setStudenteEsistenteId(risultato?.figli[0]?.id ?? "");
  }

  // Arrivando dalla scheda di un iscritto ("Iscrivi ad altri corsi") la
  // famiglia e' gia' nota: la si cerca subito.
  const cercato = useRef(false);
  useEffect(() => {
    if (!emailIniziale || cercato.current) return;
    cercato.current = true;
    cercaReferentePerEmail(emailIniziale).then((risultato) => {
      setReferenteTrovato(risultato);
      setRicercaFatta(true);
      setNuovoIscritto(!risultato || risultato.figli.length === 0);
      setStudenteEsistenteId(risultato?.figli[0]?.id ?? "");
    });
  }, [emailIniziale]);

  function resetRicerca() {
    setRicercaFatta(false);
    setReferenteTrovato(null);
    setNuovoReferenteNome("");
    setNuovoReferenteCognome("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ricercaFatta) {
      toast.error("Cerca prima il referente per email.");
      return;
    }
    if (!referenteTrovato && (!nuovoReferenteNome.trim() || !nuovoReferenteCognome.trim())) {
      setError("Inserisci nome e cognome del nuovo referente.");
      return;
    }
    if (!referenteTrovato && !privacyFirmata) {
      setError("Serve il modulo privacy firmato prima di creare l'account.");
      return;
    }
    if (classiScelte.length === 0) {
      setError("Seleziona una classe.");
      return;
    }
    if (nuovoIscritto && (!nome.trim() || !cognome.trim() || !dataNascita)) {
      setError("Compila i dati dell'iscritto.");
      return;
    }
    if (!nuovoIscritto && !studenteEsistenteId) {
      setError("Seleziona l'iscritto da iscrivere alla classe.");
      return;
    }

    setPending(true);
    const result = await creaIscrizioneManuale({
      referente: referenteTrovato
        ? { modalita: "esistente", referente_id: referenteTrovato.id }
        : {
            modalita: "nuovo",
            email: email.trim().toLowerCase(),
            nome: nuovoReferenteNome.trim(),
            cognome: nuovoReferenteCognome.trim(),
            telefono: telefono.trim() || undefined,
            consenso_privacy: true as const,
            consenso_foto: consensoFoto,
          },
      studente: nuovoIscritto
        ? {
            tipo: "nuovo",
            nome: nome.trim(),
            cognome: cognome.trim(),
            data_nascita: dataNascita,
            codice_fiscale: codiceFiscale.trim() || undefined,
            is_adulto: isAdulto,
            attivita,
          }
        : { tipo: "esistente", studente_id: studenteEsistenteId },
      classi_ids: classiScelte,
      quota_concordata: quota.trim() ? Number(quota) : undefined,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      // L'account puo' essere stato creato anche se un passaggio dopo non e'
      // riuscito: le credenziali vanno comunque mostrate.
      if (result.credenziali) setEsito({ studenteId: result.studenteId ?? "", credenziali: result.credenziali, inAttesa: 0 });
      return;
    }

    toast.success("Iscrizione registrata.");
    setEsito({ studenteId: result.studenteId ?? "", credenziali: result.credenziali, inAttesa: result.inAttesa ?? 0 });
    router.refresh();
  }

  if (esito && !error) {
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <Alert>
          <AlertDescription>
            Iscrizione completata e registrata nella storia dell&apos;iscritto.
            {esito.inAttesa > 0 &&
              ` ${esito.inAttesa === 1 ? "Una classe era piena" : `${esito.inAttesa} classi erano piene`}: messo in lista d'attesa.`}
          </AlertDescription>
        </Alert>
        {esito.credenziali ? (
          <CredenzialiCard credenziali={esito.credenziali} />
        ) : (
          <p className="text-muted-foreground text-sm">
            La famiglia aveva già un accesso: usa le stesse credenziali.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {esito.studenteId && (
            <Button nativeButton={false} render={<Link href={`/admin/iscritti/${esito.studenteId}`}>Apri la scheda</Link>} />
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            Nuova iscrizione
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <Label>1. Referente (email dell&apos;account)</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@esempio.it"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (ricercaFatta) resetRicerca();
            }}
          />
          <Button type="button" variant="outline" onClick={handleCerca} className="shrink-0">
            Cerca
          </Button>
        </div>

        {ricercaFatta && referenteTrovato && (
          <p className="text-sm text-muted-foreground">
            Account trovato: <strong>{referenteTrovato.nome} {referenteTrovato.cognome}</strong>
            {referenteTrovato.figli.length > 0
              ? ` — ${referenteTrovato.figli.length} iscritto/i gia' collegato/i.`
              : " — nessun iscritto collegato ancora."}
          </p>
        )}

        {ricercaFatta && !referenteTrovato && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Nessun account con questa email: ne verrà creato uno nuovo con codice e
              password generati, da consegnare alla famiglia. Nessuna email viene inviata.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ref-nome">Nome referente</Label>
                <Input
                  id="ref-nome"
                  value={nuovoReferenteNome}
                  onChange={(e) => setNuovoReferenteNome(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ref-cognome">Cognome referente</Label>
                <Input
                  id="ref-cognome"
                  value={nuovoReferenteCognome}
                  onChange={(e) => setNuovoReferenteCognome(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ref-tel">Telefono (facoltativo)</Label>
              <Input id="ref-tel" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={privacyFirmata} onCheckedChange={(v) => setPrivacyFirmata(v === true)} />
              <span>
                Modulo privacy firmato e conservato in segreteria <span className="text-primary">(obbligatorio)</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={consensoFoto} onCheckedChange={(v) => setConsensoFoto(v === true)} />
              <span>Ha dato il consenso a foto e video</span>
            </label>
          </div>
        )}
      </div>

      {ricercaFatta && (
        <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
          <Label>2. Iscritto</Label>

          {referenteTrovato && referenteTrovato.figli.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="nuovo-iscritto"
                checked={nuovoIscritto}
                onCheckedChange={(v) => setNuovoIscritto(v === true)}
              />
              <Label htmlFor="nuovo-iscritto" className="font-normal">
                Aggiungi un nuovo iscritto (invece di sceglierne uno esistente)
              </Label>
            </div>
          )}

          {!nuovoIscritto && referenteTrovato && (
            <Select value={studenteEsistenteId} onValueChange={(v) => setStudenteEsistenteId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) => {
                    const f = referenteTrovato.figli.find((f) => f.id === v);
                    return f ? `${f.nome} ${f.cognome}` : "Seleziona l'iscritto";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {referenteTrovato.figli.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome} {f.cognome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {nuovoIscritto && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="st-nome">Nome</Label>
                  <Input id="st-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="st-cognome">Cognome</Label>
                  <Input id="st-cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="st-nascita">Data di nascita</Label>
                  <Input
                    id="st-nascita"
                    type="date"
                    value={dataNascita}
                    onChange={(e) => setDataNascita(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="st-cf">Codice fiscale (opzionale)</Label>
                  <Input id="st-cf" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="st-adulto"
                  checked={isAdulto}
                  onCheckedChange={(v) => setIsAdulto(v === true)}
                />
                <Label htmlFor="st-adulto" className="font-normal">
                  L&apos;iscritto e&apos; maggiorenne e si iscrive da solo (coincide con il referente)
                </Label>
              </div>
              <div className="grid gap-2">
                <Label>Attività</Label>
                <div className="flex flex-wrap gap-2">
                  {(["danza", "fitness", "entrambe"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={attivita === v}
                      onClick={() => setAttivita(v)}
                      className={
                        attivita === v
                          ? "rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                          : "rounded-full border border-border px-3 py-1.5 text-sm"
                      }
                    >
                      {v === "entrambe" ? "Danza + Fitness" : v === "danza" ? "Danza" : "Fitness"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg panel-3d p-4">
        <Label>3. Classi (anche più di una)</Label>
        <div className="flex flex-col gap-2">
          {classi.length === 0 && (
            <p className="text-muted-foreground text-sm">Nessuna classe attiva.</p>
          )}
          {classi.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={classiScelte.includes(c.id)}
                onCheckedChange={(v) =>
                  setClassiScelte((prev) =>
                    v === true ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                  )
                }
              />
              {c.label}
            </label>
          ))}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quota">Quota concordata (opzionale, €)</Label>
          <Input
            id="quota"
            type="number"
            min="0"
            step="0.01"
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Registrazione in corso..." : "Registra iscrizione"}
      </Button>
    </form>
  );
}
