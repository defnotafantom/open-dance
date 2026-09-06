import { EventiFeed } from "@/components/eventi/eventi-feed";

export default function EventiInsegnantePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase tracking-tight">Eventi</h1>
      <EventiFeed />
    </div>
  );
}
