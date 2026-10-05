import { RegistriNav } from "@/components/registri/registri-nav";

export default function RegistriLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Registri</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Quote, istanze, ricevute e rendiconto dell&apos;associazione. Visibili solo allo staff.
        </p>
      </div>
      <RegistriNav />
      {children}
    </div>
  );
}
