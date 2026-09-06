import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const AREE_PROTETTE = ["/admin", "/area-insegnante", "/area-genitore"];
const SOLO_OSPITI = ["/login", "/registrati"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
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
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js).*)"],
};
