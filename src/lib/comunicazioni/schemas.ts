import * as z from "zod";

export const targetSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("tutti") }),
  z.object({
    tipo: z.literal("ruolo"),
    ruolo: z.enum(["admin", "staff", "insegnante", "genitore", "allievo_adulto"]),
  }),
  z.object({ tipo: z.literal("corso"), corso_id: z.uuid() }),
  z.object({ tipo: z.literal("classe"), classe_id: z.uuid() }),
]);

export type TargetInput = z.infer<typeof targetSchema>;

export const comunicazioneSchema = z.object({
  titolo: z.string().min(1, { error: "Inserisci un titolo." }),
  corpo: z.string().min(1, { error: "Inserisci il testo della comunicazione." }),
  target: targetSchema,
});

export type ComunicazioneInput = z.infer<typeof comunicazioneSchema>;
