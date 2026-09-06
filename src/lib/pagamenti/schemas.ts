import * as z from "zod";

export const pagamentoSchema = z.object({
  studente_id: z.uuid(),
  tipo: z.enum(["quota_corso", "iscrizione_annuale", "saggio", "altro"]),
  importo_dovuto: z.number().positive({ error: "Inserisci un importo dovuto valido." }),
  importo_pagato: z.number().min(0, { error: "L'importo pagato non puo' essere negativo." }),
  data_scadenza: z.string().optional(),
  data_pagamento: z.string().optional(),
  metodo: z.enum(["contanti", "bonifico", "pos", "altro"]).nullable(),
  note: z.string().optional(),
});

export type PagamentoInput = z.infer<typeof pagamentoSchema>;

export const TIPO_LABEL: Record<PagamentoInput["tipo"], string> = {
  quota_corso: "Quota corso",
  iscrizione_annuale: "Iscrizione annuale",
  saggio: "Saggio",
  altro: "Altro",
};

export const METODO_LABEL: Record<NonNullable<PagamentoInput["metodo"]>, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  pos: "POS",
  altro: "Altro",
};

export type StatoPagamento = "da_pagare" | "parziale" | "pagato" | "scaduto";

export function calcolaStato(input: {
  importo_dovuto: number;
  importo_pagato: number;
  data_scadenza?: string;
}): StatoPagamento {
  if (input.importo_pagato >= input.importo_dovuto) {
    return "pagato";
  }
  if (input.importo_pagato > 0) {
    return "parziale";
  }
  const oggi = new Date().toISOString().slice(0, 10);
  if (input.data_scadenza && input.data_scadenza < oggi) {
    return "scaduto";
  }
  return "da_pagare";
}
