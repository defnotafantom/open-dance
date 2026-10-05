import * as z from "zod";

export const impostazioniScuolaSchema = z.object({
  nome_scuola: z.string().min(1, { error: "Inserisci il nome della scuola." }),
  anno_fondazione: z.number().int().nullable().optional(),
  indirizzo: z.string().optional(),
  telefono: z.string().optional(),
  email_contatto: z.string().optional(),
  // Intestazione delle ricevute dell'ASD
  denominazione_asd: z.string().max(200).optional(),
  codice_fiscale_asd: z.string().max(16).optional(),
  sede_legale: z.string().max(300).optional(),
  numero_registro: z.string().max(50).optional(),
});

export type ImpostazioniScuolaInput = z.infer<typeof impostazioniScuolaSchema>;
