import { requireRuolo, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { ImpostazioniForm } from "./impostazioni-form";
import { RichiesteCancellazioneList, type RichiestaRiga } from "./richieste-cancellazione-list";

export default async function ImpostazioniPage() {
  await requireRuolo(RUOLI_TITOLARI);
  const supabase = await createClient();

  const [{ data: impostazioni, error }, { data: richiesteGrezze }] = await Promise.all([
    supabase
      .from("impostazioni_scuola")
      .select("nome_scuola, anno_fondazione, indirizzo, telefono, email_contatto")
      .eq("id", 1)
      .single(),
    supabase
      .from("richieste_cancellazione")
      .select("id, profilo_id, richiesto_at")
      .eq("stato", "in_attesa")
      .order("richiesto_at"),
  ]);

  const profiloIds = [...new Set((richiesteGrezze ?? []).map((r) => r.profilo_id))];
  const { data: profili } =
    profiloIds.length > 0
      ? await supabase.from("profiles").select("id, nome, cognome, email").in("id", profiloIds)
      : { data: [] as { id: string; nome: string; cognome: string; email: string }[] };
  const profiloById = new Map((profili ?? []).map((p) => [p.id, p]));

  const richieste: RichiestaRiga[] = (richiesteGrezze ?? []).map((r) => ({
    id: r.id,
    richiesto_at: r.richiesto_at,
    referente_label: profiloById.has(r.profilo_id)
      ? `${profiloById.get(r.profilo_id)!.nome} ${profiloById.get(r.profilo_id)!.cognome} (${profiloById.get(r.profilo_id)!.email})`
      : "Account",
  }));

  if (error || !impostazioni) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Impostazioni</h1>
        <p className="text-destructive text-sm">
          Impossibile caricare le impostazioni: {error?.message ?? "riga non trovata."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Impostazioni</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Dati anagrafici della scuola mostrati nel sito (comunicazioni, pagina
          di contatto, ecc). Modificabili solo da proprietari e webmaster.
        </p>
      </div>
      <ImpostazioniForm impostazioni={impostazioni} />

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Richieste di cancellazione dati</h2>
          <p className="text-muted-foreground max-w-lg text-sm">
            Completare una richiesta anonimizza i dati identificativi
            dell&apos;account e degli iscritti collegati e ne blocca
            l&apos;accesso; iscrizioni e pagamenti restano, in forma anonima,
            per gli obblighi contabili.
          </p>
        </div>
        <RichiesteCancellazioneList richieste={richieste} />
      </div>
    </div>
  );
}
