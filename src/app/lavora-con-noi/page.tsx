import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicHero, PublicPage } from "@/components/marketing/public-page";
import { LavoraConNoi } from "./lavora-con-noi";

export const metadata: Metadata = {
  title: "Lavora con noi · Open Dance",
  description:
    "Ricerca di personale, insegnanti esterni e masterclass: invia la tua candidatura e il tuo CV a Open Dance.",
};

export default async function LavoraConNoiPage() {
  const supabase = await createClient();
  const { data: posizioni } = await supabase
    .from("posizioni_aperte")
    .select("id, tipo, titolo, descrizione")
    .eq("attiva", true)
    .order("created_at", { ascending: false });

  return (
    <PublicPage>
      <PublicHero
        eyebrow="Open Dance cerca"
        titolo="Vuoi lavorare con noi?"
        intro="Cerchiamo persone che condividano la nostra passione: staff, insegnanti esterni e artisti per masterclass. Guarda le posizioni aperte o mandaci una candidatura spontanea."
      />
      <LavoraConNoi posizioni={posizioni ?? []} />
    </PublicPage>
  );
}
