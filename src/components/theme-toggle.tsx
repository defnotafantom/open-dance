"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { cn } from "cn";

function subscribeNoop() {
  return () => {};
}
function isClient() {
  return true;
}
function isServer() {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montato = useSyncExternalStore(subscribeNoop, isClient, isServer);

  const scuro = montato && resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "panel-3d flex items-center gap-1 rounded-full p-1 [--tile-d:4px]",
        className
      )}
    >
      <button
        type="button"
        aria-label="Tema chiaro"
        onClick={() => setTheme("light")}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors",
          !scuro && "bg-foreground/8"
        )}
      >
        <SunIcon className={cn("size-3.5", !scuro ? "text-foreground" : "text-muted-foreground/60")} />
      </button>
      <button
        type="button"
        aria-label="Tema scuro"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-colors",
          scuro && "bg-primary"
        )}
      >
        <MoonIcon className={cn("size-3.5", scuro ? "text-primary-foreground" : "text-muted-foreground/60")} />
      </button>
    </div>
  );
}
