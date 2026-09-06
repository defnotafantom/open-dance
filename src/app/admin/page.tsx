import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IscrizioniChart, type IscrizioniMese } from "@/components/charts/iscrizioni-chart";
import { PresenzeChart, type PresenzaClasse } from "@/components/charts/presenze-chart";
import { IncassiChart, type IncassoMese } from "@/components/charts/incassi-chart";

const MESI_BREVI = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

function ultimiMesi(n: number) {
  const oggi = new Date();
  const mesi: { chiave: string; etichetta: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(oggi.getFullYear(), oggi.getMonth() - i, 1);
    mesi.push({
      chiave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      etichetta: MESI_BREVI[d.getMonth()],
    });
  }
  return mesi;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const oggi = new Date();
  const seiMesiFa = new Date(oggi.getFullYear(), oggi.getMonth() - 5, 1).toISOString().slice(0, 10);
  const sessantaGiorniFa = new Date(oggi.getTime() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [studenti, classi, richieste, pagamentiSospesi] = await Promise.all([
    supabase.from("studenti").select("id", { count: "exact", head: true }),
    supabase.from("classi").select("id", { count: "exact", head: true }).eq("attiva", true),
    supabase
      .from("iscrizioni")
      .select("id", { count: "exact", head: true })
      .in("stato", ["richiesta", "lista_attesa"]),
    supabase
      .from("pagamenti")
      .select("id", { count: "exact", head: true })
      .in("stato", ["da_pagare", "parziale", "scaduto"]),
  ]);

  const stats = [
    { titolo: "Studenti iscritti", valore: studenti.count ?? "—" },
    { titolo: "Classi attive", valore: classi.count ?? "—" },
    { titolo: "Iscrizioni in attesa", valore: richieste.count ?? "—" },
    { titolo: "Pagamenti in sospeso", valore: pagamentiSospesi.count ?? "—" },
  ];

  // --- Iscrizioni negli ultimi 6 mesi ---
  const mesi6 = ultimiMesi(6);
  const { data: iscrizioniRecenti } = await supabase
    .from("iscrizioni")
    .select("data_iscrizione")
    .gte("data_iscrizione", seiMesiFa);
  const contIscrizioniByMese = new Map<string, number>();
  for (const i of iscrizioniRecenti ?? []) {
    const chiave = i.data_iscrizione.slice(0, 7);
    contIscrizioniByMese.set(chiave, (contIscrizioniByMese.get(chiave) ?? 0) + 1);
  }
  const datiIscrizioni: IscrizioniMese[] = mesi6.map((m) => ({
    mese: m.etichetta,
    nuove: contIscrizioniByMese.get(m.chiave) ?? 0,
  }));

  // --- Incassi negli ultimi 6 mesi ---
  const { data: pagamentiRecenti } = await supabase
    .from("pagamenti")
    .select("importo_pagato, data_pagamento")
    .not("data_pagamento", "is", null)
    .gte("data_pagamento", seiMesiFa);
  const totaleByMese = new Map<string, number>();
  for (const p of pagamentiRecenti ?? []) {
    if (!p.data_pagamento) continue;
    const chiave = p.data_pagamento.slice(0, 7);
    totaleByMese.set(chiave, (totaleByMese.get(chiave) ?? 0) + p.importo_pagato);
  }
  const datiIncassi: IncassoMese[] = mesi6.map((m) => ({
    mese: m.etichetta,
    totale: Math.round((totaleByMese.get(m.chiave) ?? 0) * 100) / 100,
  }));

  // --- Tasso di presenza per classe (ultimi 60 giorni) ---
  const { data: presenzeRecenti } = await supabase
    .from("presenze")
    .select("stato, lezione_id")
    .gte("segnato_at", sessantaGiorniFa);
  const lezioneIds = [...new Set((presenzeRecenti ?? []).map((p) => p.lezione_id))];
  const { data: lezioniInfo } =
    lezioneIds.length > 0
      ? await supabase.from("lezioni").select("id, classe_id").in("id", lezioneIds)
      : { data: [] as { id: string; classe_id: string }[] };
  const classeByLezione = new Map((lezioniInfo ?? []).map((l) => [l.id, l.classe_id]));

  const classeIdsPresenze = [...new Set((lezioniInfo ?? []).map((l) => l.classe_id))];
  const { data: classiInfo } =
    classeIdsPresenze.length > 0
      ? await supabase.from("classi").select("id, corso_id").in("id", classeIdsPresenze)
      : { data: [] as { id: string; corso_id: string }[] };
  const corsoIdsPresenze = [...new Set((classiInfo ?? []).map((c) => c.corso_id))];
  const { data: corsiPresenze } =
    corsoIdsPresenze.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIdsPresenze)
      : { data: [] as { id: string; nome: string }[] };
  const corsoNomeByClasse = new Map(
    (classiInfo ?? []).map((c) => [
      c.id,
      (corsiPresenze ?? []).find((co) => co.id === c.corso_id)?.nome ?? "Corso",
    ])
  );

  const contByClasse = new Map<string, { presenti: number; totale: number }>();
  for (const p of presenzeRecenti ?? []) {
    const classeId = classeByLezione.get(p.lezione_id);
    if (!classeId) continue;
    const nome = corsoNomeByClasse.get(classeId) ?? "Corso";
    const acc = contByClasse.get(nome) ?? { presenti: 0, totale: 0 };
    acc.totale += 1;
    if (p.stato === "presente") acc.presenti += 1;
    contByClasse.set(nome, acc);
  }
  const datiPresenze: PresenzaClasse[] = [...contByClasse.entries()]
    .map(([classe, { presenti, totale }]) => ({
      classe,
      percentuale: totale > 0 ? Math.round((presenti / totale) * 100) : 0,
    }))
    .sort((a, b) => b.percentuale - a.percentuale);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Panoramica</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.titolo}>
              <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  {s.titolo}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{s.valore}</CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nuove iscrizioni, ultimi 6 mesi</CardTitle>
          </CardHeader>
          <CardContent>
            <IscrizioniChart dati={datiIscrizioni} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incassi, ultimi 6 mesi</CardTitle>
          </CardHeader>
          <CardContent>
            <IncassiChart dati={datiIncassi} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasso di presenza per classe (ultimi 60 giorni)</CardTitle>
        </CardHeader>
        <CardContent>
          {datiPresenze.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nessuna presenza registrata negli ultimi 60 giorni.
            </p>
          ) : (
            <PresenzeChart dati={datiPresenze} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
