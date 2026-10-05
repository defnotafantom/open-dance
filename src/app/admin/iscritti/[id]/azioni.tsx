"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rigeneraCredenziali } from "@/lib/staff/actions";
import { eliminaStudenteStaff } from "@/lib/studenti/actions";
import { terminaIscrizione } from "@/lib/iscrizioni/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { CredenzialiCard, type CredenzialiMostrate } from "@/components/iscritti/credenziali-card";
import { Button } from "@/components/ui/button";

export function AccessoFamiglia({ studenteId, codice }: { studenteId: string; codice: string | null }) {
  const [credenziali, setCredenziali] = useState<CredenzialiMostrate | null>(null);

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Accesso al sito</span>
        <span className="font-mono">{codice ?? "—"}</span>
      </div>
      {credenziali ? (
        <CredenzialiCard credenziali={credenziali} />
      ) : (
        <ConfirmActionDialog
          trigger={<Button size="sm" variant="outline" className="w-fit">{codice ? "Nuova password" : "Crea codice e password"}</Button>}
          title="Generare una nuova password?"
          description="La password attuale smette di funzionare. Quella nuova si vede una volta sola, da consegnare alla famiglia."
          confirmLabel="Genera"
          onConfirm={async () => {
            const r = await rigeneraCredenziali(studenteId);
            if (r.error || !r.credenziali) return void toast.error(r.error ?? "Password non generata.");
            setCredenziali(r.credenziali);
          }}
        />
      )}
    </div>
  );
}

export function RitiraDalCorso({ iscrizioneId, corso }: { iscrizioneId: string; corso: string }) {
  const router = useRouter();
  return (
    <ConfirmActionDialog
      trigger={<Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Ritira</Button>}
      title={`Ritirare da ${corso}?`}
      description="L'iscrizione resta nello storico come terminata; le quote già emesse non cambiano."
      confirmLabel="Ritira"
      onConfirm={async () => {
        const r = await terminaIscrizione(iscrizioneId);
        if (r.error) return void toast.error(r.error);
        toast.success("Ritirato dal corso.");
        router.refresh();
      }}
    />
  );
}

export function EliminaIscritto({ studenteId, nome }: { studenteId: string; nome: string }) {
  const router = useRouter();
  return (
    <ConfirmActionDialog
      trigger={<Button size="sm" variant="destructive">Elimina iscritto</Button>}
      title={`Eliminare ${nome}?`}
      description="Si cancellano anche iscrizioni, presenze e quote. Chi ha ricevute emesse non si può eliminare: segnalo come non attivo."
      confirmLabel="Elimina"
      onConfirm={async () => {
        const r = await eliminaStudenteStaff(studenteId);
        if (r.error) return void toast.error(r.error);
        toast.success("Iscritto eliminato.");
        router.replace("/admin/iscritti");
        router.refresh();
      }}
    />
  );
}
