import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";

/** "Danza Classica — Lunedi' 17:00", per il registro attivita'. */
export async function nomiClassi(ids: string[]) {
  if (ids.length === 0) return [];
  const admin = createAdminClient();
  const [{ data: classi }, { data: corsi }] = await Promise.all([
    admin.from("classi").select("id, corso_id, giorno_settimana, orario_inizio").in("id", ids),
    admin.from("corsi").select("id, nome"),
  ]);
  const corso = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  return (classi ?? []).map(
    (c) =>
      `${corso.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)}`
  );
}

export async function nomeClasse(id: string) {
  return (await nomiClassi([id]))[0] ?? null;
}
