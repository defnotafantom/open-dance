import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RuoloEnum } from "@/lib/supabase/database.types";

// Bypass TEMPORANEO per vedere le aree protette senza un progetto Supabase
// reale. Attivo solo fuori produzione: impostare NEXT_PUBLIC_DEV_BYPASS_ROLE
// in .env.local (es. "admin", "insegnante", "genitore") e riavviare `npm run
// dev`. Da rimuovere (questa funzione + i due controlli che la usano) non
// appena e' collegato un progetto Supabase vero.
function profiloBypassSviluppo() {
  const ruolo = process.env.NEXT_PUBLIC_DEV_BYPASS_ROLE as RuoloEnum | undefined;
  if (process.env.NODE_ENV === "production" || !ruolo) {
    return null;
  }
  return {
    // UUID nullo, sintatticamente valido: le query reali su Supabase non
    // vanno in errore (nessuna riga corrisponde, semplicemente vuoto) invece
    // di rompersi con "invalid input syntax for type uuid".
    id: "00000000-0000-0000-0000-000000000000",
    nome: "Anteprima",
    cognome: ruolo,
    email: "anteprima@dev.local",
    telefono: null,
    ruolo,
  };
}

export const verifySession = cache(async () => {
  if (profiloBypassSviluppo()) {
    return { userId: "00000000-0000-0000-0000-000000000000" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return { userId: data.claims.sub as string };
});

export const getProfile = cache(async () => {
  const bypass = profiloBypassSviluppo();
  if (bypass) {
    return bypass;
  }

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
  const bypass = profiloBypassSviluppo();
  if (bypass) {
    return bypass;
  }

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
