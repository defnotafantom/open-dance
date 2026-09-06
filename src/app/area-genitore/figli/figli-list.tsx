"use client";

import { StudenteFormDialog } from "@/components/studenti/studente-form-dialog";
import { aggiornaStudente } from "@/lib/studenti/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudenteInput } from "@/lib/studenti/schemas";

export type FiglioEsistente = StudenteInput & { id: string };

export function FigliList({ figli }: { figli: FiglioEsistente[] }) {
  if (figli.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Non hai ancora aggiunto nessun figlio.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {figli.map((figlio) => (
        <Card key={figlio.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {figlio.nome} {figlio.cognome}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              Nato/a il {new Date(figlio.data_nascita).toLocaleDateString("it-IT")}
            </p>
            <StudenteFormDialog
              studente={figlio}
              titolo={`Modifica ${figlio.nome}`}
              onSubmit={(values) => aggiornaStudente(figlio.id, values)}
              trigger={
                <Button variant="outline" size="sm" className="w-fit">
                  Modifica
                </Button>
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
