"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { areaPerRuolo } from "@/lib/auth/dal";
import {
  loginSchema,
  registratiSchema,
  recuperaPasswordSchema,
  nuovaPasswordSchema,
  VERSIONE_INFORMATIVA_PRIVACY,
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "Email o password non corrette." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ruolo")
    .eq("id", data.user.id)
    .single();

  redirect(profile ? areaPerRuolo(profile.ruolo) : "/");
}

export async function registrati(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = registratiSchema.safeParse({
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    email: formData.get("email"),
    password: formData.get("password"),
    confermaPassword: formData.get("confermaPassword"),
    tipo: formData.get("tipo"),
    accettaPrivacy: formData.get("accettaPrivacy") === "on",
    accettaFotoVideo: formData.get("accettaFotoVideo") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nome: parsed.data.nome,
        cognome: parsed.data.cognome,
        ruolo: parsed.data.tipo,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Client con service-role: il consenso va registrato anche se la
    // conferma email e' attiva e non esiste ancora una sessione.
    const admin = createAdminClient();
    await admin.from("consensi_privacy").insert([
      {
        profilo_id: data.user.id,
        tipo_consenso: "trattamento_dati",
        concesso: true,
        versione_informativa: VERSIONE_INFORMATIVA_PRIVACY,
      },
      {
        profilo_id: data.user.id,
        tipo_consenso: "foto_video",
        concesso: parsed.data.accettaFotoVideo,
        versione_informativa: VERSIONE_INFORMATIVA_PRIVACY,
      },
    ]);
  }

  if (!data.session) {
    redirect("/login?registrato=1");
  }

  redirect(areaPerRuolo(parsed.data.tipo));
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
