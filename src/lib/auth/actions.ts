"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { areaPerRuolo } from "@/lib/auth/dal";
import { normalizzaCodice } from "@/lib/iscritti/credenziali";
import {
  loginSchema,
  recuperaPasswordSchema,
  nuovaPasswordSchema,
} from "@/lib/auth/schemas";

export type FormState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

export async function login(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Senza "@" e' un codice iscritto: si risale all'email dell'account.
  // Stesso messaggio d'errore in ogni caso, per non rivelare quali codici esistono.
  let email = parsed.data.email.toLowerCase();
  if (!email.includes("@")) {
    const codice = normalizzaCodice(email);
    const { data: profilo } = codice
      ? await createAdminClient().from("profiles").select("email").eq("codice_accesso", codice).maybeSingle()
      : { data: null };
    if (!profilo) return { error: "Codice o password non corretti." };
    email = profilo.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });

  if (error || !data.user) {
    return { error: "Codice/email o password non corretti." };
  }

  // Verifica in due passaggi attiva: prima del gestionale serve il codice.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/verifica-accesso");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", data.user.id)
    .single();

  redirect(profile ? areaPerRuolo(profile.ruolo) : "/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function richiediResetPassword(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = recuperaPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/recupera-password/conferma`,
  });

  // Esito sempre uguale, per non rivelare quali email sono registrate.
  return {
    success:
      "Se l'indirizzo e' registrato, riceverai un'email con le istruzioni per reimpostare la password.",
  };
}

export async function aggiornaPassword(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = nuovaPasswordSchema.safeParse({
    password: formData.get("password"),
    confermaPassword: formData.get("confermaPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: claims } = await supabase.auth.getClaims();
  const { data: profile } = claims?.claims
    ? await supabase
        .from("profiles")
        .select("ruolo")
        .eq("id", claims.claims.sub as string)
        .single()
    : { data: null };

  redirect(profile ? areaPerRuolo(profile.ruolo) : "/");
}
