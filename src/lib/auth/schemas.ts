import * as z from "zod";

export const loginSchema = z.object({
  // Email (staff, famiglie) oppure codice iscritto (OD-0012).
  email: z.string().trim().min(1, { error: "Inserisci il codice o l'email." }).max(200),
  password: z.string().min(1, { error: "Inserisci la password." }),
});

export const VERSIONE_INFORMATIVA_PRIVACY = "v1-2026-09";

export const recuperaPasswordSchema = z.object({
  email: z.email({ error: "Inserisci un'email valida." }),
});

export const nuovaPasswordSchema = z
  .object({
    password: z.string().min(8, { error: "Almeno 8 caratteri." }),
    confermaPassword: z.string(),
  })
  .refine((data) => data.password === data.confermaPassword, {
    error: "Le password non coincidono.",
    path: ["confermaPassword"],
  });
