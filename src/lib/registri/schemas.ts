import * as z from "zod";

const metodo = z.enum(["contanti", "bonifico", "pos", "altro"]);
const importo = z.number().positive({ error: "Inserisci un importo valido." });

export const tariffaSchema = z.object({
  attivita: z.enum(["danza", "fitness"]),
  voce: z.enum(["iscrizione", "mensile"]),
  stagione: z.string().regex(/^\d{4}-\d{4}$/),
  importo: z.number().min(0),
});

export const generaQuoteSchema = z.object({
  mese: z.string().regex(/^\d{4}-\d{2}$/),
  giorno_scadenza: z.number().int().min(1).max(28),
});

export const versamentoSchema = z.object({
  pagamento_id: z.uuid(),
  importo,
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metodo,
  pagatore_nome: z.string().trim().min(1, { error: "Indica chi ha pagato." }).max(200),
  pagatore_codice_fiscale: z.string().trim().max(16).optional(),
  causale: z.string().trim().min(1).max(300),
  note: z.string().max(1000).optional(),
});

export type VersamentoInput = z.infer<typeof versamentoSchema>;

export const socioSchema = z.object({
  attivita: z.enum(["danza", "fitness", "entrambe"]),
  numero_tessera: z.number().int().positive().nullable(),
  data_tesseramento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attivo: z.boolean(),
});

export type SocioInput = z.infer<typeof socioSchema>;

export const uscitaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoria: z.string().trim().min(1).max(100),
  descrizione: z.string().trim().min(1, { error: "Descrivi la spesa." }).max(300),
  importo,
  metodo,
  note: z.string().max(1000).optional(),
});

export type UscitaInput = z.infer<typeof uscitaSchema>;
