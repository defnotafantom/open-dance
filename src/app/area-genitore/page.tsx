import Link from "next/link";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { assicuraLezioni } from "@/lib/lezioni/actions";
import { GIORNI_SETTIMANA } from "@/lib/corsi/schemas";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageSquareWarning, Users, Wallet } from "lucide-react";

export default async function AreaGenitorePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: figliGenitore }, { data: figlioAdulto }] = await Promise.all([
    supabase.from("studenti").select("id, nome, cognome").eq("genitore_id", profile.id),
    supabase.from("studenti").select("id, nome, cognome").eq("profilo_id", profile.id),
  ]);
  const figli = [...(figliGenitore ?? []), ...(figlioAdulto ?? [])];
  const figliIds = figli.map((f) => f.id);

  const vuoto = { data: [] as Record<string, unknown>[] };
  const [{ data: iscrizioni }, { data: pagamenti }, { data: comunicazioni }] =
    figliIds.length > 0
      ? await Promise.all([
          supabase
            .from("iscrizioni")
            .select("studente_id, classe_id")
            .in("studente_id", figliIds)
            .eq("stato", "attiva"),
          supabase
            .from("pagamenti")
            .select("id, importo_dovuto, importo_pagato, stato")
            .in("studente_id", figliIds)
            .in("stato", ["da_pagare", "parziale", "scaduto"]),
          supabase.from("comunicazioni").select("id, created_at").order("created_at", { ascending: false }),
        ])
      : [vuoto, vuoto, vuoto];

  const classeIds = [...new Set((iscrizioni ?? []).map((i) => i.classe_id as string))];
  await assicuraLezioni(classeIds, 0, 2);

  const adesso = new Date();
  const oggi = adesso.toISOString().slice(0, 10);
  const tra7Giorni = new Date(adesso.getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data: prossimeLezioni } =
    classeIds.length > 0
      ? await supabase
          .from("lezioni")
          .select("id, classe_id, data, orario_inizio")
          .in("classe_id", classeIds)
          .in("stato", ["regolare", "recuperata"])
          .gte("data", oggi)
          .lte("data", tra7Giorni)
          .order("data")
      : { data: [] as { id: string; classe_id: string; data: string; orario_inizio: string | null }[] };

  const { data: classiInfo } =
    classeIds.length > 0
      ? await supabase.from("classi").select("id, corso_id, orario_inizio").in("id", classeIds)
      : { data: [] as { id: string; corso_id: string; orario_inizio: string }[] };
  const corsoIds = [...new Set((classiInfo ?? []).map((c) => c.corso_id))];
  const { data: corsi } =
    corsoIds.length > 0
      ? await supabase.from("corsi").select("id, nome").in("id", corsoIds)
      : { data: [] as { id: string; nome: string }[] };
  const corsoNomeByClasse = new Map(
    (classiInfo ?? []).map((c) => [c.id, (corsi ?? []).find((co) => co.id === c.corso_id)?.nome ?? "Corso"])
  );

  const { data: letture } = await supabase
    .from("letture_comunicazioni")
    .select("comunicazione_id")
    .eq("profilo_id", profile.id);
  const letteIds = new Set((letture ?? []).map((l) => l.comunicazione_id));
  const nonLette = (comunicazioni ?? []).filter((c) => !letteIds.has(c.id as string)).length;

  const totaleDaSaldare = (pagamenti ?? []).reduce(
    (acc, p) => acc + (Number(p.importo_dovuto) - Number(p.importo_pagato)),
    0
  );

  const stats = [
    { icona: Users, titolo: "Iscritti", valore: String(figli.length) },
    { icona: CalendarDays, titolo: "Lezioni, 7gg", valore: String((prossimeLezioni ?? []).length) },
    { icona: Wallet, titolo: "Da saldare", valore: `€${totaleDaSaldare.toFixed(2)}` },
    { icona: MessageSquareWarning, titolo: "Da leggere", valore: String(nonLette) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">
          Ciao, {profile.nome || "!"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Il riepilogo della tua famiglia a Open Dance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ icona: Icona, titolo, valore }) => (
          <div key={titolo} className="flex flex-col gap-2 rounded-lg border p-4">
            <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Icona className="size-4" />
            </span>
            <p className="text-muted-foreground text-xs">{titolo}</p>
            <p className="font-display text-2xl text-primary">{valore}</p>
          </div>
        ))}
      </div>

      {figli.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <p className="text-sm">Non hai ancora aggiunto nessun iscritto/a.</p>
          <Button size="sm" className="w-fit" nativeButton={false} render={<Link href="/area-genitore/figli">Aggiungi un iscritto</Link>} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-xl uppercase tracking-tight">Prossimi 7 giorni</h2>
          {(prossimeLezioni ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nessuna lezione in programma nei prossimi 7 giorni.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(prossimeLezioni ?? []).slice(0, 6).map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                >
                  <span className="font-medium">{corsoNomeByClasse.get(l.classe_id) ?? "Corso"}</span>
                  <span className="text-muted-foreground">
                    {GIORNI_SETTIMANA[new Date(l.data).getDay()]}{" "}
                    {new Date(l.data).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    {l.orario_inizio ? ` · ${l.orario_inizio.slice(0, 5)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/area-genitore/orario">Orario</Link>} />
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/area-genitore/pagamenti">Pagamenti</Link>} />
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/area-genitore/comunicazioni">Comunicazioni</Link>} />
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/area-genitore/figli">Iscritti</Link>} />
      </div>
    </div>
  );
}
