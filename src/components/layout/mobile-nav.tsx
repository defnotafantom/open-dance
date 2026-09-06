"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { MenuIcon, XIcon } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PushToggle } from "@/components/push-toggle";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/brand/logo";
import type { NavItem } from "@/components/layout/app-shell";

export function MobileNav({
  nav,
  title,
  profile,
}: {
  nav: NavItem[];
  title: string;
  profile: { nome: string; cognome: string; email: string };
}) {
  const [open, setOpen] = useState(false);
  const iniziali = `${profile.nome[0] ?? ""}${profile.cognome[0] ?? ""}`.toUpperCase();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button variant="ghost" size="icon" aria-label="Apri il menu">
            <MenuIcon />
          </Button>
        }
      />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="dark fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setOpen(false)}>
              <Logo size={30} />
            </Link>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon" aria-label="Chiudi il menu">
                  <XIcon />
                </Button>
              }
            />
          </div>
          <p className="-mt-2 text-[0.7rem] font-medium tracking-wide text-sidebar-foreground/50 uppercase">
            {title}
          </p>

          <div className="flex-1 overflow-y-auto">
            <SidebarNav nav={nav} onNavigate={() => setOpen(false)} />
          </div>

          <div className="flex items-center gap-2 border-t border-sidebar-border pt-4">
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
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
