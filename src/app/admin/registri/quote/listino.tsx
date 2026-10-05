"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { salvaTariffa } from "@/lib/registri/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tariffa = { attivita: "danza" | "fitness"; voce: "iscrizione" | "mensile"; importo: number };

const CELLE = [
  { attivita: "danza", voce: "iscrizione", label: "Iscrizione danza" },
  { attivita: "danza", voce: "mensile", label: "Mensile danza" },
  { attivita: "fitness", voce: "iscrizione", label: "Iscrizione fitness" },
  { attivita: "fitness", voce: "mensile", label: "Mensile fitness" },
] as const;

export function Listino({ stagione, tariffe }: { stagione: string; tariffe: Tariffa[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [valori, setValori] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      CELLE.map((c) => {
        const t = tariffe.find((x) => x.attivita === c.attivita && x.voce === c.voce);
        return [`${c.attivita}-${c.voce}`, t ? String(t.importo) : ""];
      })
    )
  );

  async function salva() {
    setPending(true);
    for (const c of CELLE) {
      const v = valori[`${c.attivita}-${c.voce}`].replace(",", ".").trim();
      if (!v) continue;
      const r = await salvaTariffa({ attivita: c.attivita, voce: c.voce, stagione, importo: Number(v) });
      if (r.error) {
        setPending(false);
        return void toast.error(r.error);
      }
    }
    setPending(false);
    toast.success("Listino salvato.");
    router.refresh();
  }

  return (
    <div className="panel-3d flex flex-col gap-4 rounded-xl p-5">
      <div>
        <h2 className="font-display text-lg uppercase">Listino {stagione}</h2>
        <p className="text-muted-foreground text-xs">
          Prezzi usati per generare le quote. &quot;Danza + Fitness&quot; paga la somma dei due.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CELLE.map((c) => {
          const k = `${c.attivita}-${c.voce}`;
          return (
            <label key={k} className="grid gap-1.5 text-sm">
              {c.label} (€)
              <Input
                inputMode="decimal"
                value={valori[k]}
                onChange={(e) => setValori((v) => ({ ...v, [k]: e.target.value }))}
                placeholder="0,00"
              />
            </label>
          );
        })}
      </div>
      <div>
        <Button onClick={salva} disabled={pending}>
          {pending ? "Salvataggio..." : "Salva listino"}
        </Button>
      </div>
    </div>
  );
}
