import type { AttivitaSocio, PagamentoMetodoEnum } from "@/lib/supabase/database.types";

export const ATTIVITA: { value: AttivitaSocio; label: string }[] = [
  { value: "danza", label: "Danza" },
  { value: "fitness", label: "Fitness" },
  { value: "entrambe", label: "Danza + Fitness" },
];

export const METODI: { value: PagamentoMetodoEnum; label: string }[] = [
  { value: "contanti", label: "Contanti" },
  { value: "bonifico", label: "Bonifico" },
  { value: "pos", label: "POS / carta" },
  { value: "altro", label: "Altro" },
];

/** Categorie suggerite per le uscite (si puo' scriverne una nuova). */
export const CATEGORIE_USCITE = [
  "Affitto e utenze",
  "Compensi istruttori",
  "Affiliazione e tesseramenti",
  "Assicurazione",
  "Attrezzatura e materiale",
  "Manutenzione",
  "Altro",
];

export const MESI = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

/** La stagione va da settembre ad agosto: "2026-2027". */
export function stagioneDi(data: Date = new Date()) {
  const anno = data.getFullYear();
  return data.getMonth() >= 8 ? `${anno}-${anno + 1}` : `${anno - 1}-${anno}`;
}

/** "2026-10" -> "Ottobre 2026" */
export function nomeMese(mese: string) {
  const [a, m] = mese.split("-").map(Number);
  return `${MESI[m - 1]} ${a}`;
}

export function euro(n: number) {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

/** I contanti non danno diritto alla detrazione del 19% per lo sport dei ragazzi. */
export const NOTA_DETRAZIONE =
  "Per la detrazione del 19% delle spese sportive dei ragazzi (5-18 anni) serve un pagamento tracciabile: bonifico, carta o POS.";
