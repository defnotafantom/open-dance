"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { NavItem } from "./app-shell";

export function SidebarNav({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
      {nav.map((item) => {
        const attivo = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={attivo ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              attivo &&
                "bg-sidebar-accent text-sidebar-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary md:before:inset-y-1.5"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
