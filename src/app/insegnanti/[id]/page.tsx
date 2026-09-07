import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { Grain } from "@/components/marketing/grain";
import { ArrowLeftIcon } from "lucide-react";

export default async function InsegnanteProfiloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: insegnante } = await supabase
    .from("insegnanti_profili")
    .select("profilo_id, bio, carriera, specializzazioni, anni_esperienza, foto_path, pubblicato")
    .eq("profilo_id", id)
    .eq("pubblicato", true)
    .maybeSingle();

  if (!insegnante) {
    notFound();
  }

  const { data: profilo } = await supabase
    .from("profiles")
    .select("nome, cognome")
    .eq("id", id)
    .maybeSingle();
  const nome = profilo ? `${profilo.nome} ${profilo.cognome}` : "Insegnante";
  const fotoUrl = insegnante.foto_path
    ? supabase.storage.from("insegnanti").getPublicUrl(insegnante.foto_path).data.publicUrl
    : null;

  return (
    <main className="flex flex-1 flex-col">
      <section className="dark relative overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary), transparent 82%), transparent)",
          }}
        />
        <Grain />
        <div className="relative flex flex-col gap-8 px-6 py-16 sm:px-12 lg:flex-row lg:items-end lg:px-24 lg:py-24">
          <div className="flex flex-col gap-4">
            <Link
              href="/insegnanti"
              className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" /> Tutti gli insegnanti
            </Link>
            <Logo size={28} />
          </div>
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
          </div>

          {insegnante.bio && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-lg uppercase tracking-tight">Chi è</h2>
              <p className="max-w-2xl whitespace-pre-line text-muted-foreground">{insegnante.bio}</p>
            </div>
          )}

          {insegnante.carriera && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-lg uppercase tracking-tight">Carriera</h2>
              <p className="max-w-2xl whitespace-pre-line text-muted-foreground">{insegnante.carriera}</p>
            </div>
          )}
        </div>
      </section>

      <footer className="dark mt-8 flex flex-col items-center gap-3 bg-sidebar px-6 py-10 text-sidebar-foreground/60">
        <Logo size={24} />
        <p className="text-xs">&copy; {new Date().getFullYear()} Open Dance &mdash; dal 1999</p>
      </footer>
    </main>
  );
}
