import { Check, CheckCircle2, Copy, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import type { BadgeStyle, Category, MapMarker } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';

export interface MarkerDetailCardProps {
  marker: MapMarker;
  category?: Category;
  isFound: boolean;
  badgeStyle?: BadgeStyle;
  onToggleFound: () => void;
  onClose: () => void;
}

export function MarkerDetailCard({
  marker,
  category,
  isFound,
  badgeStyle = 'minimal',
  onToggleFound,
  onClose,
}: MarkerDetailCardProps) {
  const [copied, setCopied] = useState(false);
  const coordsLabel = `[${marker.coords[0].toFixed(1)}, ${marker.coords[1].toFixed(1)}]`;

  async function handleCopyCoords() {
    try {
      await navigator.clipboard.writeText(coordsLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard permission denied
    }
  }

  const metadataEntries = marker.metadata
    ? Object.entries(marker.metadata).slice(0, 4)
    : [];

  return (
    <GlassPanel
      variant="elevated"
      padding="md"
      cornerMarks
      accentActive={!isFound}
      className="w-[310px] sm:w-[340px]"
    >
      {/* Header: Category + Region + Close */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <GlassBadge
            variant={isFound ? 'success' : 'accent'}
            badgeStyle={badgeStyle}
            dot
          >
            {category?.name ?? marker.category}
          </GlassBadge>
          {marker.region && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {marker.region}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes do pin"
          className="neon-focus-ring flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[var(--text-muted)] transition-colors hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title & Description */}
      <div className="mt-3">
        <h3
          className="text-base font-semibold leading-snug text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--nexus-font-display)' }}
        >
          {marker.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          {marker.description}
        </p>
      </div>

      {/* Metadata Chips */}
      {metadataEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {metadataEntries.map(([key, value]) => {
            const formatted = Array.isArray(value)
              ? value.join(', ')
              : typeof value === 'boolean'
                ? value
                  ? 'Sim'
                  : 'Não'
                : String(value);

            return (
              <span
                key={key}
                className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]"
              >
                <strong className="font-medium text-[var(--text-primary)]">
                  {key}:
                </strong>{' '}
                {formatted}
              </span>
            );
          })}
        </div>
      )}

      {/* Coordinates Bar */}
      <div className="mt-3.5 flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/35 px-2.5 py-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
          <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
          <span>{coordsLabel}</span>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyCoords()}
          className="neon-focus-ring inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-300">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Action: Mark as Found */}
      <div className="mt-3.5">
        <NeonButton
          variant={isFound ? 'glass' : 'primary'}
          active={isFound}
          size="md"
          onClick={onToggleFound}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          className="w-full"
        >
          {isFound ? 'Encontrado (Desmarcar)' : 'Marcar como Encontrado'}
        </NeonButton>
      </div>
    </GlassPanel>
  );
}
