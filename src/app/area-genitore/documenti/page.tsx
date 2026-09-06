import { createClient } from "@/lib/supabase/server";
import { DocumentoUploadDialog } from "./documento-upload-dialog";
import { DocumentiList, type DocumentoRiga } from "./documenti-list";
import { Button } from "@/components/ui/button";

export default async function DocumentiGenitorePage() {
  const supabase = await createClient();

  const { data: figli } = await supabase.from("studenti").select("id, nome, cognome");
  const figliList = figli ?? [];
  const figliIds = figliList.map((f) => f.id);
  const nomeById = new Map(figliList.map((f) => [f.id, `${f.nome} ${f.cognome}`]));

  const { data: documenti, error } =
    figliIds.length > 0
      ? await supabase
          .from("documenti")
          .select("id, studente_id, tipo, data_scadenza, file_path")
          .in("studente_id", figliIds)
          .order("data_scadenza", { nullsFirst: false })
      : { data: [], error: null };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight">Documenti</h1>
        {figliList.length > 0 && (
          <DocumentoUploadDialog studenti={figliList} trigger={<Button>Carica documento</Button>} />
        )}
      </div>
      {figliList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aggiungi prima un figlio (o completa il tuo profilo) per poter caricare documenti.
        </p>
      ) : error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i documenti: {error.message}
        </p>
      ) : (
        <DocumentiList
          documenti={(documenti ?? []).map<DocumentoRiga>((d) => ({
            id: d.id,
            studente_nome: nomeById.get(d.studente_id) ?? "—",
            tipo: d.tipo,
            data_scadenza: d.data_scadenza,
            file_path: d.file_path,
          }))}
        />
      )}
    </div>
  );
}
