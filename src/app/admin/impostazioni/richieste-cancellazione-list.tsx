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
import { DataList, DataListItem, DataListRow, DataListLabel } from "@/components/ui/data-list";

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

  function Azioni({ id }: { id: string }) {
    if (confermaId === id) {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-muted-foreground text-xs">Confermi? Non e&apos; reversibile.</span>
          <Button
            size="sm"
            variant="destructive"
            disabled={inLavorazione === id}
            onClick={() => handleCompleta(id)}
          >
            Conferma
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfermaId(null)}>
            Annulla
          </Button>
        </div>
      );
    }
    return (
      <Button size="sm" variant="outline" onClick={() => setConfermaId(id)}>
        Evadi
      </Button>
    );
  }

  return (
    <>
      <Table className="hidden md:table">
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
                <Azioni id={r.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataList>
        {richieste.map((r) => (
          <DataListItem key={r.id}>
            <p className="font-medium">{r.referente_label}</p>
            <DataListRow>
              <DataListLabel>Richiesta il</DataListLabel>
              <span>{new Date(r.richiesto_at).toLocaleDateString("it-IT")}</span>
            </DataListRow>
            <div className="mt-1 flex justify-end">
              <Azioni id={r.id} />
            </div>
          </DataListItem>
        ))}
      </DataList>
    </>
  );
}
