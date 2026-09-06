import { requireRuolo } from "@/lib/auth/dal";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const NAV: NavItem[] = [
  { href: "/area-genitore", label: "Panoramica" },
  { href: "/area-genitore/figli", label: "I miei figli" },
  { href: "/area-genitore/orario", label: "Orario" },
  { href: "/area-genitore/pagamenti", label: "Pagamenti" },
  { href: "/area-genitore/comunicazioni", label: "Comunicazioni" },
];

export default async function AreaGenitoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRuolo(["genitore", "allievo_adulto"]);

  return (
    <AppShell title="Area famiglia" nav={NAV} profile={profile}>
      {children}
    </AppShell>
  );
}
