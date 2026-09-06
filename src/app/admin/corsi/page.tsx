import { createClient } from "@/lib/supabase/server";
import { CorsoFormDialog } from "./corso-form-dialog";
import { CorsiTable } from "./corsi-table";
import { Button } from "@/components/ui/button";

export default async function CorsiPage() {
  const supabase = await createClient();
  const { data: corsi, error } = await supabase
    .from("corsi")
    .select("id, nome, descrizione, categoria, livello, attivo")
    .order("nome");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight">Corsi</h1>
        <CorsoFormDialog trigger={<Button>Nuovo corso</Button>} />
      </div>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i corsi: {error.message}
        </p>
      ) : (
        <CorsiTable
          corsi={(corsi ?? []).map((c) => ({
            id: c.id,
            nome: c.nome,
            descrizione: c.descrizione ?? "",
            categoria: c.categoria ?? "",
            livello: c.livello ?? "",
            attivo: c.attivo,
          }))}
        />
      )}
    </div>
  );
}
