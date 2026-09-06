import { createClient } from "@/lib/supabase/server";
import { StudentiTable, type StudenteRiga } from "./studenti-table";

export default async function StudentiPage() {
  const supabase = await createClient();

  const { data: studenti, error } = await supabase
    .from("studenti")
    .select("id, nome, cognome, data_nascita, is_adulto, genitore_id, profilo_id")
    .order("cognome");

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Studenti</h1>
        <p className="text-destructive text-sm">Impossibile caricare gli studenti: {error.message}</p>
      </div>
    );
  }

  const referenteIds = [
    ...new Set((studenti ?? []).map((s) => s.genitore_id ?? s.profilo_id).filter((id): id is string => !!id)),
  ];
  const { data: referenti } =
    referenteIds.length > 0
      ? await supabase.from("profiles").select("id, nome, cognome, email").in("id", referenteIds)
      : { data: [] as { id: string; nome: string; cognome: string; email: string }[] };

  const referenteById = new Map((referenti ?? []).map((r) => [r.id, `${r.nome} ${r.cognome} (${r.email})`]));

  const righe: StudenteRiga[] = (studenti ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    cognome: s.cognome,
    data_nascita: s.data_nascita,
    is_adulto: s.is_adulto,
    referente: s.is_adulto
      ? "Se stesso/a"
      : referenteById.get(s.genitore_id ?? "") ?? "—",
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Studenti</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Gli studenti vengono creati da genitori e allievi maggiorenni nella
        propria area. Da qui puoi consultarli e, se necessario, rimuoverli.
      </p>
      <StudentiTable studenti={righe} />
    </div>
  );
}
