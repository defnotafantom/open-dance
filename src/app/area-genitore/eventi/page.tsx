import { EventiFeed } from "@/components/eventi/eventi-feed";

export default function EventiGenitorePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Eventi</h1>
      <EventiFeed />
    </div>
  );
}
