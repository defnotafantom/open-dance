"use server";

import { revalidatePath } from "next/cache";
import { getProfile, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { profiloInsegnanteSchema, type ProfiloInsegnanteInput } from "@/lib/insegnanti/schemas";

export type ActionResult = { error?: string };

/** L'insegnante puo' modificare solo il proprio profilo pubblico; un
 * titolare puo' compilarlo per conto di un insegnante che non e' a suo
 * agio a farlo da solo. */
export async function aggiornaProfiloInsegnante(
  profiloId: string,
  input: ProfiloInsegnanteInput
): Promise<ActionResult> {
  const profile = await getProfile();
  if (profile.id !== profiloId && !RUOLI_TITOLARI.includes(profile.ruolo)) {
    return { error: "Non sei autorizzato a modificare questo profilo." };
  }

  const parsed = profiloInsegnanteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("insegnanti_profili").upsert(
    {
      profilo_id: profiloId,
      bio: parsed.data.bio || null,
      carriera: parsed.data.carriera || null,
      specializzazioni: parsed.data.specializzazioni || null,
      anni_esperienza: parsed.data.anni_esperienza ?? null,
      pubblicato: parsed.data.pubblicato,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profilo_id" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/insegnanti");
  revalidatePath(`/insegnanti/${profiloId}`);
  revalidatePath("/area-insegnante/profilo");
  revalidatePath("/admin/staff");
  return {};
}

export async function caricaFotoInsegnante(formData: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  const profiloId = formData.get("profilo_id");
  if (typeof profiloId !== "string") {
    return { error: "Dati non validi." };
  }
  if (profile.id !== profiloId && !RUOLI_TITOLARI.includes(profile.ruolo)) {
    return { error: "Non sei autorizzato a modificare questo profilo." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un'immagine da caricare." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "L'immagine supera i 5 MB consentiti." };
  }

  const supabase = await createClient();
  const estensione = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  const filePath = `${profiloId}/foto.${estensione}`;

  const { error: uploadError } = await supabase.storage
    .from("insegnanti")
    .upload(filePath, file, { upsert: true });
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error } = await supabase
    .from("insegnanti_profili")
    .upsert({ profilo_id: profiloId, foto_path: filePath }, { onConflict: "profilo_id" });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/insegnanti");
  revalidatePath(`/insegnanti/${profiloId}`);
  revalidatePath("/area-insegnante/profilo");
  return {};
}
