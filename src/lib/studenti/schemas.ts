import * as z from "zod";

export const studenteSchema = z.object({
  nome: z.string().min(1, { error: "Inserisci il nome." }),
  cognome: z.string().min(1, { error: "Inserisci il cognome." }),
  data_nascita: z.string().min(1, { error: "Inserisci la data di nascita." }),
  codice_fiscale: z.string().optional(),
});

export type StudenteInput = z.infer<typeof studenteSchema>;
