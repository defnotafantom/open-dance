import { Badge } from "@/components/ui/badge";
import type { StatoPagamento } from "@/lib/pagamenti/schemas";

const CONFIG: Record<StatoPagamento, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pagato: { label: "Pagato", variant: "default" },
  parziale: { label: "Parziale", variant: "secondary" },
  da_pagare: { label: "Da pagare", variant: "outline" },
  scaduto: { label: "Scaduto", variant: "destructive" },
};

export function StatoPagamentoBadge({ stato }: { stato: StatoPagamento }) {
  const { label, variant } = CONFIG[stato];
  return <Badge variant={variant}>{label}</Badge>;
}
