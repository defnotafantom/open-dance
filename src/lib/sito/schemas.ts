import * as z from "zod";

export const contenutoScuolaSchema = z.object({
  sezione: z.enum(["scuola", "aule", "attivita", "storia"]),
  titolo: z.string().trim().min(1, { error: "Inserisci un titolo." }).max(200),
  descrizione: z.string().max(4000).optional(),
  ordine: z.number().int(),
  pubblicato: z.boolean(),
});

export type ContenutoScuolaInput = z.infer<typeof contenutoScuolaSchema>;

export const traguardoSchema = z.object({
  anno: z.number().int().min(1999).max(2100),
  categoria: z.enum(["ambizione", "concorso", "contest", "competizione", "crescita", "tappa"]),
  titolo: z.string().trim().min(1, { error: "Inserisci un titolo." }).max(200),
  contesto: z.string().max(6000).optional(),
  risultato: z.string().max(300).optional(),
  ordine: z.number().int(),
  pubblicato: z.boolean(),
});

export type TraguardoInput = z.infer<typeof traguardoSchema>;

export const posizioneSchema = z.object({
  tipo: z.enum(["personale", "insegnante_esterno", "masterclass"]),
  titolo: z.string().trim().min(1, { error: "Inserisci un titolo." }).max(200),
  descrizione: z.string().max(4000).optional(),
  attiva: z.boolean(),
});

export type PosizioneInput = z.infer<typeof posizioneSchema>;

export const candidaturaSchema = z.object({
  tipo: z.enum(["personale", "insegnante_esterno", "masterclass", "spontanea"]),
  posizione_id: z.uuid().nullable(),
  nome: z.string().trim().min(1).max(100),
  cognome: z.string().trim().min(1).max(100),
  email: z.email(),
  telefono: z.string().trim().max(40).optional(),
  messaggio: z.string().trim().max(4000).optional(),
  link_portfolio: z.union([z.url(), z.literal("")]).optional(),
  consenso_privacy: z.literal(true),
});

export type CandidaturaInput = z.infer<typeof candidaturaSchema>;

export const MAX_FOTO_BYTES = 4 * 1024 * 1024;
export const MAX_CV_BYTES = 4 * 1024 * 1024;
