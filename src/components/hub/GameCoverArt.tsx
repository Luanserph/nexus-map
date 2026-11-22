import { useState } from 'react';
import type { BackgroundPattern, GameTheme } from '../../types/schema';

export interface GameCoverArtProps {
  title: string;
  imageUrl?: string;
  theme: GameTheme;
  layersCount?: number;
  releaseYear?: number;
  heightClassName?: string;
  showMetadataWatermark?: boolean;
}

export function GameCoverArt({
  title,
  imageUrl,
  theme,
  layersCount,
  releaseYear,
  heightClassName = 'h-44',
  showMetadataWatermark = true,
}: GameCoverArtProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const shouldRenderImage = Boolean(imageUrl && failedImageUrl !== imageUrl);

  return (
    <div
      className={`relative w-full overflow-hidden border-b border-white/[0.08] ${heightClassName}`}
      style={{ backgroundColor: theme.surfaceBase }}
    >
      {shouldRenderImage ? (
        <img
          src={imageUrl}
          alt={`Arte de ${title}`}
          onError={() => setFailedImageUrl(imageUrl ?? null)}
          className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover/card:scale-105"
        />
      ) : (
        <ProceduralCartographicArt pattern={theme.backgroundPattern} />
      )}

      {/* Controlled ambient horizon light driven strictly by scoped CSS variables */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-65 transition-opacity duration-300 group-hover/card:opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 78% 15%, color-mix(in srgb, var(--accent-primary) 22%, transparent), transparent 72%), radial-gradient(ellipse 55% 45% at 15% 92%, color-mix(in srgb, var(--accent-secondary) 14%, transparent), transparent 70%)',
        }}
      />

      {/* Deep obsidian bottom gradient overlay for legibility over real or procedural art */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,9,13,0.18) 0%, rgba(7,9,13,0.46) 55%, rgba(7,9,13,0.92) 100%)',
        }}
      />

      {showMetadataWatermark &&
        layersCount !== undefined &&
        releaseYear !== undefined && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-3 bottom-2.5 flex items-center gap-2 font-mono text-[10px] tracking-wider text-white/50"
          >
            <span>
              {layersCount} {layersCount === 1 ? 'MAPA' : 'MAPAS'}
            </span>
            <span className="text-white/25">/</span>
            <span>{releaseYear}</span>
          </div>
        )}
    </div>
  );
}

export function ProceduralCartographicArt({
  pattern,
  className = '',
}: {
  pattern: BackgroundPattern;
  className?: string;
}) {
  if (pattern === 'topographic-rings') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 480 220"
        preserveAspectRatio="xMidYMid slice"
        className={`h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.04] ${className}`}
      >
        <defs>
          <pattern id="er-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="rgba(255,255,255,0.035)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="480" height="220" fill="url(#er-grid)" />
        <g fill="none" stroke="var(--accent-primary)" strokeOpacity="0.28">
          <circle cx="330" cy="78" r="34" strokeWidth="1.2" />
          <circle cx="330" cy="78" r="64" strokeWidth="0.9" strokeDasharray="6 5" />
          <circle cx="330" cy="78" r="98" strokeWidth="0.7" strokeOpacity="0.18" />
          <circle cx="330" cy="78" r="138" strokeWidth="0.6" strokeOpacity="0.11" />
        </g>
        <g fill="none" stroke="var(--accent-secondary)" strokeOpacity="0.18" strokeWidth="1">
          <path d="M -20 155 C 65 120, 140 170, 230 130 C 310 95, 390 140, 500 105" />
          <path d="M -20 180 C 80 145, 165 190, 260 152 C 345 120, 415 162, 500 132" />
        </g>
        <g fill="var(--accent-primary)">
          <circle cx="330" cy="78" r="3" />
          <circle cx="152" cy="138" r="2" opacity="0.75" />
          <circle cx="248" cy="112" r="2" opacity="0.6" />
        </g>
      </svg>
    );
  }

  if (pattern === 'cyber-grid') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 480 220"
        preserveAspectRatio="xMidYMid slice"
        className={`h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.04] ${className}`}
      >
        <defs>
          <pattern id="cp-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="480" height="220" fill="url(#cp-grid)" />
        <g fill="none" stroke="var(--accent-primary)" strokeOpacity="0.30" strokeWidth="1">
          <path d="M 30 190 L 120 130 L 240 130 L 310 75 L 440 75" />
          <path d="M 85 210 L 175 150 L 305 150 L 385 95" strokeOpacity="0.18" />
          <polygon
            points="270,40 360,40 380,62 380,115 290,115 270,93"
            fill="var(--accent-primary)"
            fillOpacity="0.05"
          />
        </g>
        <g fill="none" stroke="var(--accent-secondary)" strokeOpacity="0.35" strokeWidth="1">
          <path d="M 240 130 L 240 42 L 310 42" strokeDasharray="4 4" />
          <rect x="312" y="64" width="38" height="22" />
        </g>
        <g fill="var(--accent-primary)">
          <rect x="118" y="128" width="5" height="5" />
          <rect x="238" y="128" width="5" height="5" />
          <rect x="308" y="73" width="5" height="5" />
        </g>
        <circle cx="331" cy="75" r="2.5" fill="var(--accent-secondary)" />
      </svg>
    );
  }

  if (pattern === 'abyssal-contours') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 480 220"
        preserveAspectRatio="xMidYMid slice"
        className={`h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.04] ${className}`}
      >
        <g fill="none" stroke="var(--accent-primary)" strokeOpacity="0.24" strokeWidth="1">
          <path d="M -10 58 Q 110 18, 225 66 T 490 52" />
          <path d="M -10 96 Q 130 56, 255 104 T 490 88" strokeOpacity="0.18" />
          <path d="M -10 136 Q 145 104, 270 144 T 490 128" strokeOpacity="0.14" />
          <path
            d="M 190 20 C 175 85, 220 130, 195 210"
            strokeDasharray="3 5"
            strokeOpacity="0.22"
          />
          <path
            d="M 325 15 C 345 75, 305 135, 338 210"
            strokeDasharray="3 5"
            strokeOpacity="0.22"
          />
        </g>
        <g fill="none" stroke="var(--accent-secondary)" strokeOpacity="0.32" strokeWidth="1">
          <circle cx="195" cy="96" r="14" />
          <circle cx="328" cy="84" r="20" />
          <line x1="209" y1="94" x2="308" y2="86" />
        </g>
        <g fill="var(--accent-primary)">
          <circle cx="195" cy="96" r="2.5" />
          <circle cx="328" cy="84" r="3" />
          <circle cx="110" cy="64" r="1.8" opacity="0.7" />
          <circle cx="395" cy="126" r="1.8" opacity="0.65" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 220"
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full transition-transform duration-700 ease-out group-hover/card:scale-[1.04] ${className}`}
    >
      <defs>
        <pattern id="tac-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path
            d="M 28 0 L 0 0 0 28"
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="480" height="220" fill="url(#tac-grid)" />
      <g fill="none" stroke="var(--accent-primary)" strokeOpacity="0.24" strokeWidth="1">
        <line x1="0" y1="110" x2="480" y2="110" strokeDasharray="4 6" />
        <line x1="240" y1="0" x2="240" y2="220" strokeDasharray="4 6" />
        <circle cx="240" cy="110" r="46" />
      </g>
    </svg>
  );
}
