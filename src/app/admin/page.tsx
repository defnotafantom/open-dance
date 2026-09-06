import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const supabase = await createClient();

  const [studenti, classi, richieste] = await Promise.all([
    supabase.from("studenti").select("id", { count: "exact", head: true }),
    supabase.from("classi").select("id", { count: "exact", head: true }).eq("attiva", true),
    supabase.from("iscrizioni").select("id", { count: "exact", head: true }).eq("stato", "richiesta"),
  ]);

  const stats = [
    { titolo: "Studenti iscritti", valore: studenti.count ?? "—" },
    { titolo: "Classi attive", valore: classi.count ?? "—" },
    { titolo: "Iscrizioni in attesa", valore: richieste.count ?? "—" },
    { titolo: "Pagamenti in sospeso", valore: "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Panoramica</h1>
      <p className="text-muted-foreground">
        Le sezioni pagamenti e comunicazioni arrivano nelle prossime milestone.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.titolo}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-normal">
                {s.titolo}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{s.valore}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
