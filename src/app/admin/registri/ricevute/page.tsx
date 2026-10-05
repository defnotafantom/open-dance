import { createClient } from "@/lib/supabase/server";
import { RicevuteList } from "./ricevute-list";

export default async function RicevutePage({
  searchParams,
}: {
  searchParams: Promise<{ anno?: string }>;
}) {
  const { anno: annoParam } = await searchParams;
  const anno = Number(annoParam) || new Date().getFullYear();

  const supabase = await createClient();
  const { data: ricevute, error } = await supabase
    .from("versamenti")
    .select("id, anno, numero, importo, data, metodo, pagatore_nome, causale, annullato, motivo_annullamento")
    .eq("anno", anno)
    .order("numero", { ascending: false });

  if (error) throw new Error(`Ricevute non caricate: ${error.message}`);

  return <RicevuteList anno={anno} ricevute={ricevute ?? []} />;
}
