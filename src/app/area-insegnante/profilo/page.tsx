import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { ProfiloInsegnanteForm } from "./profilo-form";

export default async function ProfiloInsegnantePage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: profiloPubblico } = await supabase
    .from("insegnanti_profili")
    .select("bio, carriera, specializzazioni, anni_esperienza, foto_path, pubblicato")
    .eq("profilo_id", profile.id)
    .maybeSingle();

  const fotoUrl = profiloPubblico?.foto_path
    ? supabase.storage.from("insegnanti").getPublicUrl(profiloPubblico.foto_path).data.publicUrl
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight">Il mio profilo</h1>
        <p className="text-muted-foreground max-w-lg text-sm">
          Questo è ciò che i visitatori del sito vedono nella pagina pubblica
          &quot;Gli insegnanti&quot;. Resta nascosto finché non lo pubblichi.
        </p>
      </div>
      <ProfiloInsegnanteForm
        profiloId={profile.id}
        fotoUrl={fotoUrl}
        profilo={{
          bio: profiloPubblico?.bio ?? "",
          carriera: profiloPubblico?.carriera ?? "",
          specializzazioni: profiloPubblico?.specializzazioni ?? "",
          anni_esperienza: profiloPubblico?.anni_esperienza ?? null,
          pubblicato: profiloPubblico?.pubblicato ?? false,
        }}
      />
    </div>
  );
}
