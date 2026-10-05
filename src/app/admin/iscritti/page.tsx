import Link from "next/link";
import { caricaQuote, caricaSoci } from "@/lib/registri/dati";
import { Button } from "@/components/ui/button";
import { IscrittiTable } from "./iscritti-table";

export default async function IscrittiPage() {
  const [soci, aperte] = await Promise.all([caricaSoci(), caricaQuote({ soloAperte: true })]);

  const situazione = new Map<string, { ritardo: number; aperto: number; avvisi: { tipo: "da_versare" | "da_restituire"; importo: number; scaduto: boolean; voce: string }[] }>();
  for (const q of aperte) {
    const s = situazione.get(q.studente_id) ?? { ritardo: 0, aperto: 0, avvisi: [] };
    s.aperto += q.residuo;
    if (q.stato === "scaduto") s.ritardo += 1;
    for (const a of q.avvisi) s.avvisi.push({ ...a, voce: q.descrizione });
    situazione.set(q.studente_id, s);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {soci.filter((s) => s.attivo).length} attivi su {soci.length}. Un clic sul nome apre la
          scheda completa: corsi, quote, ricevute, accesso al sito e storia.
        </p>
        <Button nativeButton={false} render={<Link href="/admin/iscritti/nuovo">Nuovo iscritto</Link>} />
      </div>
      <IscrittiTable
        soci={soci.map((s) => ({
          ...s,
          ritardo: situazione.get(s.id)?.ritardo ?? 0,
          aperto: situazione.get(s.id)?.aperto ?? 0,
          avvisi: situazione.get(s.id)?.avvisi ?? [],
        }))}
      />
    </div>
  );
}
