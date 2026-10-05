import type { PagamentoMetodoEnum, PagamentoTipoEnum } from "@/lib/supabase/database.types";

// Etichette condivise. Pagamenti, incassi e ricevute si gestiscono nei
// Registri (src/lib/registri).

export const TIPO_LABEL: Record<PagamentoTipoEnum, string> = {
  quota_corso: "Quota corso",
  iscrizione_annuale: "Iscrizione annuale",
  saggio: "Saggio",
  altro: "Altro",
};

export const METODO_LABEL: Record<PagamentoMetodoEnum, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  pos: "POS",
  altro: "Altro",
};

export type StatoPagamento = "da_pagare" | "parziale" | "pagato" | "scaduto";
