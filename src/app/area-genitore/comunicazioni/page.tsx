import { AnnouncementFeed } from "@/components/comunicazioni/announcement-feed";

export default function ComunicazioniGenitorePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Comunicazioni</h1>
      <AnnouncementFeed />
    </div>
  );
}
