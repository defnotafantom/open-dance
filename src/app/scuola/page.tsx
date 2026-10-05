import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InArrivo, PublicHero, PublicPage } from "@/components/marketing/public-page";
import { SEZIONI_SCUOLA } from "@/lib/sito/costanti";

export const metadata: Metadata = {
  title: "La scuola · Open Dance",
  description: "Le aule, la scuola, quello che facciamo e quello che abbiamo fatto.",
};

export default async function ScuolaPage() {
  const supabase = await createClient();
  const { data: contenuti } = await supabase
    .from("scuola_contenuti")
    .select("id, sezione, titolo, descrizione, foto_path")
    .eq("pubblicato", true)
    .order("ordine")
    .order("created_at");

  const conFoto = (contenuti ?? []).map((c) => ({
    ...c,
    fotoUrl: c.foto_path
      ? supabase.storage.from("sito").getPublicUrl(c.foto_path).data.publicUrl
      : null,
  }));

  return (
    <PublicPage>
      <PublicHero
        eyebrow="Open Dance · dal 1999"
        titolo="La scuola"
        intro="Entra con noi: gli spazi, le persone e tutto quello che succede dentro e fuori dalla sala."
      >
        <nav className="relative flex flex-wrap justify-center gap-2 pt-2">
          {SEZIONI_SCUOLA.map((s) => (
            <Link
              key={s.value}
              href={`#${s.value}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </PublicHero>

      {SEZIONI_SCUOLA.map((sezione, indice) => {
        const voci = conFoto.filter((c) => c.sezione === sezione.value);
        return (
          <section
            key={sezione.value}
            id={sezione.value}
            className="scroll-mt-20 border-t border-border px-6 py-16 sm:px-12 lg:px-24"
          >
            <div className="mb-10 grid gap-3 sm:grid-cols-[6rem_1fr]">
              <span className="font-display text-3xl text-primary sm:text-4xl">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
                  {sezione.label}
                </h2>
                <p className="mt-1 max-w-xl text-muted-foreground">{sezione.intro}</p>
              </div>
            </div>

            {voci.length === 0 ? (
              <InArrivo>Stiamo preparando questa sezione: torna a trovarci presto.</InArrivo>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {voci.map((v) => (
                  <article key={v.id} className="flex flex-col gap-3">
                    {v.fotoUrl && (
                      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.fotoUrl}
                          alt={v.titolo}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-display text-xl uppercase tracking-tight">{v.titolo}</h3>
                    {v.descrizione && (
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {v.descrizione}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </PublicPage>
  );
}
