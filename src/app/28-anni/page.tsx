import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InArrivo, PublicHero, PublicPage } from "@/components/marketing/public-page";
import { ANNI_SPECIALE, ANNO_FONDAZIONE } from "@/lib/sito/costanti";
import { TimelineTraguardi } from "./timeline-traguardi";

export const metadata: Metadata = {
  title: `Speciale ${ANNI_SPECIALE} anni · Open Dance`,
  description:
    "Ambizioni, concorsi, contest, competizioni e crescita personale: 28 anni di Open Dance raccontati oltre i premi.",
};

export default async function Speciale28AnniPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("traguardi")
    .select("id, anno, categoria, titolo, contesto, risultato, foto_path")
    .eq("pubblicato", true)
    .order("anno")
    .order("ordine");

  const traguardi = (data ?? []).map((t) => ({
    ...t,
    fotoUrl: t.foto_path
      ? supabase.storage.from("sito").getPublicUrl(t.foto_path).data.publicUrl
      : null,
  }));
  const ambizioni = traguardi.filter((t) => t.categoria === "ambizione");
  const percorso = traguardi.filter((t) => t.categoria !== "ambizione");

  return (
    <PublicPage>
      <PublicHero
        eyebrow={`${ANNO_FONDAZIONE} — ${ANNO_FONDAZIONE + ANNI_SPECIALE}`}
        titolo={
          <>
            <span className="block text-[7rem] leading-none text-primary sm:text-[10rem]">
              {ANNI_SPECIALE}
            </span>
            anni di Open Dance
          </>
        }
        intro="Non la storia dei premi, ma di quello che c'è intorno: le ambizioni, la fatica, le trasferte, le paure prima di salire sul palco e le persone che siamo diventate."
      />

      <section className="border-t border-border px-6 py-16 sm:px-12 lg:px-24">
        <h2 className="mb-2 font-display text-3xl uppercase tracking-tight sm:text-4xl">
          Le nostre ambizioni
        </h2>
        <p className="mb-10 max-w-xl text-muted-foreground">
          Quello verso cui lavoriamo ogni giorno, prima ancora di qualsiasi risultato.
        </p>
        {ambizioni.length === 0 ? (
          <InArrivo>Le ambizioni della scuola arriveranno qui a breve.</InArrivo>
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {ambizioni.map((a, i) => (
              <li
                key={a.id}
                className="grid gap-3 py-8 sm:grid-cols-[6rem_1fr_2fr] sm:items-baseline sm:gap-10"
              >
                <span className="font-display text-3xl text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl uppercase tracking-tight">{a.titolo}</h3>
                {a.contesto && (
                  <p className="whitespace-pre-line text-muted-foreground">{a.contesto}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="border-t border-border bg-sidebar px-6 py-14 text-sidebar-foreground sm:px-12 lg:px-24">
        <p className="max-w-3xl font-display text-2xl uppercase leading-tight tracking-tight sm:text-3xl">
          Un premio dura una sera.{" "}
          <span className="text-primary">Quello che serve per arrivarci resta per sempre:</span>{" "}
          disciplina, fiducia, amicizie, il coraggio di sbagliare davanti a tutti.
        </p>
      </section>

      <section className="border-t border-border px-6 py-16 sm:px-12 lg:px-24">
        <h2 className="mb-2 font-display text-3xl uppercase tracking-tight sm:text-4xl">
          La nostra crescita
        </h2>
        <p className="mb-10 max-w-xl text-muted-foreground">
          Concorsi, contest, competizioni e tappe della scuola, anno per anno. Per ognuno, il
          racconto di com&apos;è andata davvero.
        </p>
        {percorso.length === 0 ? (
          <InArrivo>Stiamo raccogliendo foto e ricordi di questi 28 anni.</InArrivo>
        ) : (
          <TimelineTraguardi traguardi={percorso} />
        )}
      </section>
    </PublicPage>
  );
}
