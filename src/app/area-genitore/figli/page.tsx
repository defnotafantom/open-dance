import { createClient } from "@/lib/supabase/server";
import { FigliList } from "./figli-list";

export default async function FigliPage() {
  const supabase = await createClient();

  const { data: iscritti, error } = await supabase
    .from("studenti")
    .select("id, nome, cognome, data_nascita, codice_fiscale, genitore_id, profilo_id")
    .order("data_nascita");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Iscritti</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Le persone iscritte con questo accesso. Puoi correggere i dati anagrafici; per
          iscrivere qualcuno o cambiare corso rivolgiti alla segreteria.
        </p>
      </div>
      {error ? (
        <p className="text-destructive text-sm">Impossibile caricare i dati: {error.message}</p>
      ) : (
        <FigliList
          figli={(iscritti ?? []).map((f) => ({ ...f, codice_fiscale: f.codice_fiscale ?? "" }))}
        />
      )}
    </div>
  );
}
