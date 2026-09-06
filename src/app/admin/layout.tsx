import { requireRuolo } from "@/lib/auth/dal";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/corsi", label: "Corsi e classi" },
  { href: "/admin/studenti", label: "Studenti" },
  { href: "/admin/iscrizioni", label: "Iscrizioni" },
  { href: "/admin/pagamenti", label: "Pagamenti" },
  { href: "/admin/comunicazioni", label: "Comunicazioni" },
  { href: "/admin/staff", label: "Staff" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRuolo(["admin", "staff"]);

  return (
    <AppShell title="Area staff" nav={NAV} profile={profile}>
      {children}
    </AppShell>
  );
}
