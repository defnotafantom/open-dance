"use server";

import { revalidatePath } from "next/cache";
import { getProfile, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { comunicazioneSchema, type ComunicazioneInput, type TargetInput } from "@/lib/comunicazioni/schemas";
import type { RuoloEnum } from "@/lib/supabase/database.types";
import { inviaPushAProfili } from "@/lib/push/send";

export type ActionResult = { error?: string };

async function risolviDestinatariPush(
  target: TargetInput
): Promise<string[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (target.tipo === "tutti") {
    const { data } = await admin.from("profiles").select("id");
    return (data ?? []).map((p) => p.id);
  }

  if (target.tipo === "ruolo") {
    const { data } = await admin.from("profiles").select("id").eq("ruolo", target.ruolo);
    return (data ?? []).map((p) => p.id);
  }

  if (target.tipo === "corso") {
    const { data: classi } = await admin.from("classi").select("id").eq("corso_id", target.corso_id);
    const classeIds = (classi ?? []).map((c) => c.id);
    if (classeIds.length === 0) return [];
    const { data: iscrizioni } = await admin
      .from("iscrizioni")
      .select("studente_id")
      .in("classe_id", classeIds)
      .eq("stato", "attiva");
    const studenteIds = [...new Set((iscrizioni ?? []).map((i) => i.studente_id))];
    if (studenteIds.length === 0) return [];
    const { data: studenti } = await admin
      .from("studenti")
      .select("genitore_id, profilo_id")
      .in("id", studenteIds);
    return [
      ...new Set(
        (studenti ?? [])
          .map((s) => s.genitore_id ?? s.profilo_id)
          .filter((id): id is string => !!id)
      ),
    ];
  }

  // classe
  const { data: classe } = await admin
    .from("classi")
    .select("insegnante_id")
    .eq("id", target.classe_id)
    .single();
  const { data: iscrizioni } = await admin
    .from("iscrizioni")
    .select("studente_id")
    .eq("classe_id", target.classe_id)
    .eq("stato", "attiva");
  const studenteIds = [...new Set((iscrizioni ?? []).map((i) => i.studente_id))];
  const { data: studenti } =
    studenteIds.length > 0
      ? await admin.from("studenti").select("genitore_id, profilo_id").in("id", studenteIds)
      : { data: [] as { genitore_id: string | null; profilo_id: string | null }[] };

  return [
    ...new Set(
      [
        ...(studenti ?? []).map((s) => s.genitore_id ?? s.profilo_id),
        classe?.insegnante_id,
      ].filter((id): id is string => !!id)
    ),
  ];
}

export async function pubblicaComunicazione(input: ComunicazioneInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (![...RUOLI_STAFF, "insegnante"].includes(profile.ruolo)) {
    return { error: "Non sei autorizzato a pubblicare comunicazioni." };
  }

  const parsed = comunicazioneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { data: comunicazione, error } = await supabase
    .from("comunicazioni")
    .insert({
      titolo: parsed.data.titolo,
      corpo: parsed.data.corpo,
      autore_id: profile.id,
      pubblicato_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !comunicazione) {
    return { error: error?.message ?? "Impossibile pubblicare la comunicazione." };
  }

  if (parsed.data.target.tipo !== "tutti") {
    const target = parsed.data.target;
    const targetRow: {
      comunicazione_id: string;
      ruolo?: RuoloEnum;
      corso_id?: string;
      classe_id?: string;
    } = {
      comunicazione_id: comunicazione.id,
    };
    if (target.tipo === "ruolo") targetRow.ruolo = target.ruolo;
    if (target.tipo === "corso") targetRow.corso_id = target.corso_id;
    if (target.tipo === "classe") targetRow.classe_id = target.classe_id;

    const { error: targetError } = await supabase.from("comunicazioni_target").insert(targetRow);
    if (targetError) {
      // Rollback best-effort: senza il target la comunicazione resterebbe
      // visibile a tutti, il contrario di quanto richiesto.
      await supabase.from("comunicazioni").delete().eq("id", comunicazione.id);
      return { error: targetError.message };
    }
  }

  // Notifica push: best-effort, non deve far fallire la pubblicazione se
  // le chiavi VAPID non sono configurate o l'invio fallisce.
  try {
    const destinatari = await risolviDestinatariPush(parsed.data.target);
    await inviaPushAProfili(destinatari, {
      title: parsed.data.titolo,
      body: parsed.data.corpo.slice(0, 140),
      url: "/",
    });
  } catch {
    // ignorato volutamente
  }

  revalidatePath("/admin/comunicazioni");
  revalidatePath("/area-insegnante/comunicazioni");
  revalidatePath("/area-genitore/comunicazioni");
  return {};
}

/** Usata per il badge sull'icona dell'app (Badging API) e per il riepilogo
 * nella home famiglia: numero di comunicazioni non ancora lette. */
export async function contaComunicazioniNonLette(): Promise<number> {
  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: comunicazioni }, { data: letture }] = await Promise.all([
    supabase.from("comunicazioni").select("id"),
    supabase.from("letture_comunicazioni").select("comunicazione_id").eq("profilo_id", profile.id),
  ]);

  const letteIds = new Set((letture ?? []).map((l) => l.comunicazione_id));
  return (comunicazioni ?? []).filter((c) => !letteIds.has(c.id)).length;
}

export async function segnaComunicazioneLetta(comunicazioneId: string): Promise<ActionResult> {
  const profile = await getProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("letture_comunicazioni").upsert(
    { comunicazione_id: comunicazioneId, profilo_id: profile.id },
    { onConflict: "comunicazione_id,profilo_id", ignoreDuplicates: true }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}
