import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Niente caratteri che si confondono a voce o su carta (0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Password casuale leggibile, es. "K7QM-W3XP-9TRA" (circa 59 bit). */
export function generaPassword() {
  const gruppi = Array.from({ length: 3 }, () =>
    Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("")
  );
  return gruppi.join("-");
}

export type Credenziali = { codice: string; password: string; email: string; nome: string };

/**
 * Crea l'account della famiglia (o dell'allievo maggiorenne) con una
 * password generata e un codice d'accesso. Nessuna email parte: le
 * credenziali le consegna la segreteria.
 */
export async function creaAccountFamiglia(dati: {
  email: string;
  nome: string;
  cognome: string;
  telefono?: string;
}): Promise<{ id: string; credenziali: Credenziali } | { error: string }> {
  const admin = createAdminClient();
  const password = generaPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email: dati.email,
    password,
    email_confirm: true,
    user_metadata: { nome: dati.nome, cognome: dati.cognome },
  });
  if (error || !data.user) {
    return {
      error: error?.message.includes("already")
        ? "Esiste già un account con questa email."
        : (error?.message ?? "Account non creato."),
    };
  }

  const { data: codice, error: codiceError } = await admin.rpc("prossimo_codice_accesso");
  if (codiceError || !codice) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: codiceError?.message ?? "Codice d'accesso non generato." };
  }

  await admin
    .from("profiles")
    .update({
      nome: dati.nome,
      cognome: dati.cognome,
      telefono: dati.telefono || null,
      codice_accesso: codice,
      ruolo: "allievo",
    })
    .eq("id", data.user.id);

  return {
    id: data.user.id,
    credenziali: { codice, password, email: dati.email, nome: `${dati.nome} ${dati.cognome}` },
  };
}

/** Nuova password per un account famiglia; assegna il codice se mancava. */
export async function nuovaPasswordFamiglia(
  profiloId: string
): Promise<{ credenziali: Credenziali } | { error: string }> {
  const admin = createAdminClient();
  const { data: profilo } = await admin
    .from("profiles")
    .select("nome, cognome, email, ruolo, codice_accesso")
    .eq("id", profiloId)
    .maybeSingle();
  if (!profilo || profilo.ruolo !== "allievo") return { error: "Account famiglia non trovato." };

  let codice = profilo.codice_accesso;
  if (!codice) {
    const { data, error } = await admin.rpc("prossimo_codice_accesso");
    if (error || !data) return { error: error?.message ?? "Codice d'accesso non generato." };
    codice = data;
    await admin.from("profiles").update({ codice_accesso: codice }).eq("id", profiloId);
  }

  const password = generaPassword();
  const { error } = await admin.auth.admin.updateUserById(profiloId, { password });
  if (error) return { error: error.message };

  return {
    credenziali: { codice, password, email: profilo.email, nome: `${profilo.nome} ${profilo.cognome}` },
  };
}

/** "od3", "OD-0003", "od0003" → "OD-0003". */
export function normalizzaCodice(testo: string) {
  const cifre = testo.replace(/\D/g, "");
  return cifre ? `OD-${cifre.padStart(4, "0")}` : null;
}
