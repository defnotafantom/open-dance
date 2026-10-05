import { redirect } from "next/navigation";
import { getOptionalProfile, areaPerRuolo } from "@/lib/auth/dal";

/**
 * Punto di partenza dell'app installata sul telefono (start_url del
 * manifest): porta dritti alla propria area, o al login. La home "/" invece
 * resta la vetrina pubblica della scuola, visibile anche a chi e' iscritto.
 */
export default async function AppStart() {
  const profile = await getOptionalProfile();
  redirect(profile ? areaPerRuolo(profile.ruolo) : "/login");
}
