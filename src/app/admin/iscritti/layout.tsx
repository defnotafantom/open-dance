export default function IscrittiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl uppercase">Iscritti</h1>
      {children}
    </div>
  );
}
