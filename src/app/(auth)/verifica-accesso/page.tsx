import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerificaForm } from "./verifica-form";

export default async function VerificaAccessoPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return <VerificaForm />;
}
