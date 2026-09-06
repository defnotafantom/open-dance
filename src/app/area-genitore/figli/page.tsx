import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { creaFiglio, attivaProfiloAllievoAdulto } from "@/lib/studenti/actions";
import { FigliList } from "./figli-list";
import { StudenteFormDialog } from "@/components/studenti/studente-form-dialog";
import { Button } from "@/components/ui/button";

export default async function FigliPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  if (profile.ruolo === "allievo_adulto") {
    const { data: mioStudente } = await supabase
      .from("studenti")
      .select("id, nome, cognome, data_nascita, codice_fiscale")
      .eq("profilo_id", profile.id)
      .maybeSingle();

    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Il mio profilo studente</h1>
        {mioStudente ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground">
              {mioStudente.nome} {mioStudente.cognome} — nato/a il{" "}
              {new Date(mioStudente.data_nascita).toLocaleDateString("it-IT")}
            </p>
            <StudenteFormDialog
              studente={{ ...mioStudente, codice_fiscale: mioStudente.codice_fiscale ?? "" }}
              titolo="Modifica i tuoi dati"
              onSubmit={attivaProfiloAllievoAdulto}
              trigger={
                <Button variant="outline" className="w-fit">
                  Modifica i miei dati
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground max-w-md">
              Completa i tuoi dati per poter richiedere l&apos;iscrizione ai corsi.
            </p>
            <StudenteFormDialog
              studente={{
                nome: profile.nome,
                cognome: profile.cognome,
                data_nascita: "",
                codice_fiscale: "",
              }}
              titolo="Completa il tuo profilo"
              onSubmit={attivaProfiloAllievoAdulto}
              trigger={<Button className="w-fit">Completa profilo</Button>}
            />
          </div>
        )}
      </div>
    );
  }

  const { data: figli, error } = await supabase
    .from("studenti")
    .select("id, nome, cognome, data_nascita, codice_fiscale")
    .eq("genitore_id", profile.id)
    .order("data_nascita");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">I miei figli</h1>
        <StudenteFormDialog
          titolo="Aggiungi figlio"
          onSubmit={creaFiglio}
          trigger={<Button>Aggiungi figlio</Button>}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i dati: {error.message}
        </p>
      ) : (
        <FigliList
          figli={(figli ?? []).map((f) => ({ ...f, codice_fiscale: f.codice_fiscale ?? "" }))}
        />
      )}
    </div>
  );
}
