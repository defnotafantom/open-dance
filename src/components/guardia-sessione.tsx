"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Se la pagina resta in background oltre il limite, al ritorno porta fuori
 * da tutti gli involucri (al codice), senza aspettare la navigazione dopo.
 */
export function GuardiaSessione({ minuti }: { minuti: number }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/manutenzione")) return;
    let nascostaDa: number | null = null;
    function cambio() {
      if (document.visibilityState === "hidden") {
        nascostaDa = Date.now();
      } else if (nascostaDa && Date.now() - nascostaDa > minuti * 60 * 1000) {
        window.location.replace("/manutenzione/esci");
      } else {
        nascostaDa = null;
      }
    }
    document.addEventListener("visibilitychange", cambio);
    return () => document.removeEventListener("visibilitychange", cambio);
  }, [pathname, minuti]);

  return null;
}
