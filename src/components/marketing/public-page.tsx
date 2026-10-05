import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrbNav, type NavItem } from "@/components/layout/orb-nav";

/** Le sezioni pubbliche del sito, visibili anche a chi non fa parte della scuola. */
export const NAV_PUBBLICO: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/scuola", label: "La scuola" },
  { href: "/corsi", label: "I corsi" },
  { href: "/insegnanti", label: "Insegnanti" },
  { href: "/28-anni", label: "Speciale 28 anni" },
  { href: "/lavora-con-noi", label: "Lavora con noi" },
  { href: "/login", label: "Accedi" },
];

/** Etichetta piccola sopra i titoli: condensato spaziato, in rosso. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`font-display text-[0.7rem] tracking-[0.32em] text-primary uppercase ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

export function PublicHero({
  eyebrow,
  titolo,
  intro,
  children,
}: {
  eyebrow?: string;
  titolo: React.ReactNode;
  intro?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-5 bg-background px-6 pt-28 pb-14 text-center text-foreground sm:pt-32 sm:pb-20">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="max-w-4xl font-display text-5xl leading-[0.92] uppercase text-balance sm:text-6xl lg:text-7xl">
        {titolo}
      </h1>
      {intro && <div className="max-w-xl text-muted-foreground">{intro}</div>}
      {children}
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-5 bg-sidebar px-6 py-12 text-sidebar-foreground/60">
      <Logo size={28} className="text-sidebar-foreground" />
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {NAV_PUBBLICO.filter((i) => i.href !== "/").map((i) => (
          <Link key={i.href} href={i.href} className="hover:text-sidebar-foreground">
            {i.label}
          </Link>
        ))}
      </nav>
      <p className="font-wordmark text-xs tracking-[0.3em] uppercase">
        Since 1999 &middot; Terme Vigliatore
      </p>
    </footer>
  );
}

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col">
      <OrbNav nav={NAV_PUBBLICO} />
      <ThemeToggle className="fixed top-4 right-4 z-40" />
      {children}
      <PublicFooter />
    </main>
  );
}

/** Messaggio per le sezioni non ancora compilate dallo staff. */
export function InArrivo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto max-w-md rounded-[1.75rem] border-2 border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
