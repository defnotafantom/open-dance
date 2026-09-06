"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completaCancellazioneDati } from "@/lib/privacy/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RichiestaRiga = { id: string; richiesto_at: string; referente_label: string };

export function RichiesteCancellazioneList({ richieste }: { richieste: RichiestaRiga[] }) {
  const router = useRouter();
  const [inLavorazione, setInLavorazione] = useState<string | null>(null);
  const [confermaId, setConfermaId] = useState<string | null>(null);

  async function handleCompleta(id: string) {
    setInLavorazione(id);
    const result = await completaCancellazioneDati(id);
    setInLavorazione(null);
    setConfermaId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Dati anonimizzati e accesso disabilitato.");
    router.refresh();
  }

  if (richieste.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessuna richiesta in attesa.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Richiesta il</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {richieste.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.referente_label}</TableCell>
            <TableCell>{new Date(r.richiesto_at).toLocaleDateString("it-IT")}</TableCell>
            <TableCell className="text-right">
              {confermaId === r.id ? (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-muted-foreground text-xs">Confermi? Non e&apos; reversibile.</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={inLavorazione === r.id}
                    onClick={() => handleCompleta(r.id)}
                  >
                    Conferma
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfermaId(null)}>
                    Annulla
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfermaId(r.id)}>
                  Evadi
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
