"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  aggiornaStatoCandidatura,
  eliminaCandidatura,
  linkCvCandidatura,
} from "@/lib/sito/actions";
import { STATI_CANDIDATURA, TIPI_CANDIDATURA, etichetta } from "@/lib/sito/costanti";
import type { StatoCandidatura, TipoCandidatura } from "@/lib/supabase/database.types";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileTextIcon, LinkIcon, MailIcon, PhoneIcon } from "lucide-react";

type Candidatura = {
  id: string;
  tipo: TipoCandidatura;
  posizione: string | null;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  messaggio: string | null;
  link_portfolio: string | null;
  haCv: boolean;
  stato: StatoCandidatura;
  created_at: string;
};

export function CandidatureList({ candidature }: { candidature: Candidatura[] }) {
  const [filtro, setFiltro] = useState<StatoCandidatura | "tutte">("nuova");
  const visibili =
    filtro === "tutte" ? candidature : candidature.filter((c) => c.stato === filtro);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {[{ value: "tutte" as const, label: "Tutte" }, ...STATI_CANDIDATURA].map((s) => {
          const conteggio =
            s.value === "tutte"
              ? candidature.length
              : candidature.filter((c) => c.stato === s.value).length;
          return (
            <Button
              key={s.value}
              size="sm"
              variant={filtro === s.value ? "default" : "outline"}
              onClick={() => setFiltro(s.value)}
            >
              {s.label} ({conteggio})
            </Button>
          );
        })}
      </div>

      {visibili.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna candidatura.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibili.map((c) => (
            <CandidaturaCard key={c.id} candidatura={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidaturaCard({ candidatura: c }: { candidatura: Candidatura }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function cambiaStato(stato: StatoCandidatura) {
    setPending(true);
    const result = await aggiornaStatoCandidatura(c.id, stato);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function apriCv() {
    // La finestra va aperta subito (nel gesto dell'utente) o i browser la
    // bloccano come popup; l'URL firmato arriva dopo.
    const finestra = window.open("", "_blank");
    const result = await linkCvCandidatura(c.id);
    if (result.error || !result.url) {
      finestra?.close();
      toast.error(result.error ?? "CV non disponibile.");
      return;
    }
    if (finestra) finestra.location.href = result.url;
    else window.location.href = result.url;
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">
          {etichetta(TIPI_CANDIDATURA, c.tipo)}
          {c.posizione ? ` · ${c.posizione}` : ""} ·{" "}
          {new Date(c.created_at).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <CardTitle className="flex items-center gap-2 text-base">
          {c.nome} {c.cognome}
          <Badge variant={c.stato === "nuova" ? "default" : "outline"}>
            {etichetta(STATI_CANDIDATURA, c.stato)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-primary">
            <MailIcon className="size-4" /> {c.email}
          </a>
          {c.telefono && (
            <a href={`tel:${c.telefono}`} className="flex items-center gap-2 hover:text-primary">
              <PhoneIcon className="size-4" /> {c.telefono}
            </a>
          )}
          {c.link_portfolio && (
            <a
              href={c.link_portfolio}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 break-all hover:text-primary"
            >
              <LinkIcon className="size-4 shrink-0" /> {c.link_portfolio}
            </a>
          )}
        </div>
        {c.messaggio && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{c.messaggio}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {c.haCv && (
            <Button variant="outline" size="sm" onClick={apriCv}>
              <FileTextIcon /> Apri CV
            </Button>
          )}
          {STATI_CANDIDATURA.filter((s) => s.value !== c.stato).map((s) => (
            <Button
              key={s.value}
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => cambiaStato(s.value)}
            >
              Segna &quot;{s.label.toLowerCase()}&quot;
            </Button>
          ))}
          <ConfirmActionDialog
            trigger={
              <Button variant="destructive" size="sm">
                Elimina
              </Button>
            }
            title={`Eliminare la candidatura di ${c.nome} ${c.cognome}?`}
            description="Verranno cancellati definitivamente anche il CV e i dati personali."
            confirmLabel="Elimina"
            onConfirm={async () => {
              const result = await eliminaCandidatura(c.id);
              if (result.error) {
                toast.error(result.error);
                return;
              }
              toast.success("Candidatura eliminata.");
              router.refresh();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
