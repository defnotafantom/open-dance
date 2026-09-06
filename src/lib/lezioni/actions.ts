"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { error?: string };

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

async function verificaProprietaClasse(classeId: string) {
  const profile = await requireRuolo(["admin", "staff", "insegnante"]);
  if (profile.ruolo === "insegnante") {
    const supabase = await createClient();
    const { data: classe } = await supabase
      .from("classi")
      .select("insegnante_id")
      .eq("id", classeId)
      .single();
    if (!classe || classe.insegnante_id !== profile.id) {
      return { error: "Questa classe non e' tua." };
    }
  }
  return {};
}

export async function annullaLezione(lezioneId: string, classeId: string): Promise<ActionResult> {
  const verifica = await verificaProprietaClasse(classeId);
  if (verifica.error) {
    return verifica;
  }

  // Client service-role: un insegnante non-staff non ha permessi RLS per
  // scrivere su "lezioni" (l'inserimento/modifica e' pensato come
  // operazione di sistema, vedi assicuraLezioni piu' sopra).
  const admin = createAdminClient();
  const { error } = await admin
    .from("lezioni")
    .update({ stato: "annullata" })
    .eq("id", lezioneId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-insegnante/presenze");
  revalidatePath("/area-genitore/presenze");
  return {};
}

export async function programmaRecupero(
  lezioneOriginaleId: string,
  classeId: string,
  data: string,
  orarioInizio: string,
  orarioFine: string
): Promise<ActionResult> {
  const verifica = await verificaProprietaClasse(classeId);
  if (verifica.error) {
    return verifica;
  }

  const admin = createAdminClient();
  const { data: recupero, error } = await admin
    .from("lezioni")
    .insert({
      classe_id: classeId,
      data,
      orario_inizio: orarioInizio,
      orario_fine: orarioFine,
      stato: "recuperata",
    })
    .select("id")
    .single();

  if (error || !recupero) {
    return { error: error?.message ?? "Impossibile creare il recupero." };
  }

  const { error: linkError } = await admin
    .from("lezioni")
    .update({ sostituita_da_lezione_id: recupero.id })
    .eq("id", lezioneOriginaleId);

  if (linkError) {
    return { error: linkError.message };
  }

  revalidatePath("/area-insegnante/presenze");
  revalidatePath("/area-genitore/presenze");
  return {};
}
