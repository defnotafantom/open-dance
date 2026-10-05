import "server-only";
import { createClient } from "@/lib/supabase/server";
import { TIPO_LABEL } from "@/lib/pagamenti/schemas";
import { residuo, statoQuota, type StatoQuota } from "@/lib/registri/stato";
import type { AttivitaSocio, PagamentoTipoEnum } from "@/lib/supabase/database.types";

export type Socio = {
  id: string;
  nome: string;
  cognome: string;
  numero_tessera: number | null;
  attivita: AttivitaSocio;
  data_tesseramento: string;
  attivo: boolean;
  data_nascita: string;
  /** Chi paga: il genitore per i minori, il socio stesso se adulto. */
  referente: string;
};

export type RigaQuota = {
  id: string;
  studente_id: string;
  socio: string;
  numero_tessera: number | null;
  tipo: PagamentoTipoEnum;
  descrizione: string;
  importo_dovuto: number;
  importo_pagato: number;
  residuo: number;
  data_scadenza: string | null;
  competenza: string | null;
  stato: StatoQuota;
  referente: string;
};

export async function caricaSoci(): Promise<Socio[]> {
  const supabase = await createClient();
  const { data: studenti } = await supabase
    .from("studenti")
    .select(
      "id, nome, cognome, numero_tessera, attivita, data_tesseramento, attivo, data_nascita, genitore_id, profilo_id"
    )
    .order("numero_tessera", { nullsFirst: false });

  const referenteIds = [
    ...new Set((studenti ?? []).map((s) => s.genitore_id).filter((id): id is string => !!id)),
  ];
  const { data: genitori } =
    referenteIds.length > 0
      ? await supabase.from("profiles").select("id, nome, cognome").in("id", referenteIds)
      : { data: [] as { id: string; nome: string; cognome: string }[] };
  const nomeGenitore = new Map((genitori ?? []).map((g) => [g.id, `${g.nome} ${g.cognome}`.trim()]));

  return (studenti ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    cognome: s.cognome,
    numero_tessera: s.numero_tessera,
    attivita: s.attivita,
    data_tesseramento: s.data_tesseramento,
    attivo: s.attivo,
    data_nascita: s.data_nascita,
    referente:
      (s.genitore_id && nomeGenitore.get(s.genitore_id)) || `${s.nome} ${s.cognome}`,
  }));
}

/** Quote (pagamenti), arricchite con socio e stato calcolato a oggi. */
export async function caricaQuote(filtro?: {
  competenza?: string;
  soloAperte?: boolean;
}): Promise<RigaQuota[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pagamenti")
    .select(
      "id, studente_id, tipo, importo_dovuto, importo_pagato, data_scadenza, competenza, note, stato"
    )
    .order("data_scadenza", { nullsFirst: false });
  if (filtro?.competenza) query = query.eq("competenza", filtro.competenza);
  if (filtro?.soloAperte) query = query.neq("stato", "pagato");
  const { data: pagamenti } = await query;

  const soci = new Map((await caricaSoci()).map((s) => [s.id, s]));

  return (pagamenti ?? []).map((p) => {
    const socio = soci.get(p.studente_id);
    const riga = {
      importo_dovuto: Number(p.importo_dovuto),
      importo_pagato: Number(p.importo_pagato),
      data_scadenza: p.data_scadenza,
    };
    return {
      id: p.id,
      studente_id: p.studente_id,
      socio: socio ? `${socio.nome} ${socio.cognome}` : "Socio",
      numero_tessera: socio?.numero_tessera ?? null,
      tipo: p.tipo,
      descrizione: p.note || TIPO_LABEL[p.tipo],
      ...riga,
      residuo: residuo(riga),
      competenza: p.competenza,
      stato: statoQuota(riga),
      referente: socio?.referente ?? "",
    };
  });
}

/** Dati per la finestra "Incassa". */
export function perIncasso(q: RigaQuota) {
  return {
    id: q.id,
    socio: `${q.socio}${q.numero_tessera ? ` · tessera ${q.numero_tessera}` : ""}`,
    causale: `${q.descrizione} — ${q.socio}`,
    residuo: q.residuo,
    pagatore: q.referente,
  };
}
