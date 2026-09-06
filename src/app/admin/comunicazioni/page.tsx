import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { AnnouncementComposer } from "@/components/comunicazioni/announcement-composer";
import { AnnouncementFeed } from "@/components/comunicazioni/announcement-feed";

export default async function ComunicazioniAdminPage() {
  const supabase = await createClient();

  const [{ data: corsi }, { data: classi }] = await Promise.all([
    supabase.from("corsi").select("id, nome").order("nome"),
    supabase
      .from("classi")
      .select("id, corso_id, giorno_settimana, orario_inizio")
      .eq("attiva", true),
  ]);

  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const classiOpzioni = (classi ?? []).map((c) => ({
    id: c.id,
    label: `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Comunicazioni</h1>
      <AnnouncementComposer
        tipiDestinatarioConsentiti={["tutti", "ruolo", "corso", "classe"]}
        corsi={corsi ?? []}
        classi={classiOpzioni}
      />
      <AnnouncementFeed />
    </div>
  );
}
