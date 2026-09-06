import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { TIPO_LABEL, METODO_LABEL } from "@/lib/pagamenti/schemas";

function escapeCsv(value: string) {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Export di supporto per il commercialista della scuola: NON e' un documento
// fiscale (ricevuta/fattura). Confermare con il commercialista se e' sufficiente.
export async function GET() {
  await requireRuolo(RUOLI_STAFF);

  const supabase = await createClient();
  const { data: pagamenti, error } = await supabase
    .from("pagamenti")
    .select(
      "studente_id, tipo, importo_dovuto, importo_pagato, data_scadenza, data_pagamento, metodo, stato, note"
    )
    .order("data_pagamento", { nullsFirst: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const studenteIds = [...new Set((pagamenti ?? []).map((p) => p.studente_id))];
  const { data: studenti } =
    studenteIds.length > 0
      ? await supabase.from("studenti").select("id, nome, cognome").in("id", studenteIds)
      : { data: [] as { id: string; nome: string; cognome: string }[] };
  const studenteById = new Map((studenti ?? []).map((s) => [s.id, `${s.nome} ${s.cognome}`]));

  const intestazione = [
    "Studente",
    "Tipo",
    "Importo dovuto",
    "Importo pagato",
    "Scadenza",
    "Data pagamento",
    "Metodo",
    "Stato",
    "Note",
  ];

  const righe = (pagamenti ?? []).map((p) =>
    [
      studenteById.get(p.studente_id) ?? "",
      TIPO_LABEL[p.tipo],
      p.importo_dovuto.toFixed(2),
      p.importo_pagato.toFixed(2),
      p.data_scadenza ?? "",
      p.data_pagamento ?? "",
      p.metodo ? METODO_LABEL[p.metodo] : "",
      p.stato,
      p.note ?? "",
    ]
      .map((v) => escapeCsv(String(v)))
      .join(";")
  );

  const csv = "﻿" + [intestazione.join(";"), ...righe].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagamenti_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
