import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AreaInsegnantePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: classi, error } = await supabase
    .from("classi")
    .select("id, corso_id, giorno_settimana, orario_inizio, orario_fine, sala")
    .eq("insegnante_id", profile.id)
    .eq("attiva", true)
    .order("giorno_settimana");

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl uppercase tracking-tight">Le mie classi</h1>
        <p className="text-destructive text-sm">Impossibile caricare le classi: {error.message}</p>
      </div>
    );
  }

  if (!classi || classi.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl uppercase tracking-tight">Le mie classi</h1>
        <p className="text-muted-foreground text-sm">
          Non ti e&apos; ancora stata assegnata nessuna classe.
        </p>
      </div>
    );
  }

  const corsoIds = [...new Set(classi.map((c) => c.corso_id))];
  const classeIds = classi.map((c) => c.id);

  const [{ data: corsi }, { data: iscrizioni }] = await Promise.all([
    supabase.from("corsi").select("id, nome").in("id", corsoIds),
    supabase
      .from("iscrizioni")
      .select("id, studente_id, classe_id")
      .in("classe_id", classeIds)
      .eq("stato", "attiva"),
  ]);

  const studenteIds = [...new Set((iscrizioni ?? []).map((i) => i.studente_id))];
  const { data: studenti } =
    studenteIds.length > 0
      ? await supabase.from("studenti").select("id, nome, cognome").in("id", studenteIds)
      : { data: [] as { id: string; nome: string; cognome: string }[] };

  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const studenteById = new Map((studenti ?? []).map((s) => [s.id, `${s.nome} ${s.cognome}`]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Le mie classi</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {classi.map((classe) => {
          const allievi = (iscrizioni ?? [])
            .filter((i) => i.classe_id === classe.id)
            .map((i) => studenteById.get(i.studente_id))
            .filter((nome): nome is string => !!nome);

          return (
            <Card key={classe.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {corsoNomeById.get(classe.corso_id) ?? "Corso"}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {GIORNI_SETTIMANA[classe.giorno_settimana]}{" "}
                  {classe.orario_inizio.slice(0, 5)}–{classe.orario_fine.slice(0, 5)}
                  {classe.sala ? ` · ${classe.sala}` : ""}
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-sm font-medium">
                  Allievi iscritti <Badge variant="secondary">{allievi.length}</Badge>
                </p>
                {allievi.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nessun allievo iscritto.</p>
                ) : (
                  <ul className="text-sm">
                    {allievi.map((nome) => (
                      <li key={nome}>{nome}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
