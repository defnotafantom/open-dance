import * as z from "zod";

export const referenteSchema = z.discriminatedUnion("modalita", [
  z.object({ modalita: z.literal("esistente"), referente_id: z.uuid() }),
  z.object({
    modalita: z.literal("nuovo"),
    email: z.email({ error: "Inserisci un'email valida." }),
    nome: z.string().min(1, { error: "Inserisci il nome del referente." }),
    cognome: z.string().min(1, { error: "Inserisci il cognome del referente." }),
  }),
]);

export const studenteManualeSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("esistente"), studente_id: z.uuid() }),
  z.object({
    tipo: z.literal("nuovo"),
    nome: z.string().min(1, { error: "Inserisci il nome." }),
    cognome: z.string().min(1, { error: "Inserisci il cognome." }),
    data_nascita: z.string().min(1, { error: "Inserisci la data di nascita." }),
    codice_fiscale: z.string().optional(),
    is_adulto: z.boolean(),
  }),
]);

export const iscrizioneManualeSchema = z.object({
  referente: referenteSchema,
  studente: studenteManualeSchema,
  classe_id: z.uuid({ error: "Seleziona una classe." }),
  quota_concordata: z.number().nonnegative().optional(),
});

export type IscrizioneManualeInput = z.infer<typeof iscrizioneManualeSchema>;

export type ReferenteTrovato = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  figli: { id: string; nome: string; cognome: string; is_adulto: boolean }[];
};
