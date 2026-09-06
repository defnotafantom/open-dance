import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NuovaPasswordForm } from "./nuova-password-form";

export default async function ConfermaResetPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/recupera-password");
  }

  return <NuovaPasswordForm />;
}
