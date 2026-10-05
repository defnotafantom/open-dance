import type {
  CategoriaTraguardo,
  SezioneScuola,
  StatoCandidatura,
  TipoCandidatura,
  TipoPosizione,
} from "@/lib/supabase/database.types";

/** Anno di fondazione: da qui si calcolano gli anni dello Speciale. */
export const ANNO_FONDAZIONE = 1999;
export const ANNI_SPECIALE = 28;

export const SEZIONI_SCUOLA: { value: SezioneScuola; label: string; intro: string }[] = [
  {
    value: "scuola",
    label: "La scuola",
    intro: "Chi siamo, dove siamo, che aria si respira appena si entra.",
  },
  {
    value: "aule",
    label: "Le aule",
    intro: "Gli spazi in cui ogni settimana si studia, si prova, si cresce.",
  },
  {
    value: "attivita",
    label: "Cosa facciamo",
    intro: "Lezioni, laboratori, prove, stage: la vita di tutti i giorni.",
  },
  {
    value: "storia",
    label: "Cosa abbiamo fatto",
    intro: "Spettacoli, saggi, progetti ed esperienze che ci hanno portato fin qui.",
  },
];

export const CATEGORIE_TRAGUARDO: { value: CategoriaTraguardo; label: string }[] = [
  { value: "ambizione", label: "Ambizione" },
  { value: "concorso", label: "Concorso" },
  { value: "contest", label: "Contest" },
  { value: "competizione", label: "Competizione" },
  { value: "crescita", label: "Crescita personale" },
  { value: "tappa", label: "Tappa della scuola" },
];

export const TAPPE_PERCORSO: { value: number; label: string; descrizione: string }[] = [
  {
    value: 1,
    label: "Primi passi",
    descrizione:
      "Il primo incontro con la danza: musica, gioco, coordinazione. Si impara ad ascoltare il proprio corpo e a stare insieme agli altri.",
  },
  {
    value: 2,
    label: "Fondamenta",
    descrizione:
      "Tecnica di base, postura, ritmo. Si costruiscono le basi solide che serviranno per qualsiasi stile.",
  },
  {
    value: 3,
    label: "Crescita",
    descrizione:
      "Gli stili si approfondiscono, arrivano le coreografie e il palco. Cresce la sicurezza, dentro e fuori dalla sala.",
  },
  {
    value: 4,
    label: "Alta formazione",
    descrizione:
      "Preparazione intensiva per concorsi, audizioni e per chi vuole fare della danza una strada.",
  },
];

export const TIPI_POSIZIONE: { value: TipoPosizione; label: string }[] = [
  { value: "personale", label: "Personale" },
  { value: "insegnante_esterno", label: "Insegnante esterno" },
  { value: "masterclass", label: "Masterclass" },
];

export const TIPI_CANDIDATURA: { value: TipoCandidatura; label: string }[] = [
  ...TIPI_POSIZIONE,
  { value: "spontanea", label: "Candidatura spontanea" },
];

export const STATI_CANDIDATURA: { value: StatoCandidatura; label: string }[] = [
  { value: "nuova", label: "Nuova" },
  { value: "in_valutazione", label: "In valutazione" },
  { value: "archiviata", label: "Archiviata" },
];

export function etichetta<T extends string | number>(
  elenco: { value: T; label: string }[],
  value: T | null | undefined
) {
  return elenco.find((e) => e.value === value)?.label ?? "";
}
