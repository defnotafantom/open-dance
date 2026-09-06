import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { creaFiglio, iscriviTeStesso } from "@/lib/studenti/actions";
import { FigliList } from "./figli-list";
import { StudenteFormDialog } from "@/components/studenti/studente-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FigliPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: iscritti, error } = await supabase
    .from("studenti")
    .select("id, nome, cognome, data_nascita, codice_fiscale, genitore_id, profilo_id")
    .order("data_nascita");

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Iscritti</h1>
        <p className="text-destructive text-sm">Impossibile caricare i dati: {error.message}</p>
      </div>
    );
  }

  const mioProfilo = (iscritti ?? []).find((s) => s.profilo_id === profile.id);
  const figli = (iscritti ?? []).filter((s) => s.genitore_id === profile.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Iscritti</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Le persone che frequentano i corsi con questo accesso: te stesso/a
          e/o i tuoi figli.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Il mio profilo</h2>
        {mioProfilo ? (
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {mioProfilo.nome} {mioProfilo.cognome}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Nato/a il {new Date(mioProfilo.data_nascita).toLocaleDateString("it-IT")}
              </p>
              <StudenteFormDialog
                studente={{ ...mioProfilo, codice_fiscale: mioProfilo.codice_fiscale ?? "" }}
                titolo="Modifica i miei dati"
                onSubmit={iscriviTeStesso}
                trigger={
                  <Button variant="outline" size="sm" className="w-fit">
                    Modifica
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Se frequenti tu stesso/a un corso, aggiungiti come iscritto/a.
            </p>
            <StudenteFormDialog
              studente={{
                nome: profile.nome,
                cognome: profile.cognome,
                data_nascita: "",
                codice_fiscale: "",
              }}
              titolo="Iscrivi te stesso/a"
              onSubmit={iscriviTeStesso}
              trigger={<Button className="w-fit">Iscrivi te stesso/a</Button>}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Figli</h2>
          <StudenteFormDialog
            titolo="Aggiungi figlio/a"
            onSubmit={creaFiglio}
            trigger={<Button>Aggiungi figlio/a</Button>}
          />
        </div>
        <FigliList
          figli={figli.map((f) => ({ ...f, codice_fiscale: f.codice_fiscale ?? "" }))}
        />
      </div>
    </div>
  );
}
