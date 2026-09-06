import { getProfile } from "@/lib/auth/dal";
import { InvitaStaffForm } from "./invita-staff-form";

export default async function StaffPage() {
  const profile = await getProfile();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Staff</h1>
      {profile.ruolo === "admin" ? (
        <>
          <p className="text-muted-foreground max-w-md">
            Invita un membro dello staff o un insegnante: ricevera&apos; via
            email un link per impostare la password e attivare l&apos;account.
          </p>
          <InvitaStaffForm />
        </>
      ) : (
        <p className="text-muted-foreground">
          Solo un amministratore puo&apos; invitare nuovo staff.
        </p>
      )}
    </div>
  );
}
