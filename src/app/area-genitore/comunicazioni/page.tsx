import { AnnouncementFeed } from "@/components/comunicazioni/announcement-feed";

export default function ComunicazioniGenitorePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Comunicazioni</h1>
      <AnnouncementFeed />
    </div>
  );
}
