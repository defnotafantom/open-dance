import { useId } from "react";
import { OD_PATH, OD_VIEWBOX } from "@/components/brand/od-path";

/** Livelli dello spessore: dal fondo (scuro) verso la faccia (chiaro). */
const ESTRUSIONE = ["#58050b", "#6a060d", "#7c0810", "#8e0912", "#a00a14", "#b80c17"];

/**
 * Il monogramma OD. Con `estruso` diventa il "tassello" in plastica rossa
 * del sistema grafico: stessa profondita' verso il basso e stessa luce di
 * pulsanti e riquadri.
 */
export function OdGlyphMark({
  className,
  estruso = false,
}: {
  className?: string;
  estruso?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const profondita = estruso ? 14 : 0;

  return (
    <svg
      viewBox={`0 0 ${OD_VIEWBOX.w} ${OD_VIEWBOX.h + profondita}`}
      className={className}
      role="img"
      aria-label="Open Dance"
    >
      <defs>
        <linearGradient id={`od-face-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff2d3a" />
          <stop offset="0.6" stopColor="#e3121f" />
          <stop offset="1" stopColor="#b80c17" />
        </linearGradient>
        <path id={`od-${id}`} fillRule="evenodd" d={OD_PATH} />
      </defs>
      {estruso &&
        ESTRUSIONE.map((colore, i) => (
          <use
            key={colore}
            href={`#od-${id}`}
            fill={colore}
            y={profondita - (i * profondita) / ESTRUSIONE.length}
          />
        ))}
      <use href={`#od-${id}`} fill={`url(#od-face-${id})`} />
    </svg>
  );
}
