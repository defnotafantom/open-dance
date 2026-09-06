import * as z from "zod";

export const impostazioniScuolaSchema = z.object({
  nome_scuola: z.string().min(1, { error: "Inserisci il nome della scuola." }),
  anno_fondazione: z.number().int().nullable().optional(),
  indirizzo: z.string().optional(),
  telefono: z.string().optional(),
  email_contatto: z.string().optional(),
});

export type ImpostazioniScuolaInput = z.infer<typeof impostazioniScuolaSchema>;
