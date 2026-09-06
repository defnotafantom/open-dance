import { createClient } from "@/lib/supabase/server";
import { EventoFormDialog } from "./evento-form-dialog";
import { EventiList } from "./eventi-list";
import { Button } from "@/components/ui/button";

export default async function EventiPage() {
  const supabase = await createClient();
  const { data: eventi, error } = await supabase
    .from("eventi")
    .select("id, nome, data, luogo, descrizione")
    .order("data");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Eventi</h1>
        <EventoFormDialog trigger={<Button>Nuovo evento</Button>} />
      </div>
      {error ? (
        <p className="text-destructive text-sm">Impossibile caricare gli eventi: {error.message}</p>
      ) : (
        <EventiList
          eventi={(eventi ?? []).map((e) => ({
            ...e,
            luogo: e.luogo ?? "",
            descrizione: e.descrizione ?? "",
          }))}
        />
      )}
    </div>
  );
}
