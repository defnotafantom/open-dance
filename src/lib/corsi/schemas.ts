import * as z from "zod";

export const corsoSchema = z.object({
  nome: z.string().min(1, { error: "Inserisci il nome del corso." }),
  descrizione: z.string().optional(),
  categoria: z.string().optional(),
  livello: z.string().optional(),
  attivo: z.boolean(),
});

export type CorsoInput = z.infer<typeof corsoSchema>;

export const GIORNI_SETTIMANA = [
  "Domenica",
  "Lunedi'",
  "Martedi'",
  "Mercoledi'",
  "Giovedi'",
  "Venerdi'",
  "Sabato",
] as const;

export const classeSchema = z.object({
  corso_id: z.uuid(),
  insegnante_id: z.uuid().nullable(),
  giorno_settimana: z.number().int().min(0).max(6),
  orario_inizio: z.string().min(1, { error: "Inserisci l'orario di inizio." }),
  orario_fine: z.string().min(1, { error: "Inserisci l'orario di fine." }),
  sala: z.string().optional(),
  capienza_max: z.number().int().positive().nullable().optional(),
  stagione: z.string().min(1, { error: "Inserisci la stagione (es. 2026-2027)." }),
  attiva: z.boolean(),
});

export type ClasseInput = z.infer<typeof classeSchema>;
