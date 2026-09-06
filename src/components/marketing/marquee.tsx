export function Marquee({ text }: { text: string }) {
  const items = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="dark relative flex overflow-hidden border-y border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-8 font-display text-xl tracking-wide uppercase">
            {text}
            <span className="text-primary">&bull;</span>
          </span>
        ))}
      </div>
      <div aria-hidden className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
        {items.map((i) => (
          <span key={i} className="flex items-center gap-8 font-display text-xl tracking-wide uppercase">
            {text}
            <span className="text-primary">&bull;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
