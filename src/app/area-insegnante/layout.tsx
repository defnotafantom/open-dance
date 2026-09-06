import { requireAreaInsegnante } from "@/lib/auth/dal";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV: NavItem[] = [
  { href: "/area-insegnante", label: "Le mie classi" },
  { href: "/area-insegnante/presenze", label: "Presenze" },
  { href: "/area-insegnante/eventi", label: "Eventi" },
  { href: "/area-insegnante/comunicazioni", label: "Comunicazioni" },
];

export default async function AreaInsegnanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAreaInsegnante();

  return (
    <AppShell title="Area insegnante" nav={NAV} profile={profile}>
      {children}
    </AppShell>
  );
}
