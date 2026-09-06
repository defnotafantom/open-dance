import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { Button } from "@/components/ui/button";
import { IscrizioniTable, type RichiestaIscrizione } from "./iscrizioni-table";

export default async function IscrizioniPage() {
  const supabase = await createClient();

  const { data: righeIscrizioni, error } = await supabase
    .from("iscrizioni")
    .select("id, studente_id, classe_id, data_iscrizione, stato")
    .in("stato", ["richiesta", "lista_attesa"])
    .order("data_iscrizione");

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Iscrizioni</h1>
        <p className="text-destructive text-sm">Impossibile caricare le richieste: {error.message}</p>
      </div>
    );
  }

  const righe = righeIscrizioni ?? [];
  const studenteIds = [...new Set(righe.map((r) => r.studente_id))];
  const classeIds = [...new Set(righe.map((r) => r.classe_id))];

  const [{ data: studenti }, { data: classi }] = await Promise.all([
    studenteIds.length > 0
      ? supabase.from("studenti").select("id, nome, cognome").in("id", studenteIds)
      : Promise.resolve({ data: [] as { id: string; nome: string; cognome: string }[] }),
    classeIds.length > 0
      ? supabase
          .from("classi")
          .select("id, corso_id, giorno_settimana, orario_inizio, orario_fine")
          .in("id", classeIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            corso_id: string;
            giorno_settimana: number;
            orario_inizio: string;
            orario_fine: string;
          }[],
        }),
  ]);

  const corsoIds = [...new Set((classi ?? []).map((c) => c.corso_id))];
  const { data: corsi } =
    corsoIds.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIds)
      : { data: [] as { id: string; nome: string }[] };

  const studenteById = new Map((studenti ?? []).map((s) => [s.id, `${s.nome} ${s.cognome}`]));
  const corsoNomeById = new Map((corsi ?? []).map((c) => [c.id, c.nome]));
  const classeById = new Map(
    (classi ?? []).map((c) => [
      c.id,
      `${corsoNomeById.get(c.corso_id) ?? "Corso"} — ${GIORNI_SETTIMANA[c.giorno_settimana]} ${c.orario_inizio.slice(0, 5)}`,
    ])
  );

  function aRighe(stato: string): RichiestaIscrizione[] {
    return righe
      .filter((r) => r.stato === stato)
      .map((r) => ({
        id: r.id,
        studente_nome: studenteById.get(r.studente_id) ?? "Studente",
        classe_label: classeById.get(r.classe_id) ?? "Classe",
        data_iscrizione: r.data_iscrizione,
      }));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Iscrizioni in attesa</h1>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/iscrizioni/nuova">+ Nuova iscrizione manuale</Link>}
          />
        </div>
        <IscrizioniTable richieste={aRighe("richiesta")} />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Lista d&apos;attesa</h2>
          <p className="text-muted-foreground text-sm">
            Richieste arrivate quando la classe aveva gia&apos; raggiunto la capienza massima.
          </p>
        </div>
        <IscrizioniTable
          richieste={aRighe("lista_attesa")}
          messaggioVuoto="Nessuno in lista d'attesa."
          etichettaApprova="Promuovi"
          etichettaRifiuta="Rimuovi"
        />
      </div>
    </div>
  );
}
