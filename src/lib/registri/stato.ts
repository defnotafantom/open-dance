import { giornoRoma } from "@/lib/date";
/**
 * Lo stato salvato nel database si aggiorna quando si registra un incasso;
 * il ritardo invece dipende dalla data di oggi, quindi si calcola qui.
 */
export type StatoQuota = "pagato" | "parziale" | "da_pagare" | "scaduto";

export function statoQuota(q: {
  importo_dovuto: number;
  importo_pagato: number;
  data_scadenza: string | null;
}): StatoQuota {
  const dovuto = Number(q.importo_dovuto);
  const pagato = Number(q.importo_pagato);
  if (pagato >= dovuto) return "pagato";
  const oggi = giornoRoma();
  if (q.data_scadenza && q.data_scadenza < oggi) return "scaduto";
  return pagato > 0 ? "parziale" : "da_pagare";
}

export function residuo(q: { importo_dovuto: number; importo_pagato: number }) {
  return Math.max(0, Number(q.importo_dovuto) - Number(q.importo_pagato));
}

/** Entro quanti giorni una quota si considera "in scadenza". */
export const GIORNI_IN_SCADENZA = 7;

/** Quanto e' stato versato in piu' e non ancora restituito. */
export function credito(q: { importo_dovuto: number; importo_pagato: number; importo_rimborsato?: number }) {
  return Math.max(
    0,
    Number(q.importo_pagato) - Number(q.importo_dovuto) - Number(q.importo_rimborsato ?? 0)
  );
}

export type Avviso = {
  tipo: "da_versare" | "da_restituire";
  importo: number;
  scaduto: boolean;
};

/**
 * Avvisi "permanenti" di una voce: esistono finche' la condizione non e'
 * soddisfatta e spariscono da soli quando lo e' (pagamento completo,
 * eccedenza restituita). Non si salvano: si ricalcolano sempre.
 */
export function avvisiVoce(q: {
  importo_dovuto: number;
  importo_pagato: number;
  importo_rimborsato?: number;
  data_scadenza: string | null;
}): Avviso[] {
  const avvisi: Avviso[] = [];
  const daVersare = residuo(q);
  if (daVersare > 0) {
    avvisi.push({ tipo: "da_versare", importo: daVersare, scaduto: statoQuota(q) === "scaduto" });
  }
  const daRestituire = credito(q);
  if (daRestituire > 0) {
    avvisi.push({ tipo: "da_restituire", importo: daRestituire, scaduto: false });
  }
  return avvisi;
}

/** Data e ora in orario italiano, qualunque sia il fuso del dispositivo. */
export function dataOraRoma(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
