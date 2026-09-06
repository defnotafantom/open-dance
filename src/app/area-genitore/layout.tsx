import { requireRuolo } from "@/lib/auth/dal";
import { AppShell, type NavItem } from "@/components/layout/app-shell";
import { AppBadge } from "@/components/app-badge";
import { contaComunicazioniNonLette } from "@/lib/comunicazioni/actions";

const NAV: NavItem[] = [
  { href: "/area-genitore", label: "Panoramica" },
  { href: "/area-genitore/figli", label: "Iscritti" },
  { href: "/area-genitore/orario", label: "Orario" },
  { href: "/area-genitore/pagamenti", label: "Pagamenti" },
  { href: "/area-genitore/presenze", label: "Presenze" },
  { href: "/area-genitore/documenti", label: "Documenti" },
  { href: "/area-genitore/eventi", label: "Eventi" },
  { href: "/area-genitore/comunicazioni", label: "Comunicazioni" },
  { href: "/area-genitore/privacy", label: "Privacy" },
];

export default async function AreaGenitoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRuolo(["allievo"]);
  const nonLette = await contaComunicazioniNonLette();

  return (
    <AppShell title="Area famiglia" nav={NAV} profile={profile}>
      <AppBadge count={nonLette} />
      {children}
    </AppShell>
  );
}
