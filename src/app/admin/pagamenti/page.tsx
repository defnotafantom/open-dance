import { createClient } from "@/lib/supabase/server";
import { PagamentoFormDialog } from "./pagamento-form-dialog";
import { PagamentiTable, type PagamentoRiga } from "./pagamenti-table";
import { Button } from "@/components/ui/button";

export default async function PagamentiPage() {
  const supabase = await createClient();

  const [{ data: pagamenti, error }, { data: studenti }] = await Promise.all([
    supabase
      .from("pagamenti")
      .select(
        "id, studente_id, tipo, importo_dovuto, importo_pagato, data_scadenza, data_pagamento, metodo, stato, note"
      )
      .order("data_scadenza", { nullsFirst: false }),
    supabase.from("studenti").select("id, nome, cognome").order("cognome"),
  ]);

  const studentiList = studenti ?? [];
  const studenteById = new Map(studentiList.map((s) => [s.id, `${s.nome} ${s.cognome}`]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight">Pagamenti</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="/admin/pagamenti/export">Esporta CSV</a>}
          />
          <PagamentoFormDialog studenti={studentiList} trigger={<Button>Registra pagamento</Button>} />
        </div>
      </div>
      {error ? (
        <p className="text-destructive text-sm">
          Impossibile caricare i pagamenti: {error.message}
        </p>
      ) : (
        <PagamentiTable
          studenti={studentiList}
          pagamenti={(pagamenti ?? []).map<PagamentoRiga>((p) => ({
            ...p,
            data_scadenza: p.data_scadenza ?? "",
            data_pagamento: p.data_pagamento ?? "",
            note: p.note ?? "",
            studente_nome: studenteById.get(p.studente_id) ?? "Studente",
          }))}
        />
      )}
    </div>
  );
}
