import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RuoloEnum } from "@/lib/supabase/database.types";

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return { userId: data.claims.sub as string };
});

export const getProfile = cache(async () => {
  const session = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, cognome, email, telefono, ruolo")
    .eq("id", session.userId)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return profile;
});

export const getOptionalProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, cognome, email, telefono, ruolo")
    .eq("id", data.claims.sub as string)
    .single();

  return profile ?? null;
});

export async function requireRuolo(ruoliConsentiti: RuoloEnum[]) {
  const profile = await getProfile();

  if (!ruoliConsentiti.includes(profile.ruolo)) {
    redirect("/");
  }

  return profile;
}

export function areaPerRuolo(ruolo: RuoloEnum) {
  switch (ruolo) {
    case "admin":
    case "staff":
      return "/admin";
    case "insegnante":
      return "/area-insegnante";
    default:
      return "/area-genitore";
  }
}
