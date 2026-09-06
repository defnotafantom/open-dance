import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { NuovaIscrizioneForm, type ClasseOpzione } from "./nuova-iscrizione-form";

export default async function NuovaIscrizioneManualePage() {
  const supabase = await createClient();

  const [{ data: classi, error }, { data: corsi }] = await Promise.all([
    supabase
      .from("classi")
      .select("id, corso_id, giorno_settimana, orario_inizio, orario_fine, stagione")
      .eq("attiva", true),
    supabase.from("corsi").select("id, nome"),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl uppercase tracking-tight">Nuova iscrizione</h1>
        <p className="text-destructive text-sm">Impossibile caricare le classi: {error.message}</p>
      </div>
    );
  }

  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const classiOpzioni: ClasseOpzione[] = (classi ?? [])
    .map((c) => ({
      id: c.id,
      label: `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)} (${c.stagione})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Nuova iscrizione manuale</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Usa questo modulo per registrare direttamente un&apos;iscrizione raccolta
          fuori dal sito (di persona, telefono, ecc). L&apos;iscrizione risulta
          subito attiva, senza passare dalla richiesta di approvazione.
        </p>
      </div>
      <NuovaIscrizioneForm classi={classiOpzioni} />
    </div>
  );
}
