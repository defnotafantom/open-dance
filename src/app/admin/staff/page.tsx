import { getProfile, RUOLI_TITOLARI } from "@/lib/auth/dal";
import { InvitaStaffForm } from "./invita-staff-form";

export default async function StaffPage() {
  const profile = await getProfile();
  const isTitolare = RUOLI_TITOLARI.includes(profile.ruolo);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      {isTitolare ? (
        <>
          <p className="text-muted-foreground max-w-md">
            Invita un membro dello staff o un insegnante: ricevera&apos; via
            email un link per impostare la password e attivare l&apos;account.
          </p>
          <InvitaStaffForm />
        </>
      ) : (
        <p className="text-muted-foreground">
          Solo una titolare (proprietaria, co-proprietaria o webmaster) puo&apos;
          invitare nuovo personale.
        </p>
      )}
    </div>
  );
}
