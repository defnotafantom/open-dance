"use server";

import { revalidatePath } from "next/cache";
import { requireRuolo, RUOLI_STAFF, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  candidaturaSchema,
  contenutoScuolaSchema,
  MAX_CV_BYTES,
  MAX_FOTO_BYTES,
  posizioneSchema,
  traguardoSchema,
} from "@/lib/sito/schemas";
import type { StatoCandidatura } from "@/lib/supabase/database.types";

export type ActionResult = { error?: string };

function leggiDati(formData: FormData): unknown {
  const raw = formData.get("dati");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fileDa(formData: FormData, chiave: string): File | null {
  const file = formData.get(chiave);
  return file instanceof File && file.size > 0 ? file : null;
}

/** Carica una foto nel bucket pubblico "sito" e restituisce il path. */
async function caricaFotoSito(cartella: string, file: File) {
  if (!file.type.startsWith("image/")) {
    return { error: "Il file deve essere un'immagine." };
  }
  if (file.size > MAX_FOTO_BYTES) {
    return { error: "L'immagine supera i 4 MB consentiti." };
  }
  const supabase = await createClient();
  const estensione = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const path = `${cartella}/${crypto.randomUUID()}.${estensione}`;
  const { error } = await supabase.storage.from("sito").upload(path, file);
  if (error) {
    return { error: error.message };
  }
  return { path };
}

async function rimuoviFotoSito(path: string | null | undefined) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from("sito").remove([path]);
}

// =========================================================
// La scuola
// =========================================================

export async function salvaContenutoScuola(formData: FormData): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = contenutoScuolaSchema.safeParse(leggiDati(formData));
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const id = formData.get("id");
  const supabase = await createClient();
  const valori = { ...parsed.data, descrizione: parsed.data.descrizione || null };

  let vecchiaFoto: string | null = null;
  let foto_path: string | undefined;
  const foto = fileDa(formData, "foto");
  if (foto) {
    const upload = await caricaFotoSito("scuola", foto);
    if (upload.error) return { error: upload.error };
    foto_path = upload.path;
  }

  if (typeof id === "string" && id) {
    if (foto_path) {
      const { data } = await supabase
        .from("scuola_contenuti")
        .select("foto_path")
        .eq("id", id)
        .maybeSingle();
      vecchiaFoto = data?.foto_path ?? null;
    }
    const { error } = await supabase
      .from("scuola_contenuti")
      .update(foto_path ? { ...valori, foto_path } : valori)
      .eq("id", id);
    if (error) return { error: error.message };
    await rimuoviFotoSito(vecchiaFoto);
  } else {
    const { error } = await supabase
      .from("scuola_contenuti")
      .insert({ ...valori, foto_path: foto_path ?? null });
    if (error) return { error: error.message };
  }

  revalidatePath("/scuola");
  revalidatePath("/admin/sito");
  return {};
}

export async function eliminaContenutoScuola(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data } = await supabase
    .from("scuola_contenuti")
    .select("foto_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("scuola_contenuti").delete().eq("id", id);
  if (error) return { error: error.message };
  await rimuoviFotoSito(data?.foto_path);

  revalidatePath("/scuola");
  revalidatePath("/admin/sito");
  return {};
}

// =========================================================
// Speciale 28 anni
// =========================================================

export async function salvaTraguardo(formData: FormData): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const parsed = traguardoSchema.safeParse(leggiDati(formData));
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const id = formData.get("id");
  const supabase = await createClient();
  const valori = {
    ...parsed.data,
    contesto: parsed.data.contesto || null,
    risultato: parsed.data.risultato || null,
  };

  let vecchiaFoto: string | null = null;
  let foto_path: string | undefined;
  const foto = fileDa(formData, "foto");
  if (foto) {
    const upload = await caricaFotoSito("traguardi", foto);
    if (upload.error) return { error: upload.error };
    foto_path = upload.path;
  }

  if (typeof id === "string" && id) {
    if (foto_path) {
      const { data } = await supabase
        .from("traguardi")
        .select("foto_path")
        .eq("id", id)
        .maybeSingle();
      vecchiaFoto = data?.foto_path ?? null;
    }
    const { error } = await supabase
      .from("traguardi")
      .update(foto_path ? { ...valori, foto_path } : valori)
      .eq("id", id);
    if (error) return { error: error.message };
    await rimuoviFotoSito(vecchiaFoto);
  } else {
    const { error } = await supabase
      .from("traguardi")
      .insert({ ...valori, foto_path: foto_path ?? null });
    if (error) return { error: error.message };
  }

  revalidatePath("/28-anni");
  revalidatePath("/admin/sito");
  return {};
}

