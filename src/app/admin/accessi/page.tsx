import { requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { AccessiList } from "./accessi-list";

export default async function AccessiPage() {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();
  const { data: richieste, error } = await supabase
    .from("accessi_sito")
    .select("id, nome, ip, user_agent, stato, scade_at, deciso_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Accessi al sito</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Il sito è chiuso al pubblico. Chi inserisce il codice chiede di entrare: qui approvi,
          neghi o revochi. Un accesso approvato dura 30 giorni; una revoca vale subito. Chi ha un
          account e fa il login entra senza codice.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm">Impossibile caricare le richieste: {error.message}</p>
      ) : (
        <AccessiList richieste={richieste ?? []} />
      )}
    </div>
  );
}
