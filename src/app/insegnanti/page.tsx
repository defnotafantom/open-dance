import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { Grain } from "@/components/marketing/grain";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function InsegnantiPage() {
  const supabase = await createClient();

  const { data: insegnanti } = await supabase
    .from("insegnanti_profili")
    .select("profilo_id, specializzazioni, anni_esperienza, foto_path")
    .eq("pubblicato", true);

  const profiloIds = (insegnanti ?? []).map((i) => i.profilo_id);
  const { data: profili } =
    profiloIds.length > 0
      ? await supabase.from("profiles").select("id, nome, cognome").in("id", profiloIds)
      : { data: [] as { id: string; nome: string; cognome: string }[] };
  const nomeById = new Map((profili ?? []).map((p) => [p.id, `${p.nome} ${p.cognome}`]));

  const conFoto = (insegnanti ?? []).map((i) => ({
    ...i,
    nome: nomeById.get(i.profilo_id) ?? "Insegnante",
    fotoUrl: i.foto_path
      ? supabase.storage.from("insegnanti").getPublicUrl(i.foto_path).data.publicUrl
      : null,
  }));

  return (
    <main className="flex flex-1 flex-col">
      <ThemeToggle className="fixed top-4 right-4 z-40" />
      <section className="relative flex flex-col items-center gap-6 overflow-hidden bg-background px-6 py-20 text-center text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary), transparent 82%), transparent)",
          }}
        />
        <Grain />
        <Link href="/" className="relative">
          <Logo size={32} />
        </Link>
        <h1 className="relative font-display text-5xl uppercase tracking-tight sm:text-6xl">
          Gli insegnanti
        </h1>
        <p className="relative max-w-md text-muted-foreground">
          Le persone che ogni settimana insegnano danza a Open Dance.
        </p>
      </section>

      <section className="px-6 py-16 sm:px-12 lg:px-24">
        {conFoto.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            I profili degli insegnanti arriveranno presto.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {conFoto.map((i) => (
              <Link
                key={i.profilo_id}
                href={`/insegnanti/${i.profilo_id}`}
                className="group flex flex-col gap-4"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                  {i.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={i.fotoUrl}
                      alt=""
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-display text-4xl text-muted-foreground/40 uppercase">
                      {i.nome.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl uppercase tracking-tight group-hover:text-primary">
                    {i.nome}
                  </h2>
                  {i.specializzazioni && (
                    <p className="text-muted-foreground text-sm">{i.specializzazioni}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 flex flex-col items-center gap-3 bg-sidebar px-6 py-10 text-sidebar-foreground/60">
        <Logo size={24} />
        <p className="text-xs">&copy; {new Date().getFullYear()} Open Dance &mdash; dal 1999</p>
      </footer>
    </main>
  );
}
