import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Autore = { id: string; nome: string; cognome: string };

/**
 * Scrive una riga nel registro attivita' (chi, cosa, su quale iscritto).
 * La data e l'ora le mette il database. Scrive col client di servizio: dal
 * browser nessuno puo' aggiungere, cambiare o cancellare righe.
 * Non fa mai fallire l'azione principale: se la scrittura non riesce lo
 * segnala nei log del server.
 */
export async function traccia(
  autore: Autore,
  azione: string,
  opzioni: { studenteId?: string | null; dettaglio?: string | null } = {}
) {
  const admin = createAdminClient();
  let studenteNome: string | null = null;
  if (opzioni.studenteId) {
    const { data } = await admin
      .from("studenti")
      .select("nome, cognome")
      .eq("id", opzioni.studenteId)
      .maybeSingle();
    studenteNome = data ? `${data.nome} ${data.cognome}` : null;
  }

  const { error } = await admin.from("attivita_staff").insert({
    autore_id: autore.id,
    autore_nome: `${autore.nome} ${autore.cognome}`.trim() || "Staff",
    studente_id: opzioni.studenteId ?? null,
    studente_nome: studenteNome,
    azione,
    dettaglio: opzioni.dettaglio ?? null,
  });
  if (error) console.error("Registro attivita' non scritto:", error.message);
}
