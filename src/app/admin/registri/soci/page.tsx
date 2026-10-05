import Link from "next/link";
import { caricaQuote, caricaSoci } from "@/lib/registri/dati";
import { Button } from "@/components/ui/button";
import { SociTable } from "./soci-table";

export default async function SociPage() {
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
          {soci.filter((s) => s.attivo).length} soci attivi su {soci.length}. Il numero di tessera
          viene assegnato in automatico e si può correggere.
        </p>
        <Button nativeButton={false} render={<Link href="/admin/iscrizioni/nuova">Nuovo socio</Link>} />
      </div>
      <SociTable
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
