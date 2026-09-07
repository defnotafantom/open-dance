import { OrbNav, type NavItem } from "@/components/layout/orb-nav";

export type { NavItem };

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
  return (
    <div className="min-h-full flex-1">
      <OrbNav nav={nav} title={title} profile={profile} />
      <main className="p-4 pt-20 md:p-8 md:pt-24">{children}</main>
    </div>
  );
}
