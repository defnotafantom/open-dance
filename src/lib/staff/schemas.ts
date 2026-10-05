import * as z from "zod";

export const referenteSchema = z.discriminatedUnion("modalita", [
  z.object({ modalita: z.literal("esistente"), referente_id: z.uuid() }),
  z.object({
    modalita: z.literal("nuovo"),
    email: z.email({ error: "Inserisci un'email valida." }),
    nome: z.string().min(1, { error: "Inserisci il nome del referente." }),
    cognome: z.string().min(1, { error: "Inserisci il cognome del referente." }),
    telefono: z.string().max(30).optional(),
    // Modulo privacy firmato in segreteria: senza, l'account non si crea.
    consenso_privacy: z.literal(true, { error: "Serve il modulo privacy firmato." }),
    consenso_foto: z.boolean(),
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
    attivita: z.enum(["danza", "fitness", "entrambe"]),
  }),
]);

export const iscrizioneManualeSchema = z.object({
  referente: referenteSchema,
  studente: studenteManualeSchema,
  // Un iscritto puo' frequentare piu' corsi: una o piu' classi insieme.
  classi_ids: z.array(z.uuid()).min(1, { error: "Seleziona almeno una classe." }),
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