export async function eliminaTraguardo(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_STAFF);
  const supabase = await createClient();
  const { data } = await supabase.from("traguardi").select("foto_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("traguardi").delete().eq("id", id);
  if (error) return { error: error.message };
  await rimuoviFotoSito(data?.foto_path);

  revalidatePath("/28-anni");
  revalidatePath("/admin/sito");
  return {};
}

// =========================================================
// Lavora con noi: posizioni aperte (solo titolari)
// =========================================================

export async function salvaPosizione(id: string | null, input: unknown): Promise<ActionResult> {
  await requireRuolo(RUOLI_TITOLARI);
  const parsed = posizioneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const valori = { ...parsed.data, descrizione: parsed.data.descrizione || null };
  const { error } = id
    ? await supabase.from("posizioni_aperte").update(valori).eq("id", id)
    : await supabase.from("posizioni_aperte").insert(valori);
  if (error) return { error: error.message };

  revalidatePath("/lavora-con-noi");
  revalidatePath("/admin/sito");
  return {};
}

export async function eliminaPosizione(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();
  const { error } = await supabase.from("posizioni_aperte").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/lavora-con-noi");
  revalidatePath("/admin/sito");
  return {};
}

// =========================================================
// Lavora con noi: candidature
// =========================================================

/**
 * Invio pubblico, senza account. Usa la service-role key perche' i
 * visitatori anonimi non hanno permessi di scrittura: tutti i controlli
 * (validazione, formato e dimensione del CV, anti-spam) stanno qui.
 */
export async function inviaCandidatura(formData: FormData): Promise<ActionResult> {
  // Campo trappola invisibile: un umano lo lascia vuoto, molti bot no.
  // Rispondiamo "ok" per non dare indizi a chi lo compila.
  if (formData.get("sito_web")) {
    return {};
  }

  const parsed = candidaturaSchema.safeParse(leggiDati(formData));
  if (!parsed.success) {
    return { error: "Controlla i campi: nome, cognome, email e consenso privacy sono obbligatori." };
  }
  const dati = parsed.data;
  const admin = createAdminClient();

  const unOraFa = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("candidature")
    .select("id", { count: "exact", head: true })
    .eq("email", dati.email)
    .gte("created_at", unOraFa);
  if ((count ?? 0) >= 3) {
    return { error: "Hai già inviato diverse candidature: riprova più tardi." };
  }

  let cv_path: string | null = null;
  const cv = fileDa(formData, "cv");
  if (cv) {
    if (cv.size > MAX_CV_BYTES) {
      return { error: "Il CV supera i 4 MB consentiti." };
    }
    const intestazione = new Uint8Array(await cv.slice(0, 5).arrayBuffer());
    if (new TextDecoder().decode(intestazione) !== "%PDF-") {
      return { error: "Il CV deve essere un file PDF." };
    }
    cv_path = `${new Date().getFullYear()}/${crypto.randomUUID()}.pdf`;
    const { error } = await admin.storage
      .from("candidature")
      .upload(cv_path, cv, { contentType: "application/pdf" });
    if (error) {
      return { error: "Non è stato possibile caricare il CV, riprova." };
    }
  }

  const { error } = await admin.from("candidature").insert({
    tipo: dati.tipo,
    posizione_id: dati.posizione_id,
    nome: dati.nome,
    cognome: dati.cognome,
    email: dati.email,
    telefono: dati.telefono || null,
    messaggio: dati.messaggio || null,
    link_portfolio: dati.link_portfolio || null,
    cv_path,
    consenso_privacy: dati.consenso_privacy,
  });
  if (error) {
    if (cv_path) await admin.storage.from("candidature").remove([cv_path]);
    return { error: "Non è stato possibile inviare la candidatura, riprova." };
  }

  revalidatePath("/admin/candidature");
  return {};
}

export async function aggiornaStatoCandidatura(
  id: string,
  stato: StatoCandidatura
): Promise<ActionResult> {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();
  const { error } = await supabase.from("candidature").update({ stato }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/candidature");
  return {};
}

/** Elimina candidatura e CV: e' anche la risposta a una richiesta GDPR. */
export async function eliminaCandidatura(id: string): Promise<ActionResult> {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();
  const { data } = await supabase.from("candidature").select("cv_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("candidature").delete().eq("id", id);
  if (error) return { error: error.message };
  if (data?.cv_path) {
    await supabase.storage.from("candidature").remove([data.cv_path]);
  }

  revalidatePath("/admin/candidature");
  return {};
}

export async function linkCvCandidatura(id: string): Promise<{ url?: string; error?: string }> {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();
  const { data } = await supabase.from("candidature").select("cv_path").eq("id", id).maybeSingle();
  if (!data?.cv_path) return { error: "Nessun CV allegato." };

  const { data: firmato, error } = await supabase.storage
    .from("candidature")
    .createSignedUrl(data.cv_path, 60);
  if (error || !firmato) return { error: error?.message ?? "CV non disponibile." };
  return { url: firmato.signedUrl };
}
