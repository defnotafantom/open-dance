import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementCard } from "./announcement-card";

export async function AnnouncementFeed() {
  const profile = await getProfile();
  const supabase = await createClient();

  const { data: comunicazioni, error } = await supabase
    .from("comunicazioni")
    .select("id, titolo, corpo, pubblicato_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-destructive text-sm">
        Impossibile caricare le comunicazioni: {error.message}
      </p>
    );
  }

  if (!comunicazioni || comunicazioni.length === 0) {
    return <p className="text-muted-foreground text-sm">Nessuna comunicazione al momento.</p>;
  }

  const { data: letture } = await supabase
    .from("letture_comunicazioni")
    .select("comunicazione_id")
    .eq("profilo_id", profile.id);
  const letteIds = new Set((letture ?? []).map((l) => l.comunicazione_id));

  return (
    <ul className="flex flex-col gap-3">
      {comunicazioni.map((c) => (
        <AnnouncementCard key={c.id} comunicazione={c} letta={letteIds.has(c.id)} />
      ))}
    </ul>
  );
}
