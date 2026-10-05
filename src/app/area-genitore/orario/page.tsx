import { createClient } from "@/lib/supabase/server";
import { WeeklySchedule, type ClasseOrario } from "@/components/schedule/weekly-schedule";
import { Badge } from "@/components/ui/badge";

export default async function OrarioGenitorePage() {
  const supabase = await createClient();

  const [{ data: classi, error }, { data: corsi }, { data: insegnanti }, { data: figli }] =
    await Promise.all([
      supabase
        .from("classi")
        .select(
          "id, corso_id, insegnante_id, giorno_settimana, orario_inizio, orario_fine, sala, stagione"
        )
        .eq("attiva", true),
      supabase.from("corsi").select("id, nome"),
      supabase.from("profiles").select("id, nome, cognome").eq("ruolo", "insegnante"),
      supabase.from("studenti").select("id, nome, cognome"),
    ]);

  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const insegnanteNomeById = new Map(
    (insegnanti ?? []).map((i) => [i.id, `${i.nome} ${i.cognome}`])
  );
  const figliIds = (figli ?? []).map((f) => f.id);
  const { data: iscrizioni } =
    figliIds.length > 0
      ? await supabase
          .from("iscrizioni")
          .select("id, studente_id, classe_id, stato")
          .in("studente_id", figliIds)
          .eq("stato", "attiva")
      : { data: [] as { id: string; studente_id: string; classe_id: string; stato: string }[] };

  const nomeFiglioById = new Map((figli ?? []).map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  const classiOrario: ClasseOrario[] = (classi ?? []).map((c) => ({
    id: c.id,
    giorno_settimana: c.giorno_settimana,
    orario_inizio: c.orario_inizio,
    orario_fine: c.orario_fine,
    sala: c.sala,
    corso_nome: corsoNomeById.get(c.corso_id) ?? "Corso",
    insegnante_nome: c.insegnante_id ? insegnanteNomeById.get(c.insegnante_id) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Orario dei corsi</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare l&apos;orario: {error.message}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground max-w-lg text-sm">
            Tutti i corsi della scuola. Per iscriversi a un corso o cambiarlo basta chiedere in
            segreteria: l&apos;iscrizione la registra lo staff.
          </p>
          <WeeklySchedule
            classi={classiOrario}
            azione={(classe) => {
              const iscritti = (iscrizioni ?? [])
                .filter((i) => i.classe_id === classe.id)
                .map((i) => nomeFiglioById.get(i.studente_id))
                .filter(Boolean);
              return iscritti.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {iscritti.map((n) => (
                    <Badge key={n}>{n}</Badge>
                  ))}
                </div>
              ) : null;
            }}
          />
        </>
      )}
    </div>
  );
}
