import { requireRuolo, RUOLI_STAFF, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV_BASE: NavItem[] = [
  { href: "/admin", label: "Panoramica" },
  { href: "/admin/corsi", label: "Corsi e classi" },
  { href: "/admin/studenti", label: "Studenti" },
  { href: "/admin/iscrizioni", label: "Iscrizioni" },
  { href: "/admin/pagamenti", label: "Pagamenti" },
  { href: "/admin/eventi", label: "Eventi" },
  { href: "/admin/comunicazioni", label: "Comunicazioni" },
  { href: "/admin/staff", label: "Staff" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRuolo(RUOLI_STAFF);

  // "Impostazioni" tocca i dati anagrafici della scuola: visibile solo a chi
  // puo' effettivamente modificarli (webmaster/proprietario/co-proprietario),
  // non alla segreteria.
  const nav = RUOLI_TITOLARI.includes(profile.ruolo)
    ? [...NAV_BASE, { href: "/admin/impostazioni", label: "Impostazioni" }]
    : NAV_BASE;

  return (
    <AppShell title="Area staff" nav={nav} profile={profile}>
      {children}
    </AppShell>
  );
}
