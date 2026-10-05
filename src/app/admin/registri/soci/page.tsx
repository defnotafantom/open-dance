import { redirect } from "next/navigation";

// Soci e Studenti sono ora un solo elenco: Iscritti.
export default function SociPage() {
  redirect("/admin/iscritti");
}
