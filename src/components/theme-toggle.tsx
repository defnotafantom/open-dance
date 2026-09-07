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
        "flex items-center gap-0.5 rounded-full bg-foreground/6 p-0.5 ring-1 ring-foreground/8",
        className
      )}
    >
      <button
        type="button"
        aria-label="Tema chiaro"
        onClick={() => setTheme("light")}
        className={cn(
          "flex size-6 items-center justify-center rounded-full transition-colors",
          !scuro && "bg-card shadow-sm"
        )}
      >
        <SunIcon className={cn("size-3.5", !scuro ? "text-foreground" : "text-muted-foreground/60")} />
      </button>
      <button
        type="button"
        aria-label="Tema scuro"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex size-6 items-center justify-center rounded-full transition-colors",
          scuro && "bg-primary shadow-sm"
        )}
      >
        <MoonIcon className={cn("size-3.5", scuro ? "text-primary-foreground" : "text-muted-foreground/60")} />
      </button>
    </div>
  );
}
