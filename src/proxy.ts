import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  COOKIE_ACCESSO,
  COOKIE_ATTIVITA,
  MINUTI_INATTIVITA,
  manutenzioneAttiva,
  opzioniCookieSessione,
  percorsoLibero,
  percorsoLogin,
} from "@/lib/manutenzione";
import type { Database } from "@/lib/supabase/database.types";

const AREE_PROTETTE = ["/admin", "/area-insegnante", "/area-genitore", "/stampa"];
const SOLO_OSPITI = ["/login"];

// Deve restare in sync con il bypass temporaneo in src/lib/auth/dal.ts:
// quando attivo, lascia passare tutte le richieste senza controllare la
// sessione Supabase (che qui non esiste comunque).
const BYPASS_SVILUPPO_ATTIVO =
  process.env.NODE_ENV !== "production" && !!process.env.NEXT_PUBLIC_DEV_BYPASS_ROLE;

export async function proxy(request: NextRequest) {
  if (BYPASS_SVILUPPO_ATTIVO) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Controllo ottimistico: solo "sessione presente o no". Lo scoping preciso
  // per ruolo viene riverificato server-side in ogni layout tramite la DAL.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  const path = request.nextUrl.pathname;

  // Involucro esterno: si passa solo con una richiesta approvata dal
  // webmaster, valida per la sessione del browser e scaduta dopo
  // MINUTI_INATTIVITA senza richieste. Vale anche per chi ha fatto il login.
  if (manutenzioneAttiva() && !percorsoLibero(path)) {
    const token = request.cookies.get(COOKIE_ACCESSO)?.value;
    const { data: stato } = token
      ? await supabase.rpc("accesso_sito_stato", { p_token: token })
      : { data: null };
    const ultimaAttivita = Number(request.cookies.get(COOKIE_ATTIVITA)?.value);
    const inattivo =
      !ultimaAttivita || Date.now() - ultimaAttivita > MINUTI_INATTIVITA * 60 * 1000;

    if (stato === "approvato" && !inattivo) {
      response.cookies.set(COOKIE_ATTIVITA, String(Date.now()), opzioniCookieSessione);
    } else {
      // Finche' il webmaster non ha attivato le notifiche, il login resta
      // raggiungibile e chi ha una sessione entra: e' l'unico modo per
      // attivarle senza restare chiusi fuori.
      const emergenza =
        (isAuthenticated || percorsoLogin(path)) &&
        !(await supabase.rpc("webmaster_ha_notifiche")).data;

      if (!emergenza) {
        // Fuori da tutti gli involucri: si chiude anche il login.
        if (isAuthenticated) await supabase.auth.signOut({ scope: "local" });
        const url = request.nextUrl.clone();
        url.pathname = "/manutenzione";
        url.search = "";
        const risposta = NextResponse.redirect(url);
        for (const c of response.cookies.getAll()) risposta.cookies.set(c);
        if (stato !== "in_attesa") risposta.cookies.delete(COOKIE_ACCESSO);
        risposta.cookies.delete(COOKIE_ATTIVITA);
        risposta.headers.set("X-Robots-Tag", "noindex, nofollow");
        return risposta;
      }
    }
  }

  const isAreaProtetta = AREE_PROTETTE.some((p) => path.startsWith(p));
  const isSoloOspiti = SOLO_OSPITI.some((p) => path.startsWith(p));

  if (isAreaProtetta && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (isSoloOspiti && isAuthenticated) {
    const url = request.nextUrl.clone();
    // /app smista verso l'area giusta per ruolo.
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js).*)"],
};
