import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
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
      <aside className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <Link href="/" className="text-lg font-semibold">
          Open Dance
        </Link>
        <p className="text-muted-foreground text-xs">{title}</p>
        <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Avatar>
            <AvatarFallback>{iniziali || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profile.nome} {profile.cognome}
            </p>
            <p className="truncate text-muted-foreground text-xs">{profile.email}</p>
          </div>
        </div>
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
