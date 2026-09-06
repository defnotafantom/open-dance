import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { AnnouncementComposer } from "@/components/comunicazioni/announcement-composer";
import { AnnouncementFeed } from "@/components/comunicazioni/announcement-feed";

export default async function ComunicazioniInsegnantePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: classi } = await supabase
    .from("classi")
    .select("id, corso_id, giorno_settimana, orario_inizio")
    .eq("insegnante_id", profile.id)
    .eq("attiva", true);

  const corsoIds = [...new Set((classi ?? []).map((c) => c.corso_id))];
  const { data: corsi } =
    corsoIds.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIds)
      : { data: [] as { id: string; nome: string }[] };
  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));

  const classiOpzioni = (classi ?? []).map((c) => ({
    id: c.id,
    label: `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Comunicazioni</h1>
      {classiOpzioni.length > 0 ? (
        <AnnouncementComposer tipiDestinatarioConsentiti={["classe"]} classi={classiOpzioni} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Non hai ancora una classe assegnata a cui scrivere.
        </p>
      )}
      <AnnouncementFeed />
    </div>
  );
}
