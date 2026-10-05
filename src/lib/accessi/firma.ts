import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Firma dei link "approva / nega" inviati nella notifica al webmaster: chi
 * non ha la notifica non puo' costruirli. Il segreto non lascia mai il server.
 */
function segreto() {
  const s = process.env.ACCESSI_SEGRETO || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Segreto per i link di accesso non configurato.");
  return s;
}

export function firmaRichiesta(id: string) {
  return createHmac("sha256", segreto()).update(`accesso:${id}`).digest("hex");
}

export function firmaValida(id: string, firma: string) {
  const attesa = Buffer.from(firmaRichiesta(id));
  const data = Buffer.from(firma);
  return attesa.length === data.length && timingSafeEqual(attesa, data);
}
