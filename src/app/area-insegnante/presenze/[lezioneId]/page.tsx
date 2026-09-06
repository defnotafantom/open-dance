import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { RosterPresenze, type AllievoConPresenza } from "./roster-presenze";

export default async function PresenzeLezionePage({
  params,
}: {
  params: Promise<{ lezioneId: string }>;
}) {
  const { lezioneId } = await params;
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: lezione } = await supabase
    .from("lezioni")
    .select("id, classe_id, data")
    .eq("id", lezioneId)
    .single();

  if (!lezione) {
    notFound();
  }

  const { data: classe } = await supabase
    .from("classi")
    .select("id, corso_id, insegnante_id")
    .eq("id", lezione.classe_id)
    .single();

  if (!classe || classe.insegnante_id !== profile.id) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-destructive text-sm">
          Questa lezione non appartiene a una delle tue classi.
        </p>
      </div>
    );
  }

  const [{ data: corso }, { data: iscrizioni }, { data: presenze }] = await Promise.all([
    supabase.from("corsi").select("nome").eq("id", classe.corso_id).single(),
    supabase
      .from("iscrizioni")
      .select("studente_id")
      .eq("classe_id", classe.id)
      .eq("stato", "attiva"),
    supabase.from("presenze").select("studente_id, stato").eq("lezione_id", lezioneId),
  ]);

  const studenteIds = (iscrizioni ?? []).map((i) => i.studente_id);
  const { data: studenti } =
    studenteIds.length > 0
      ? await supabase.from("studenti").select("id, nome, cognome").in("id", studenteIds).order("cognome")
      : { data: [] as { id: string; nome: string; cognome: string }[] };

  const statoByStudente = new Map((presenze ?? []).map((p) => [p.studente_id, p.stato]));

  const allievi: AllievoConPresenza[] = (studenti ?? []).map((s) => ({
    id: s.id,
    nome: s.nome,
    cognome: s.cognome,
    stato: statoByStudente.get(s.id) ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/area-insegnante/presenze" className="text-muted-foreground text-sm hover:underline">
          ← Tutte le lezioni
        </Link>
        <h1 className="text-2xl font-semibold">
          {corso?.nome ?? "Corso"} —{" "}
          {new Date(lezione.data).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h1>
      </div>
      <RosterPresenze lezioneId={lezioneId} allievi={allievi} />
    </div>
  );
}
