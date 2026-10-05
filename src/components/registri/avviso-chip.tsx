import { AlertTriangleIcon, RotateCcwIcon } from "lucide-react";
import { euro } from "@/lib/registri/costanti";
import type { Avviso } from "@/lib/registri/stato";
import { cn } from "cn";

/** Avviso permanente: resta finche' la condizione non e' soddisfatta. */
export function AvvisoChip({ avviso, contesto }: { avviso: Avviso; contesto?: string }) {
  const daVersare = avviso.tipo === "da_versare";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        daVersare
          ? avviso.scaduto
            ? "bg-primary text-primary-foreground"
            : "bg-primary/12 text-primary"
          : "bg-foreground/10 text-foreground"
      )}
    >
      {daVersare ? <AlertTriangleIcon className="size-3.5" /> : <RotateCcwIcon className="size-3.5" />}
      {daVersare ? "Da versare" : "Da restituire"} {euro(avviso.importo)}
      {avviso.scaduto && " · scaduto"}
      {contesto && <span className="opacity-75">· {contesto}</span>}
    </span>
  );
}
