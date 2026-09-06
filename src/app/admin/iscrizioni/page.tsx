import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { IscrizioniTable, type RichiestaIscrizione } from "./iscrizioni-table";

export default async function IscrizioniPage() {
  const supabase = await createClient();

  const { data: richieste, error } = await supabase
    .from("iscrizioni")
    .select("id, studente_id, classe_id, data_iscrizione")
    .eq("stato", "richiesta")
    .order("data_iscrizione");

  if (error || !richieste || richieste.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Iscrizioni in attesa</h1>
        {error ? (
          <p className="text-destructive text-sm">Impossibile caricare le richieste: {error.message}</p>
        ) : (
          <IscrizioniTable richieste={[]} />
        )}
      </div>
    );
  }

  const studenteIds = [...new Set(richieste.map((r) => r.studente_id))];
  const classeIds = [...new Set(richieste.map((r) => r.classe_id))];

  const [{ data: studenti }, { data: classi }] = await Promise.all([
    supabase.from("studenti").select("id, nome, cognome").in("id", studenteIds),
    supabase.from("classi").select("id, corso_id, giorno_settimana, orario_inizio, orario_fine").in("id", classeIds),
  ]);

  const corsoIds = [...new Set((classi ?? []).map((c) => c.corso_id))];
  const { data: corsi } = await supabase.from("corsi").select("id, nome").in("id", corsoIds);

  const studenteById = new Map((studenti ?? []).map((s) => [s.id, `${s.nome} ${s.cognome}`]));
  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const classeById = new Map(
    (classi ?? []).map((c) => [
      c.id,
      `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)}`,
    ])
  );

  const righe: RichiestaIscrizione[] = richieste.map((r) => ({
    id: r.id,
    studente_nome: studenteById.get(r.studente_id) ?? "Studente",
    classe_label: classeById.get(r.classe_id) ?? "Classe",
    data_iscrizione: r.data_iscrizione,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Iscrizioni in attesa</h1>
      <IscrizioniTable richieste={righe} />
    </div>
  );
}
