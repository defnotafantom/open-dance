import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Panoramica</h1>
      <p className="text-muted-foreground">
        Le sezioni corsi, iscrizioni, pagamenti e comunicazioni arrivano nelle
        prossime milestone. Da qui puoi gia&apos; invitare nuovo personale.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { titolo: "Studenti iscritti", valore: "—" },
          { titolo: "Classi attive", valore: "—" },
          { titolo: "Pagamenti in sospeso", valore: "—" },
          { titolo: "Comunicazioni inviate", valore: "—" },
        ].map((s) => (
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
