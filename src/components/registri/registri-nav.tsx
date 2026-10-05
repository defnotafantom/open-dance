"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const VOCI = [
  { href: "/admin/registri", label: "Panoramica" },
  { href: "/admin/registri/soci", label: "Soci" },
  { href: "/admin/registri/quote", label: "Quote" },
  { href: "/admin/registri/ricevute", label: "Ricevute" },
  { href: "/admin/registri/rendiconto", label: "Entrate e uscite" },
];

export function RegistriNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {VOCI.map((v) => {
        const attiva = v.href === "/admin/registri" ? pathname === v.href : pathname.startsWith(v.href);
        return (
          <Link
            key={v.href}
            href={v.href}
            className={cn(
              "panel-3d tile-press shrink-0 rounded-full px-4 py-2 font-display text-sm tracking-[0.06em] uppercase [--tile-d:3px]",
              attiva && "tile-red"
            )}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
