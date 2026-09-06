import { createClient } from "@/lib/supabase/server";
import { assicuraLezioni } from "@/lib/lezioni/actions";
import { Badge } from "@/components/ui/badge";
import { ProssimeLezioniList, type ProssimaLezione } from "./conferma-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATO_LABEL: Record<string, string> = {
  presente: "Presente",
  assente: "Assente",
  giustificato: "Giustificato",
};

export default async function PresenzeGenitorePage() {
  const supabase = await createClient();

  const { data: figli } = await supabase.from("studenti").select("id, nome, cognome");
  const figliList = figli ?? [];
  const figliIds = figliList.map((f) => f.id);
  const nomeById = new Map(figliList.map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  // --- Prossime lezioni: conferma di presenza prospettica ---
  const { data: iscrizioniAttive } =
    figliIds.length > 0
      ? await supabase
          .from("iscrizioni")
          .select("studente_id, classe_id")
          .in("studente_id", figliIds)
          .eq("stato", "attiva")
      : { data: [] as { studente_id: string; classe_id: string }[] };

  const classeIds = [...new Set((iscrizioniAttive ?? []).map((i) => i.classe_id))];
  await assicuraLezioni(classeIds, 0, 2);

  const adesso = new Date();
  const oggi = adesso.toISOString().slice(0, 10);
  const tra14Giorni = new Date(adesso.getTime() + 14 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: prossimeLezioni } =
    classeIds.length > 0
      ? await supabase
          .from("lezioni")
          .select("id, classe_id, data, orario_inizio")
          .in("classe_id", classeIds)
          .eq("stato", "regolare")
          .gte("data", oggi)
          .lte("data", tra14Giorni)
          .order("data")
      : { data: [] as { id: string; classe_id: string; data: string; orario_inizio: string | null }[] };

  const { data: classiInfo } =
    classeIds.length > 0
      ? await supabase.from("classi").select("id, corso_id, orario_inizio").in("id", classeIds)
      : { data: [] as { id: string; corso_id: string; orario_inizio: string }[] };

  const corsoIdsProssime = [...new Set((classiInfo ?? []).map((c) => c.corso_id))];
  const { data: corsiProssime } =
    corsoIdsProssime.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIdsProssime)
      : { data: [] as { id: string; nome: string }[] };

  const corsoNomeByClasse = new Map(
    (classiInfo ?? []).map((c) => [
      c.id,
      (corsiProssime ?? []).find((co) => co.id === c.corso_id)?.nome ?? "Corso",
    ])
  );
  const orarioByClasse = new Map((classiInfo ?? []).map((c) => [c.id, c.orario_inizio]));

  const lezioneIdsProssime = (prossimeLezioni ?? []).map((l) => l.id);
  const { data: conferme } =
    lezioneIdsProssime.length > 0
      ? await supabase
          .from("conferme_presenza")
          .select("lezione_id, studente_id, verra")
          .in("lezione_id", lezioneIdsProssime)
      : { data: [] as { lezione_id: string; studente_id: string; verra: boolean }[] };

  const confermaByKey = new Map(
    (conferme ?? []).map((c) => [`${c.lezione_id}:${c.studente_id}`, c.verra])
  );

  const prossimeRighe: ProssimaLezione[] = (prossimeLezioni ?? []).flatMap((lezione) => {
    const studentiDellaClasse = (iscrizioniAttive ?? [])
      .filter((i) => i.classe_id === lezione.classe_id)
      .map((i) => i.studente_id);

    return studentiDellaClasse.map((studenteId) => ({
      lezioneId: lezione.id,
      studenteId,
      studenteNome: nomeById.get(studenteId) ?? "—",
      corsoNome: corsoNomeByClasse.get(lezione.classe_id) ?? "Corso",
      data: lezione.data,
      orario: lezione.orario_inizio ?? orarioByClasse.get(lezione.classe_id) ?? "",
      verra: confermaByKey.get(`${lezione.id}:${studenteId}`) ?? null,
    }));
  });

  // --- Storico presenze registrate dall'insegnante ---
  const { data: presenze, error } =
    figliIds.length > 0
      ? await supabase
          .from("presenze")
          .select("id, studente_id, stato, lezione_id")
          .in("studente_id", figliIds)
      : { data: [], error: null };

  const lezioneIdsStorico = [...new Set((presenze ?? []).map((p) => p.lezione_id))];
  const { data: lezioniStorico } =
    lezioneIdsStorico.length > 0
      ? await supabase.from("lezioni").select("id, classe_id, data").in("id", lezioneIdsStorico)
      : { data: [] as { id: string; classe_id: string; data: string }[] };

  const classeIdsStorico = [...new Set((lezioniStorico ?? []).map((l) => l.classe_id))];
  const { data: classiStorico } =
    classeIdsStorico.length > 0
      ? await supabase.from("classi").select("id, corso_id").in("id", classeIdsStorico)
      : { data: [] as { id: string; corso_id: string }[] };

  const corsoIdsStorico = [...new Set((classiStorico ?? []).map((c) => c.corso_id))];
  const { data: corsiStorico } =
    corsoIdsStorico.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIdsStorico)
      : { data: [] as { id: string; nome: string }[] };

  const corsoNomeById = new Map((corsiStorico ?? []).map((c) => [c.id, c.nome]));
  const corsoIdByClasse = new Map((classiStorico ?? []).map((c) => [c.id, c.corso_id]));
  const lezioneById = new Map((lezioniStorico ?? []).map((l) => [l.id, l]));

  const righeStorico = (presenze ?? [])
    .map((p) => {
      const lezione = lezioneById.get(p.lezione_id);
      if (!lezione) return null;
      return {
        id: p.id,
        studente: nomeById.get(p.studente_id) ?? "—",
        corso: corsoNomeById.get(corsoIdByClasse.get(lezione.classe_id) ?? "") ?? "Corso",
        data: lezione.data,
        stato: p.stato,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Presenze</h1>
          <p className="text-muted-foreground text-sm">
            Conferma se il tuo/la tua figlio/a ci sarà: aiuta l&apos;insegnante a
            prepararsi sapendo in anticipo quanti allievi aspettarsi.
          </p>
        </div>
        <ProssimeLezioniList righe={prossimeRighe} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Storico</h2>
        {error ? (
          <p className="text-destructive text-sm">
            Impossibile caricare le presenze: {error.message}
          </p>
        ) : righeStorico.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna presenza registrata ancora.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Figlio/a</TableHead>
                <TableHead>Corso</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {righeStorico.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.studente}</TableCell>
                  <TableCell>{r.corso}</TableCell>
                  <TableCell>{new Date(r.data).toLocaleDateString("it-IT")}</TableCell>
                  <TableCell>
                    <Badge variant={r.stato === "assente" ? "destructive" : "secondary"}>
                      {STATO_LABEL[r.stato] ?? r.stato}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
