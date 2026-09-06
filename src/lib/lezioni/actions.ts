"use server";

import { createAdminClient } from "@/lib/supabase/admin";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dateGiorno(giorno: number, inizio: Date, fine: Date): string[] {
  const date: string[] = [];
  const cursore = new Date(inizio);
  while (cursore <= fine) {
    if (cursore.getDay() === giorno) {
      date.push(formatDate(cursore));
    }
    cursore.setDate(cursore.getDate() + 1);
  }
  return date;
}

/**
 * Genera le occorrenze di "lezioni" mancanti per le classi indicate, su una
 * finestra rolling attorno a oggi. Idempotente (ON CONFLICT DO NOTHING sulla
 * coppia classe_id+data). Usa il client service-role perche' e' un'operazione
 * di sistema, non un'azione di un singolo utente: senza farlo, un insegnante
 * (non staff) non avrebbe i permessi RLS per scrivere su "lezioni".
 */
export async function assicuraLezioni(
  classeIds: string[],
  settimanePassate = 2,
  settimaneFuture = 6
) {
  if (classeIds.length === 0) {
    return;
  }

  const admin = createAdminClient();
  const { data: classi } = await admin
    .from("classi")
    .select("id, giorno_settimana")
    .in("id", classeIds);

  if (!classi || classi.length === 0) {
    return;
  }

  const oggi = new Date();
  const inizio = new Date(oggi);
  inizio.setDate(inizio.getDate() - settimanePassate * 7);
  const fine = new Date(oggi);
  fine.setDate(fine.getDate() + settimaneFuture * 7);

  const righe = classi.flatMap((c) =>
    dateGiorno(c.giorno_settimana, inizio, fine).map((data) => ({
      classe_id: c.id,
      data,
    }))
  );

  if (righe.length === 0) {
    return;
  }

  await admin.from("lezioni").upsert(righe, {
    onConflict: "classe_id,data",
    ignoreDuplicates: true,
  });
}
