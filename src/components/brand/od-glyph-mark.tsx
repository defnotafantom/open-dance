export function OdGlyphMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 460 300" className={className} role="img" aria-label="Open Dance">
      <defs>
        <linearGradient id="od-glyph-fill" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#ff5a63" />
          <stop offset="42%" stopColor="#b21f2a" />
          <stop offset="100%" stopColor="#38080d" />
        </linearGradient>
        <radialGradient id="od-glyph-shade" cx="72%" cy="82%" r="65%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="od-glyph-sheen" x1="0%" y1="0%" x2="70%" y2="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="od-glyph-clip">
          <path
            fillRule="evenodd"
            d="M6,150 A116,142 0 1,0 238,150 A116,142 0 1,0 6,150 Z
               M65,150 A57,83 0 1,0 179,150 A57,83 0 1,0 65,150 Z"
          />
          <path
            d="M246,14 L298,72 L241,150 L298,228 L246,284
               C304,294 452,236 452,150
               C452,64 304,6 246,14 Z"
          />
        </clipPath>
      </defs>
      <g stroke="rgba(20,4,5,0.4)" strokeWidth="2.5" strokeLinejoin="round">
        <path
          fillRule="evenodd"
          fill="url(#od-glyph-fill)"
          d="M6,150 A116,142 0 1,0 238,150 A116,142 0 1,0 6,150 Z
             M65,150 A57,83 0 1,0 179,150 A57,83 0 1,0 65,150 Z"
        />
        <path
          fill="url(#od-glyph-fill)"
          d="M246,14 L298,72 L241,150 L298,228 L246,284
             C304,294 452,236 452,150
             C452,64 304,6 246,14 Z"
        />
      </g>
      <g clipPath="url(#od-glyph-clip)">
        <rect x="0" y="0" width="460" height="300" fill="url(#od-glyph-shade)" />
        <path
          fill="url(#od-glyph-sheen)"
          opacity="0.8"
          d="M6,150 A116,142 0 0,1 122,8 A116,142 0 0,1 200,50 A57,83 0 0,0 122,67 A57,83 0 0,0 75,110 Z"
        />
        <path fill="#ffffff" opacity="0.35" d="M246,14 L298,72 L262,96 L246,60 Z" />
      </g>
    </svg>
  );
}
