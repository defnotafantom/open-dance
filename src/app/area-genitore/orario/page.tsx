import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { WeeklySchedule, type ClasseOrario } from "@/components/schedule/weekly-schedule";
import { RichiediIscrizioneDialog, type FiglioConStato } from "./richiedi-iscrizione-dialog";
import { RinnoviDisponibili, type RinnovoDisponibile } from "./rinnovi-disponibili";
import { Button } from "@/components/ui/button";

export default async function OrarioGenitorePage() {
  const profile = await getProfile();
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
  const classeById = new Map((classi ?? []).map((c) => [c.id, c]));

  function etichettaClasse(classeId: string) {
    const c = classeById.get(classeId);
    if (!c) return "Classe";
    return `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)} (${c.stagione})`;
  }

  const figliIds = (figli ?? []).map((f) => f.id);
  const { data: iscrizioni } =
    figliIds.length > 0
      ? await supabase
          .from("iscrizioni")
          .select("id, studente_id, classe_id, stato")
          .in("studente_id", figliIds)
          .in("stato", ["richiesta", "attiva", "lista_attesa"])
      : { data: [] as { id: string; studente_id: string; classe_id: string; stato: string }[] };

  const nomeFiglioById = new Map((figli ?? []).map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  // Rinnovi: per ogni iscrizione attiva, se il corso ha un'altra classe
  // attiva in una stagione diversa a cui il figlio non e' gia' iscritto o
  // in attesa, proponiamo il rinnovo con un click.
  const rinnovi: RinnovoDisponibile[] = [];
  for (const i of iscrizioni ?? []) {
    if (i.stato !== "attiva") continue;
    const classeVecchia = classeById.get(i.classe_id);
    if (!classeVecchia) continue;

    const candidate = (classi ?? []).filter(
      (c) =>
        c.corso_id === classeVecchia.corso_id &&
        c.id !== classeVecchia.id &&
        c.stagione !== classeVecchia.stagione
    );

    for (const nuova of candidate) {
      const giaRichiesta = (iscrizioni ?? []).some(
        (altra) => altra.studente_id === i.studente_id && altra.classe_id === nuova.id
      );
      if (giaRichiesta) continue;

      rinnovi.push({
        figlioId: i.studente_id,
        figlioNome: nomeFiglioById.get(i.studente_id) ?? "—",
        corsoNome: corsoNomeById.get(nuova.corso_id) ?? "Corso",
        classeVecchiaLabel: etichettaClasse(classeVecchia.id),
        classeNuovaId: nuova.id,
        classeNuovaLabel: etichettaClasse(nuova.id),
      });
    }
  }

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
        <>
          <RinnoviDisponibili rinnovi={rinnovi} />
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
                  stato: iscrizione?.stato as "richiesta" | "attiva" | "lista_attesa" | undefined,
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
        </>
      )}
    </div>
  );
}
