import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nomiInsegnantiPubblici } from "@/lib/insegnanti/pubblici";
import { Grain } from "@/components/marketing/grain";
import { PublicPage } from "@/components/marketing/public-page";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";

export default async function InsegnanteProfiloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: insegnante } = await supabase
    .from("insegnanti_profili")
    .select("profilo_id, bio, carriera, specializzazioni, anni_esperienza, foto_path, cv_path, pubblicato")
    .eq("profilo_id", id)
    .eq("pubblicato", true)
    .maybeSingle();

  if (!insegnante) {
    notFound();
  }

  const nome = (await nomiInsegnantiPubblici([id])).get(id) ?? "Insegnante";
  const fotoUrl = insegnante.foto_path
    ? supabase.storage.from("insegnanti").getPublicUrl(insegnante.foto_path).data.publicUrl
    : null;
  const cvUrl = insegnante.cv_path
    ? supabase.storage.from("insegnanti").getPublicUrl(insegnante.cv_path).data.publicUrl
    : null;
  // Il percorso si scrive una tappa per riga ("2008 · Diploma..."): se la
  // riga inizia con un anno lo evidenziamo come una timeline.
  const tappe = (insegnante.carriera ?? "")
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const m = r.match(/^(\d{4}(?:\s*[-–]\s*\d{4})?)\s*[·:\-–]?\s*(.*)$/);
      return m ? { anno: m[1], testo: m[2] } : { anno: null, testo: r };
    });

  return (
    <PublicPage>
      <section className="relative overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary), transparent 82%), transparent)",
          }}
        />
        <Grain />
        <div className="relative flex flex-col gap-8 px-6 pt-24 pb-16 sm:px-12 lg:px-24 lg:pt-28 lg:pb-24">
          <Link
            href="/insegnanti"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" /> Tutti gli insegnanti
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-10 px-6 py-12 sm:px-12 lg:flex-row lg:px-24 lg:py-16">
        <div className="aspect-square w-full max-w-xs shrink-0 overflow-hidden rounded-lg bg-muted lg:-mt-24">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center font-display text-6xl text-muted-foreground/40 uppercase">
              {nome.slice(0, 1)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">{nome}</h1>
            {insegnante.specializzazioni && (
              <p className="mt-2 text-primary font-medium">{insegnante.specializzazioni}</p>
            )}
            {insegnante.anni_esperienza != null && (
              <p className="text-muted-foreground text-sm">
                {insegnante.anni_esperienza} anni di esperienza
              </p>
            )}
            {cvUrl && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                nativeButton={false}
                render={
                  <a href={cvUrl} target="_blank" rel="noreferrer" download>
                    <DownloadIcon /> Scarica il CV
                  </a>
                }
              />
            )}
          </div>

          {insegnante.bio && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-lg uppercase tracking-tight">Chi è</h2>
              <p className="max-w-2xl whitespace-pre-line text-muted-foreground">{insegnante.bio}</p>
            </div>
          )}

          {tappe.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-lg uppercase tracking-tight">Il percorso</h2>
              <ol className="flex max-w-2xl flex-col border-l border-border">
                {tappe.map((t, i) => (
                  <li key={i} className="relative pb-5 pl-6 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-1.5 size-3 rounded-full bg-primary"
                    />
                    {t.anno && (
                      <span className="mr-2 font-display text-lg text-primary">{t.anno}</span>
                    )}
                    <span className="text-muted-foreground">{t.testo}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </PublicPage>
  );
}
