import { redirect } from "next/navigation";

// I pagamenti ora si gestiscono nei Registri (quote, istanze, ricevute).
export default function PagamentiPage() {
  redirect("/admin/registri/quote");
}
