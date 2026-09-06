import * as z from "zod";

export const eventoSchema = z.object({
  nome: z.string().min(1, { error: "Inserisci il nome dell'evento." }),
  data: z.string().min(1, { error: "Inserisci la data." }),
  luogo: z.string().optional(),
  descrizione: z.string().optional(),
});

export type EventoInput = z.infer<typeof eventoSchema>;
