"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";

export function StampaButton() {
  return (
    <Button onClick={() => window.print()}>
      <PrinterIcon /> Stampa o salva PDF
    </Button>
  );
}
