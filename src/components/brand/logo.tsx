import { cn } from "cn";
import { OdGlyphMark } from "@/components/brand/od-glyph-mark";

/** Monogramma OD + scritta "OPEN DANCE" spaziata, come nel logo originale. */
export function Logo({
  size = 32,
  wordmark = true,
  className,
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="block shrink-0" style={{ width: size * 1.5 }}>
        <OdGlyphMark className="block w-full" estruso={size >= 28} />
      </span>
      {wordmark && (
        <span
          className="font-wordmark tracking-[0.45em] uppercase"
          style={{ fontSize: Math.max(11, size * 0.42) }}
        >
          Open Dance
        </span>
      )}
    </span>
  );
}
