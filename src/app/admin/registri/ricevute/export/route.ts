import { giornoRoma } from "@/lib/date";
import { requireRuolo, RUOLI_STAFF } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { METODI } from "@/lib/registri/costanti";

function csv(valore: string | number | null | undefined) {
  const v = valore == null ? "" : String(valore);
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Registro delle ricevute dell'anno, per il commercialista (separatore ;). */
export async function GET(request: Request) {
  await requireRuolo(RUOLI_STAFF);
  const anno = Number(new URL(request.url).searchParams.get("anno")) || Number(giornoRoma().slice(0, 4));

  const supabase = await createClient();
  const { data: ricevute, error } = await supabase
    .from("versamenti")
    .select("numero, anno, data, pagatore_nome, pagatore_codice_fiscale, causale, metodo, importo, annullato, motivo_annullamento, pagamento_id")
    .eq("anno", anno)
    .order("numero");
  if (error) return new Response(error.message, { status: 500 });

  const pagamentoIds = [...new Set((ricevute ?? []).map((r) => r.pagamento_id))];
  const { data: pagamenti } = pagamentoIds.length
    ? await supabase.from("pagamenti").select("id, studente_id").in("id", pagamentoIds)
    : { data: [] as { id: string; studente_id: string }[] };
  const studenteIds = [...new Set((pagamenti ?? []).map((p) => p.studente_id))];
  const { data: studenti } = studenteIds.length
    ? await supabase.from("studenti").select("id, nome, cognome, numero_tessera").in("id", studenteIds)
    : { data: [] as { id: string; nome: string; cognome: string; numero_tessera: number | null }[] };
  const studenteDi = new Map((pagamenti ?? []).map((p) => [p.id, (studenti ?? []).find((s) => s.id === p.studente_id)]));

  const righe = [
    ["Numero", "Data", "Pagatore", "Codice fiscale pagatore", "Socio", "Tessera", "Causale", "Metodo", "Importo", "Annullata", "Motivo annullamento"],
    ...(ricevute ?? []).map((r) => {
      const s = studenteDi.get(r.pagamento_id);
      return [
        `${r.numero}/${r.anno}`,
        new Date(r.data).toLocaleDateString("it-IT"),
        r.pagatore_nome,
        r.pagatore_codice_fiscale,
        s ? `${s.nome} ${s.cognome}` : "",
        s?.numero_tessera,
        r.causale,
        METODI.find((m) => m.value === r.metodo)?.label ?? r.metodo,
        Number(r.importo).toFixed(2).replace(".", ","),
        r.annullato ? "Sì" : "No",
        r.motivo_annullamento,
      ];
    }),
  ];

  return new Response("﻿" + righe.map((r) => r.map(csv).join(";")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ricevute_${anno}.csv"`,
    },
  });
}
