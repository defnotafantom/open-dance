"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ACCESSO, impronta } from "@/lib/manutenzione";

export async function entra(_stato: { error?: string } | undefined, formData: FormData) {
  const inserito = String(formData.get("codice") ?? "").trim();
  const codice = process.env.MANUTENZIONE_CODICE;

  if (!codice || !inserito || (await impronta(inserito)) !== (await impronta(codice))) {
    // Rallenta i tentativi a raffica.
    await new Promise((r) => setTimeout(r, 1500));
    return { error: "Codice non valido." };
  }

  (await cookies()).set(COOKIE_ACCESSO, await impronta(codice), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}
