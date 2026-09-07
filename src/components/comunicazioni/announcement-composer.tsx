"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { pubblicaComunicazione } from "@/lib/comunicazioni/actions";
import type { TargetInput } from "@/lib/comunicazioni/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RUOLO_LABEL: Record<string, string> = {
  proprietario: "Proprietari",
  co_proprietario: "Co-proprietari",
  segretario: "Segreteria",
  insegnante: "Insegnanti",
  allievo: "Allievi e famiglie",
};

export type DestinatarioTipo = "tutti" | "ruolo" | "corso" | "classe";

export function AnnouncementComposer({
  tipiDestinatarioConsentiti,
  corsi = [],
  classi = [],
}: {
  tipiDestinatarioConsentiti: DestinatarioTipo[];
  corsi?: { id: string; nome: string }[];
  classi?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [titolo, setTitolo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [tipoDestinatario, setTipoDestinatario] = useState<DestinatarioTipo>(
    tipiDestinatarioConsentiti[0]
  );
  const [ruoloTarget, setRuoloTarget] = useState("allievo");
  const [corsoTarget, setCorsoTarget] = useState(corsi[0]?.id ?? "");
  const [classeTarget, setClasseTarget] = useState(classi[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titolo.trim() || !corpo.trim()) {
      toast.error("Titolo e testo sono obbligatori.");
      return;
    }

    let target: TargetInput;
    if (tipoDestinatario === "tutti") {
      target = { tipo: "tutti" };
    } else if (tipoDestinatario === "ruolo") {
      target = {
        tipo: "ruolo",
        ruolo: ruoloTarget as
          | "webmaster"
          | "proprietario"
          | "co_proprietario"
          | "segretario"
          | "insegnante"
          | "allievo",
      };
    } else if (tipoDestinatario === "corso") {
      if (!corsoTarget) {
        toast.error("Seleziona un corso.");
        return;
      }
      target = { tipo: "corso", corso_id: corsoTarget };
    } else {
      if (!classeTarget) {
        toast.error("Seleziona una classe.");
        return;
      }
      target = { tipo: "classe", classe_id: classeTarget };
    }

    setPending(true);
    const result = await pubblicaComunicazione({ titolo, corpo, target });
    setPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Comunicazione pubblicata.");
    setTitolo("");
    setCorpo("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg panel-3d p-4">
      <div className="grid gap-2">
        <Label htmlFor="titolo">Titolo</Label>
        <Input id="titolo" value={titolo} onChange={(e) => setTitolo(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="corpo">Testo</Label>
        <Textarea id="corpo" rows={4} value={corpo} onChange={(e) => setCorpo(e.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 sm:items-end sm:gap-3">
        <div className="grid gap-2">
          <Label>Destinatari</Label>
          <Select
            value={tipoDestinatario}
            onValueChange={(v) => setTipoDestinatario(v as DestinatarioTipo)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => {
                  const labels: Record<DestinatarioTipo, string> = {
                    tutti: "Tutti",
                    ruolo: "Un ruolo specifico",
                    corso: "Un corso specifico",
                    classe: tipiDestinatarioConsentiti.length === 1 ? "Una mia classe" : "Una classe specifica",
                  };
                  return labels[(v as DestinatarioTipo) ?? "tutti"];
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tipiDestinatarioConsentiti.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo === "tutti"
                    ? "Tutti"
                    : tipo === "ruolo"
                      ? "Un ruolo specifico"
                      : tipo === "corso"
                        ? "Un corso specifico"
                        : tipiDestinatarioConsentiti.length === 1
                          ? "Una mia classe"
                          : "Una classe specifica"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {tipoDestinatario === "ruolo" && (
          <Select value={ruoloTarget} onValueChange={(v) => setRuoloTarget(v ?? "allievo")}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => RUOLO_LABEL[v ?? "allievo"]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RUOLO_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tipoDestinatario === "corso" && (
          <Select value={corsoTarget} onValueChange={(v) => setCorsoTarget(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => corsi.find((c) => c.id === v)?.nome ?? "Seleziona un corso"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {corsi.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tipoDestinatario === "classe" && (
          <Select value={classeTarget} onValueChange={(v) => setClasseTarget(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => classi.find((c) => c.id === v)?.label ?? "Seleziona una classe"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classi.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Pubblicazione..." : "Pubblica"}
      </Button>
    </form>
  );
}
