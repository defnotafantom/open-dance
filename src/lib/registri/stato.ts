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
  const oggi = new Date().toISOString().slice(0, 10);
  if (q.data_scadenza && q.data_scadenza < oggi) return "scaduto";
  return pagato > 0 ? "parziale" : "da_pagare";
}

export function residuo(q: { importo_dovuto: number; importo_pagato: number }) {
  return Math.max(0, Number(q.importo_dovuto) - Number(q.importo_pagato));
}

/** Entro quanti giorni una quota si considera "in scadenza". */
export const GIORNI_IN_SCADENZA = 7;
