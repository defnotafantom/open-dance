import * as z from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Inserisci un'email valida." }),
  password: z.string().min(1, { error: "Inserisci la password." }),
});

export const VERSIONE_INFORMATIVA_PRIVACY = "v1-2026-09";

export const registratiSchema = z
  .object({
    nome: z.string().min(1, { error: "Inserisci il nome." }),
    cognome: z.string().min(1, { error: "Inserisci il cognome." }),
    email: z.email({ error: "Inserisci un'email valida." }),
    password: z.string().min(8, { error: "Almeno 8 caratteri." }),
    confermaPassword: z.string(),
    accettaPrivacy: z.boolean().refine((v) => v, {
      error: "Devi accettare l'informativa privacy per registrarti.",
    }),
    accettaFotoVideo: z.boolean(),
  })
  .refine((data) => data.password === data.confermaPassword, {
    error: "Le password non coincidono.",
    path: ["confermaPassword"],
  });

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
