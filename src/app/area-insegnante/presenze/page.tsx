import Link from "next/link";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { assicuraLezioni } from "@/lib/lezioni/actions";
import { Badge } from "@/components/ui/badge";

export default async function PresenzePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: classi, error: classiError } = await supabase
    .from("classi")
    .select("id, corso_id")
    .eq("insegnante_id", profile.id)
    .eq("attiva", true);

  if (classiError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Presenze</h1>
        <p className="text-destructive text-sm">
          Impossibile caricare le tue classi: {classiError.message}
        </p>
      </div>
    );
  }

  if (!classi || classi.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Presenze</h1>
        <p className="text-muted-foreground text-sm">
          Non ti e&apos; ancora stata assegnata nessuna classe.
        </p>
      </div>
    );
  }

  const classeIds = classi.map((c) => c.id);
  await assicuraLezioni(classeIds, 1, 2);

  const oggi = new Date();
  const dataOggi = oggi.toISOString().slice(0, 10);
  const daData = new Date(oggi.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const aData = new Date(oggi.getTime() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data: lezioni, error } = await supabase
    .from("lezioni")
    .select("id, classe_id, data, stato")
    .in("classe_id", classeIds)
    .gte("data", daData)
    .lte("data", aData)
    .order("data");

  const corsoIds = [...new Set(classi.map((c) => c.corso_id))];
  const { data: corsi } = await supabase.from("corsi").select("id, nome").in("id", corsoIds);
  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const corsoIdByClasse = new Map(classi.map((c) => [c.id, c.corso_id]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Presenze</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare le lezioni: {error.message}
        </p>
      ) : !lezioni || lezioni.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna lezione in programma.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lezioni.map((l) => (
            <li key={l.id}>
              <Link
                href={`/area-insegnante/presenze/${l.id}`}
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted"
              >
                <span>
                  {corsoNomeById.get(corsoIdByClasse.get(l.classe_id) ?? "") ?? "Corso"} —{" "}
                  {new Date(l.data).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <div className="flex gap-2">
                  {l.data === dataOggi && <Badge>Oggi</Badge>}
                  {l.stato === "annullata" && <Badge variant="destructive">Annullata</Badge>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
