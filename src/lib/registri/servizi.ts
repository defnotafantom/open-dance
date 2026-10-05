import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { giornoRoma } from "@/lib/date";
import { stagioneDi } from "@/lib/registri/costanti";

/**
 * Crea la quota di iscrizione della stagione in corso per un socio, se non
 * esiste gia', con il prezzo del listino. Chiamata quando un'iscrizione
 * diventa attiva (approvata o inserita dalla segreteria).
 */
export async function assicuraQuotaIscrizione(
  supabase: SupabaseClient<Database>,
  studenteId: string
): Promise<{ creata: boolean; motivo?: string }> {
  const stagione = stagioneDi();
  const competenza = `${stagione.slice(0, 4)}-09-01`;

  const { data: esistente } = await supabase
    .from("pagamenti")
    .select("id")
    .eq("studente_id", studenteId)
    .eq("tipo", "iscrizione_annuale")
    .or(`competenza.eq.${competenza},note.eq."Iscrizione stagione ${stagione}"`)
    .limit(1);
  if (esistente && esistente.length > 0) return { creata: false, motivo: "già presente" };

  const [{ data: socio }, { data: tariffe }] = await Promise.all([
    supabase.from("studenti").select("attivita").eq("id", studenteId).maybeSingle(),
    supabase.from("tariffe").select("attivita, importo").eq("stagione", stagione).eq("voce", "iscrizione"),
  ]);
  if (!socio) return { creata: false, motivo: "socio non trovato" };

  const prezzo = (a: "danza" | "fitness") => tariffe?.find((t) => t.attivita === a)?.importo;
  const danza = socio.attivita !== "fitness" ? prezzo("danza") : 0;
  const fitness = socio.attivita !== "danza" ? prezzo("fitness") : 0;
  if (danza == null || fitness == null) {
    return { creata: false, motivo: `manca il prezzo di iscrizione nel listino ${stagione}` };
  }

  const { error } = await supabase.from("pagamenti").insert({
    studente_id: studenteId,
    tipo: "iscrizione_annuale",
    importo_dovuto: Number(danza) + Number(fitness),
    competenza,
    data_scadenza: giornoRoma(),
    note: `Iscrizione stagione ${stagione}`,
  });
  if (error) return { creata: false, motivo: error.message };
  return { creata: true };
}
