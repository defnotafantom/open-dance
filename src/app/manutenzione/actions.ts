"use server";

import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inviaPushAProfili } from "@/lib/push/send";
import { COOKIE_ACCESSO, COOKIE_ATTIVITA, codiceAccesso, opzioniCookieSessione } from "@/lib/manutenzione";
import { firmaRichiesta } from "@/lib/accessi/firma";

export type StatoRichiesta = {
  error?: string;
  inviata?: boolean;
};

/** Codice + nome: crea la richiesta e avvisa SOLO il webmaster sul telefono. */
export async function richiediAccesso(
  _stato: StatoRichiesta | undefined,
  formData: FormData
): Promise<StatoRichiesta> {
  const codice = String(formData.get("codice") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);

  if (codice !== codiceAccesso()) {
    // Rallenta i tentativi a raffica.
    await new Promise((r) => setTimeout(r, 1500));
    return { error: "Codice non valido." };
  }
  if (nome.length < 2) {
    return { error: "Scrivi il tuo nome, così sappiamo chi sta chiedendo l'accesso." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const admin = createAdminClient();

  if (ip) {
    const unOraFa = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count } = await admin
      .from("accessi_sito")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", unOraFa);
    if ((count ?? 0) >= 5) {
      return { error: "Troppe richieste da questa connessione. Riprova più tardi." };
    }
  }

  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const { data: richiesta, error } = await admin
    .from("accessi_sito")
    .insert({
      token,
      nome,
      ip,
      user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
    })
    .select("id")
    .single();
  if (error || !richiesta) {
    return { error: "Non è stato possibile inviare la richiesta, riprova." };
  }

  // Cookie di sessione: chiuso il browser, si riparte dal codice.
  (await cookies()).set(COOKIE_ACCESSO, token, opzioniCookieSessione);

  const { data: webmaster } = await admin.from("profiles").select("id").eq("ruolo", "webmaster");
  try {
    await inviaPushAProfili(
      (webmaster ?? []).map((w) => w.id),
      {
        title: "Richiesta di accesso al sito",
        body: `${nome} ha inserito il codice. Tocca per approvare o negare.`,
        url: `/manutenzione/decidi?id=${richiesta.id}&firma=${firmaRichiesta(richiesta.id)}`,
      }
    );
  } catch {
    // la richiesta resta comunque visibile in "Accessi al sito"
  }

  return { inviata: true };
}

/** Sola lettura (usabile anche durante il render della pagina). */
export async function leggiStatoRichiesta(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_ACCESSO)?.value;
  if (!token) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("accesso_sito_stato", { p_token: token });
  return data ?? null;
}

/** Il visitatore in attesa chiede a che punto e' la sua richiesta. */
export async function controllaRichiesta(): Promise<string | null> {
  const data = await leggiStatoRichiesta();
  if (data === "approvato") {
    // Appena approvato: parte il conteggio dell'inattivita'.
    (await cookies()).set(COOKIE_ATTIVITA, String(Date.now()), opzioniCookieSessione);
  }
  return data ?? null;
}
