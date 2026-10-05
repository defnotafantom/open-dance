import { getOptionalProfile, areaPerRuolo } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { nomiInsegnantiPubblici } from "@/lib/insegnanti/pubblici";
import { HomeClient, type DatiHome } from "./home-client";

export default async function Home() {
  const profile = await getOptionalProfile();
  const areaPersonale = profile ? areaPerRuolo(profile.ruolo) : null;

  return <HomeClient dati={await caricaDatiHome()} areaPersonale={areaPersonale} />;
}

/** Tutto quello che la home mostra arriva dal database, gestito dallo staff. */
async function caricaDatiHome(): Promise<DatiHome> {
  const supabase = await createClient();
  const urlSito = (path: string) => supabase.storage.from("sito").getPublicUrl(path).data.publicUrl;

  const [corsi, scuola, traguardi, insegnanti, posizioni, impostazioni] = await Promise.all([
    supabase
      .from("corsi")
      .select("nome, categoria, tappa")
      .eq("pubblicato", true)
      .eq("attivo", true)
      .order("nome"),
    supabase
      .from("scuola_contenuti")
      .select("id, titolo, foto_path")
      .eq("pubblicato", true)
      .not("foto_path", "is", null)
      .order("ordine")
      .limit(8),
    supabase
      .from("traguardi")
      .select("id, anno, categoria, titolo, contesto")
      .eq("pubblicato", true)
      .order("anno")
      .order("ordine"),
    supabase
      .from("insegnanti_profili")
      .select("profilo_id, specializzazioni, foto_path")
      .eq("pubblicato", true),
    supabase.from("posizioni_aperte").select("id", { count: "exact", head: true }).eq("attiva", true),
    supabase
      .from("impostazioni_scuola")
      .select("indirizzo, telefono, email_contatto")
      .maybeSingle(),
  ]);

  const nomi = await nomiInsegnantiPubblici((insegnanti.data ?? []).map((i) => i.profilo_id));

  return {
    corsi: corsi.data ?? [],
    foto: (scuola.data ?? []).map((f) => ({
      id: f.id,
      titolo: f.titolo,
      url: urlSito(f.foto_path!),
    })),
    ambizioni: (traguardi.data ?? [])
      .filter((t) => t.categoria === "ambizione")
      .map((t) => ({ id: t.id, titolo: t.titolo })),
    traguardiRaccontati: (traguardi.data ?? []).filter((t) => t.categoria !== "ambizione").length,
    insegnanti: (insegnanti.data ?? []).map((i) => ({
      id: i.profilo_id,
      nome: nomi.get(i.profilo_id) ?? "Insegnante",
      specializzazioni: i.specializzazioni,
      fotoUrl: i.foto_path
        ? supabase.storage.from("insegnanti").getPublicUrl(i.foto_path).data.publicUrl
        : null,
    })),
    posizioniAperte: posizioni.count ?? 0,
    contatti: {
      indirizzo: impostazioni.data?.indirizzo ?? null,
      telefono: impostazioni.data?.telefono ?? null,
      email: impostazioni.data?.email_contatto ?? null,
    },
  };
}
