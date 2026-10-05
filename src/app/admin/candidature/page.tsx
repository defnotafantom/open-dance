import { requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { CandidatureList } from "./candidature-list";

export default async function CandidaturePage() {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();

  const [{ data: candidature, error }, { data: posizioni }] = await Promise.all([
    supabase
      .from("candidature")
      .select(
        "id, tipo, posizione_id, nome, cognome, email, telefono, messaggio, link_portfolio, cv_path, stato, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("posizioni_aperte").select("id, titolo"),
  ]);
  const titoloPosizione = new Map((posizioni ?? []).map((p) => [p.id, p.titolo]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Candidature</h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          Arrivano dalla pagina pubblica &quot;Lavora con noi&quot;. Contengono dati personali:
          elimina quelle che non servono più, insieme al CV.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare le candidature: {error.message}
        </p>
      ) : (
        <CandidatureList
          candidature={(candidature ?? []).map((c) => ({
            ...c,
            posizione: c.posizione_id ? (titoloPosizione.get(c.posizione_id) ?? null) : null,
            haCv: Boolean(c.cv_path),
          }))}
        />
      )}
    </div>
  );
}
