import { redirect } from "next/navigation";

export default async function SocioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/iscritti/${id}`);
}
