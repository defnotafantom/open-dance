import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { PushToggle } from "@/components/push-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Logo } from "@/components/brand/logo";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export type NavItem = { href: string; label: string };

export function AppShell({
  title,
  nav,
  profile,
  children,
}: {
  title: string;
  nav: NavItem[];
  profile: { nome: string; cognome: string; email: string };
  children: React.ReactNode;
}) {
  const iniziali = `${profile.nome[0] ?? ""}${profile.cognome[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      {/* Barra mobile: la navigazione principale vive nel drawer, non in una
          lista orizzontale che andrebbe a capo con 8+ voci su schermi stretti
          — la stragrande maggioranza di chi usa il sito e' da telefono. */}
      <header className="dark flex items-center justify-between border-b border-sidebar-border bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
        <Link href="/" className="flex items-center gap-2 px-1">
          <Logo size={28} />
        </Link>
        <MobileNav nav={nav} title={title} profile={profile} />
      </header>

      <aside className="dark hidden flex-col gap-4 border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex md:w-60 md:border-r">
        <Link href="/">
          <Logo size={32} />
        </Link>
        <p className="-mt-2 text-[0.7rem] font-medium tracking-wide text-sidebar-foreground/50 uppercase">
          {title}
        </p>
        <SidebarNav nav={nav} />
        <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border pt-4">
          <Avatar>
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {iniziali || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profile.nome} {profile.cognome}
            </p>
            <p className="truncate text-sidebar-foreground/50 text-xs">{profile.email}</p>
          </div>
        </div>
        <PushToggle />
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Esci
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
