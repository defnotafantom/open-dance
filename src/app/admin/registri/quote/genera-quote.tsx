"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generaQuoteMese } from "@/lib/registri/actions";
import { nomeMese } from "@/lib/registri/costanti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GeneraQuote({ mese }: { mese: string }) {
  const router = useRouter();
  const [giorno, setGiorno] = useState("10");
  const [pending, setPending] = useState(false);

  async function genera() {
    setPending(true);
    const r = await generaQuoteMese({ mese, giorno_scadenza: Number(giorno) });
    setPending(false);
    if (r.error) return void toast.error(r.error);
    const parti = [`${r.create} quote create`];
    if (r.giaPresenti) parti.push(`${r.giaPresenti} già presenti`);
    if (r.senzaPrezzo) parti.push(`${r.senzaPrezzo} soci saltati: manca il prezzo nel listino`);
    (r.senzaPrezzo ? toast.warning : toast.success)(parti.join(" · "));
    router.refresh();
  }

  return (
    <div className="panel-3d flex flex-col gap-4 rounded-xl p-5">
      <div>
        <h2 className="font-display text-lg uppercase">Quote del mese</h2>
        <p className="text-muted-foreground text-xs">
          Crea la quota mensile per tutti i soci attivi che non ce l&apos;hanno ancora. Si può
          ripetere senza creare doppioni.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm">
          Mese
          <Input
            type="month"
            value={mese}
            onChange={(e) => e.target.value && router.push(`/admin/registri/quote?mese=${e.target.value}`)}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          Scadenza (giorno)
          <Input
            inputMode="numeric"
            value={giorno}
            onChange={(e) => setGiorno(e.target.value.replace(/\D/g, "").slice(0, 2))}
          />
        </label>
      </div>
      <div>
        <Button onClick={genera} disabled={pending || !giorno}>
          {pending ? "Creazione..." : `Genera quote di ${nomeMese(mese)}`}
        </Button>
      </div>
    </div>
  );
}
