import { redirect } from "next/navigation";
import { getOptionalProfile, areaPerRuolo } from "@/lib/auth/dal";
import { HomeClient } from "./home-client";

export default async function Home() {
  const profile = await getOptionalProfile();

  if (profile) {
    redirect(areaPerRuolo(profile.ruolo));
  }

  return <HomeClient />;
}
