import "server-only";

/**
 * Invio email best-effort via l'API REST di Resend (nessun SDK necessario).
 * Se RESEND_API_KEY non e' configurata, non fa nulla: le email sono un
 * canale in piu', non devono bloccare il resto (push, promemoria, ecc.).
 */
export async function inviaEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ inviata: boolean; errore?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { inviata: false, errore: "RESEND_API_KEY non configurata." };
  }

  const mittente = process.env.RESEND_FROM_EMAIL ?? "Open Dance <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: mittente, to, subject, html }),
    });

    if (!res.ok) {
      return { inviata: false, errore: await res.text() };
    }
    return { inviata: true };
  } catch (err) {
    return { inviata: false, errore: err instanceof Error ? err.message : "Errore sconosciuto." };
  }
}
