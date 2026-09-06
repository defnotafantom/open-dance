import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
  const figliIds = (figli ?? []).map((f) => f.id);
  const nomeById = new Map((figli ?? []).map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  const { data: presenze, error } =
    figliIds.length > 0
      ? await supabase
          .from("presenze")
          .select("id, studente_id, stato, lezione_id")
          .in("studente_id", figliIds)
      : { data: [], error: null };

  const lezioneIds = [...new Set((presenze ?? []).map((p) => p.lezione_id))];
  const { data: lezioni } =
    lezioneIds.length > 0
      ? await supabase.from("lezioni").select("id, classe_id, data").in("id", lezioneIds)
      : { data: [] as { id: string; classe_id: string; data: string }[] };

  const classeIds = [...new Set((lezioni ?? []).map((l) => l.classe_id))];
  const { data: classi } =
    classeIds.length > 0
      ? await supabase.from("classi").select("id, corso_id").in("id", classeIds)
      : { data: [] as { id: string; corso_id: string }[] };

  const corsoIds = [...new Set((classi ?? []).map((c) => c.corso_id))];
  const { data: corsi } =
    corsoIds.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIds)
      : { data: [] as { id: string; nome: string }[] };

  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const corsoIdByClasse = new Map((classi ?? []).map((c) => [c.id, c.corso_id]));
  const lezioneById = new Map((lezioni ?? []).map((l) => [l.id, l]));

  const righe = (presenze ?? [])
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Presenze</h1>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare le presenze: {error.message}
        </p>
      ) : righe.length === 0 ? (
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
            {righe.map((r) => (
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
  );
}
