import { redirect } from "next/navigation";
import Link from "next/link";
import { getOptionalProfile, areaPerRuolo } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const profile = await getOptionalProfile();

  if (profile) {
    redirect(areaPerRuolo(profile.ruolo));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">Open Dance</h1>
      <p className="text-muted-foreground max-w-md">
        Corsi, orari, iscrizioni, pagamenti e comunicazioni della scuola di
        danza, tutto in un unico posto.
      </p>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/login">Accedi</Link>} />
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/registrati">Registrati</Link>}
        />
      </div>
    </main>
  );
}
