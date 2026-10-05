import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REGISTRAZIONI_APERTE } from "@/lib/registrazioni";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { RegistratiForm } from "./registrati-form";

export default async function RegistratiPage() {
  if (REGISTRAZIONI_APERTE) {
    return <RegistratiForm />;
  }

  const supabase = await createClient();
  const { data: scuola } = await supabase
    .from("impostazioni_scuola")
    .select("telefono, email_contatto, indirizzo")
    .maybeSingle();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iscrizioni in segreteria</CardTitle>
        <CardDescription>
          Per ora le iscrizioni si fanno direttamente con la scuola: sarà la segreteria a crearti
          l&apos;accesso al sito.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-sm">
          {scuola?.telefono && (
            <a href={`tel:${scuola.telefono}`} className="flex items-center gap-2 hover:text-primary">
              <PhoneIcon className="size-4" /> {scuola.telefono}
            </a>
          )}
          {scuola?.email_contatto && (
            <a
              href={`mailto:${scuola.email_contatto}`}
              className="flex items-center gap-2 hover:text-primary"
            >
              <MailIcon className="size-4" /> {scuola.email_contatto}
            </a>
          )}
          {scuola?.indirizzo && (
            <p className="flex items-center gap-2">
              <MapPinIcon className="size-4" /> {scuola.indirizzo}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button nativeButton={false} render={<Link href="/corsi">Scopri i corsi</Link>} />
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/login">Hai già un account? Accedi</Link>}
          />
        </div>
      </CardContent>
    </Card>
  );
}
