import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function EventiFeed() {
  const supabase = await createClient();
  const oggi = new Date().toISOString().slice(0, 10);
  const { data: eventi, error } = await supabase
    .from("eventi")
    .select("id, nome, data, luogo, descrizione")
    .gte("data", oggi)
    .order("data");

  if (error) {
    return (
      <p className="text-destructive text-sm">Impossibile caricare gli eventi: {error.message}</p>
    );
  }

  if (!eventi || eventi.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessun evento in programma.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {eventi.map((evento) => (
        <Card key={evento.id}>
          <CardHeader>
            <CardTitle className="text-base">{evento.nome}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {new Date(evento.data).toLocaleDateString("it-IT", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {evento.luogo ? ` · ${evento.luogo}` : ""}
            </p>
          </CardHeader>
          {evento.descrizione && (
            <CardContent>
              <p className="text-sm">{evento.descrizione}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
