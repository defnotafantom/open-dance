import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";

export type ClasseOrario = {
  id: string;
  giorno_settimana: number;
  orario_inizio: string;
  orario_fine: string;
  sala: string | null;
  corso_nome: string;
  insegnante_nome?: string | null;
};

const ORDINE_GIORNI = [1, 2, 3, 4, 5, 6, 0];

export function WeeklySchedule({
  classi,
  azione,
}: {
  classi: ClasseOrario[];
  azione?: (classe: ClasseOrario) => React.ReactNode;
}) {
  if (classi.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nessuna classe in programma al momento.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {ORDINE_GIORNI.map((giorno) => {
        const classiDelGiorno = classi
          .filter((c) => c.giorno_settimana === giorno)
          .sort((a, b) => a.orario_inizio.localeCompare(b.orario_inizio));

        if (classiDelGiorno.length === 0) return null;

        return (
          <div key={giorno} className="flex flex-col gap-2">
            <h3 className="font-medium">{GIORNI_SETTIMANA[giorno]}</h3>
            <ul className="flex flex-col gap-2">
              {classiDelGiorno.map((classe) => (
                <li
                  key={classe.id}
                  className="rounded-lg panel-3d p-3 text-sm flex items-start justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">{classe.corso_nome}</p>
                    <p className="text-muted-foreground">
                      {classe.orario_inizio.slice(0, 5)}–{classe.orario_fine.slice(0, 5)}
                      {classe.sala ? ` · ${classe.sala}` : ""}
                    </p>
                    {classe.insegnante_nome && (
                      <p className="text-muted-foreground">{classe.insegnante_nome}</p>
                    )}
                  </div>
                  {azione?.(classe)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
