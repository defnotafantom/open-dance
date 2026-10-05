import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Grain } from "@/components/marketing/grain";
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
    <section className="relative flex flex-col items-center gap-6 overflow-hidden bg-background px-6 pt-24 pb-16 text-center text-foreground sm:pt-28 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, color-mix(in oklch, var(--primary), transparent 80%), transparent)",
        }}
      />
      <Grain />
      {eyebrow && (
        <p className="relative text-xs font-semibold tracking-[0.32em] text-primary uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="relative max-w-4xl font-display text-5xl leading-[0.9] uppercase tracking-tight text-balance sm:text-6xl lg:text-7xl">
        {titolo}
      </h1>
      {intro && <div className="relative max-w-xl text-muted-foreground">{intro}</div>}
      {children}
    </section>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-4 bg-sidebar px-6 py-10 text-sidebar-foreground/60">
      <Logo size={24} />
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
        {NAV_PUBBLICO.filter((i) => i.href !== "/").map((i) => (
          <Link key={i.href} href={i.href} className="hover:text-sidebar-foreground">
            {i.label}
          </Link>
        ))}
      </nav>
      <p className="text-xs">&copy; {new Date().getFullYear()} Open Dance &mdash; dal 1999</p>
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
    <p className="mx-auto max-w-md rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
