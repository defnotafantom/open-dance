import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Nomi degli insegnanti con profilo pubblicato. La tabella profiles (con
 * email e telefono) non e' leggibile dai visitatori anonimi, quindi qui si
 * usa la service-role key ma si espongono solo nome e cognome, e solo per
 * chi ha scelto di pubblicare il proprio profilo.
 */
export async function nomiInsegnantiPubblici(profiloIds: string[]) {
  if (profiloIds.length === 0) return new Map<string, string>();
  const admin = createAdminClient();
  const { data: pubblicati } = await admin
    .from("insegnanti_profili")
    .select("profilo_id")
    .eq("pubblicato", true)
    .in("profilo_id", profiloIds);
  const ids = (pubblicati ?? []).map((p) => p.profilo_id);
  if (ids.length === 0) return new Map<string, string>();

  const { data: profili } = await admin.from("profiles").select("id, nome, cognome").in("id", ids);
  return new Map(
    (profili ?? []).map((p) => [p.id, `${p.nome} ${p.cognome}`.trim() || "Insegnante"])
  );
}
