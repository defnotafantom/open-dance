import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClasseFormDialog } from "./classe-form-dialog";
import { ClassiTable } from "./classi-table";
import { Button } from "@/components/ui/button";

export default async function CorsoDettaglioPage({
  params,
}: {
  params: Promise<{ corsoId: string }>;
}) {
  const { corsoId } = await params;
  const supabase = await createClient();

  const { data: corso } = await supabase
    .from("corsi")
    .select("id, nome")
    .eq("id", corsoId)
    .single();

  if (!corso) {
    notFound();
  }

  const [{ data: classi, error: classiError }, { data: insegnantiRaw }] = await Promise.all([
    supabase
      .from("classi")
      .select(
        "id, corso_id, insegnante_id, giorno_settimana, orario_inizio, orario_fine, sala, capienza_max, stagione, attiva"
      )
      .eq("corso_id", corsoId)
      .order("giorno_settimana"),
    supabase.from("profiles").select("id, nome, cognome").eq("ruolo", "insegnante").order("cognome"),
  ]);

  const insegnanti = insegnantiRaw ?? [];
  const insegnantiById = new Map(insegnanti.map((i) => [i.id, `${i.nome} ${i.cognome}`]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/corsi" className="text-muted-foreground text-sm hover:underline">
          ← Tutti i corsi
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl uppercase tracking-tight">{corso.nome}</h1>
          <ClasseFormDialog
            corsoId={corsoId}
            insegnanti={insegnanti}
            trigger={<Button>Nuova classe</Button>}
          />
        </div>
      </div>
      {classiError ? (
        <p className="text-destructive text-sm">
          Impossibile caricare le classi: {classiError.message}
        </p>
      ) : (
        <ClassiTable
          corsoId={corsoId}
          insegnanti={insegnanti}
          classi={(classi ?? []).map((c) => ({
            ...c,
            sala: c.sala ?? "",
            insegnante_nome: c.insegnante_id ? insegnantiById.get(c.insegnante_id) : undefined,
          }))}
        />
      )}
    </div>
  );
}
