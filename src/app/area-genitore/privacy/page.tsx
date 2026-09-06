import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { PrivacyPanel } from "./privacy-panel";

export default async function PrivacyPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: richiesta } = await supabase
    .from("richieste_cancellazione")
    .select("id, stato, richiesto_at")
    .eq("profilo_id", profile.id)
    .eq("stato", "in_attesa")
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Privacy e dati personali</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Da qui puoi scaricare una copia dei dati collegati al tuo account o
          richiederne la cancellazione.
        </p>
      </div>
      <PrivacyPanel richiestaInAttesa={richiesta ?? null} />
    </div>
  );
}
