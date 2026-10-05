import { DueFattori } from "./due-fattori";

export default function SicurezzaPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Sicurezza accesso</h1>
        <p className="text-muted-foreground text-sm">
          Con la verifica in due passaggi, per entrare servono la password e un codice che cambia
          ogni 30 secondi sull&apos;app del tuo telefono. Anche chi scoprisse la password non
          potrebbe entrare nel gestionale. Consigliata per titolari e segreteria.
        </p>
      </div>
      <DueFattori />
    </div>
  );
}
