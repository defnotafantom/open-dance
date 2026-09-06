"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { documentoMetaSchema } from "@/lib/documenti/schemas";

export type ActionResult = { error?: string };

const MAX_DIMENSIONE_BYTE = 10 * 1024 * 1024; // 10 MB

export async function caricaDocumento(formData: FormData): Promise<ActionResult> {
  const parsed = documentoMetaSchema.safeParse({
    studente_id: formData.get("studente_id"),
    tipo: formData.get("tipo"),
    data_scadenza: formData.get("data_scadenza") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }
  if (file.size > MAX_DIMENSIONE_BYTE) {
    return { error: "Il file supera i 10 MB consentiti." };
  }

  const supabase = await createClient();
  const nomeSicuro = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `${parsed.data.studente_id}/${Date.now()}-${nomeSicuro}`;

  const { error: uploadError } = await supabase.storage.from("documenti").upload(filePath, file);
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error } = await supabase.from("documenti").insert({
    studente_id: parsed.data.studente_id,
    tipo: parsed.data.tipo,
    data_scadenza: parsed.data.data_scadenza,
    file_path: filePath,
  });

  if (error) {
    await supabase.storage.from("documenti").remove([filePath]);
    return { error: error.message };
  }

  revalidatePath("/area-genitore/documenti");
  return {};
}

export async function eliminaDocumento(id: string, filePath: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error: storageError } = await supabase.storage.from("documenti").remove([filePath]);
  if (storageError) {
    return { error: storageError.message };
  }

  const { error } = await supabase.from("documenti").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/area-genitore/documenti");
  return {};
}

export async function urlFirmatoDocumento(filePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documenti")
    .createSignedUrl(filePath, 60);

  if (error || !data) {
    return { error: error?.message ?? "Impossibile generare il link." };
  }

  return { url: data.signedUrl };
}
