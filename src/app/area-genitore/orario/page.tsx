import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { WeeklySchedule, type ClasseOrario } from "@/components/schedule/weekly-schedule";
import { RichiediIscrizioneDialog, type FiglioConStato } from "./richiedi-iscrizione-dialog";
import { Button } from "@/components/ui/button";

export default async function OrarioGenitorePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: classi, error }, { data: corsi }, { data: insegnanti }, { data: figli }] =
    await Promise.all([
      supabase
        .from("classi")
        .select("id, corso_id, insegnante_id, giorno_settimana, orario_inizio, orario_fine, sala")
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
          .in("stato", ["richiesta", "attiva"])
      : { data: [] as { id: string; studente_id: string; classe_id: string; stato: string }[] };

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
      <h1 className="text-2xl font-semibold">Orario dei corsi</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare l&apos;orario: {error.message}
        </p>
      ) : (figli ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {profile.ruolo === "allievo_adulto"
            ? "Completa prima il tuo profilo nella sezione dedicata per poter richiedere un'iscrizione."
            : "Aggiungi prima un figlio nella sezione \"I miei figli\" per poter richiedere un'iscrizione."}
        </p>
      ) : (
        <WeeklySchedule
          classi={classiOrario}
          azione={(classe) => {
            const figliConStato: FiglioConStato[] = (figli ?? []).map((f) => {
              const iscrizione = (iscrizioni ?? []).find(
                (i) => i.studente_id === f.id && i.classe_id === classe.id
              );
              return {
                id: f.id,
                nome: f.nome,
                cognome: f.cognome,
                iscrizioneId: iscrizione?.id,
                stato: iscrizione?.stato as "richiesta" | "attiva" | undefined,
              };
            });

            return (
              <RichiediIscrizioneDialog
                classeId={classe.id}
                classeLabel={classe.corso_nome}
                figli={figliConStato}
                trigger={
                  <Button size="sm" variant="outline">
                    Iscrivi
                  </Button>
                }
              />
            );
          }}
        />
      )}
    </div>
  );
}
