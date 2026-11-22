import {
  Check,
  CheckCircle2,
  CheckSquare,
  Copy,
  ExternalLink,
  MapPin,
  Maximize2,
  Shield,
  Square,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BadgeStyle, Category, MapMarker } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';

export interface MarkerDetailCardProps {
  marker: MapMarker;
  category?: Category;
  isFound: boolean;
  checkedChecklistKeys: Set<string>;
  badgeStyle?: BadgeStyle;
  onToggleFound: () => void;
  onToggleChecklistItem: (itemId: string) => void;
  onClose: () => void;
}

export function MarkerDetailCard({
  marker,
  category,
  isFound,
  checkedChecklistKeys,
  badgeStyle = 'minimal',
  onToggleFound,
  onToggleChecklistItem,
  onClose,
}: MarkerDetailCardProps) {
  const [copied, setCopied] = useState(false);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const coordsLabel = `[${marker.coords[0].toFixed(1)}, ${marker.coords[1].toFixed(1)}]`;
  const hasValidImage = Boolean(
    marker.imageUrl && failedImageUrl !== marker.imageUrl
  );

  useEffect(() => {
    if (!isLightboxOpen) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsLightboxOpen(false);
      }
    }
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isLightboxOpen]);

  async function handleCopyCoords() {
    try {
      await navigator.clipboard.writeText(coordsLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore if clipboard API unavailable
    }
  }

  const checklist = marker.checklist ?? [];
  const checkedCount = checklist.filter((item) =>
    checkedChecklistKeys.has(`${marker.id}:${item.id}`)
  ).length;

  const metadataEntries = marker.metadata
    ? Object.entries(marker.metadata).slice(0, 4)
    : [];

  return (
    <>
      <GlassPanel
        variant="elevated"
        padding="none"
        cornerMarks
        accentActive={!isFound}
        className="max-h-[calc(100svh-7.5rem)] w-[320px] overflow-y-auto sm:w-[360px]"
      >
        {/* Optional Location Photo (16:9, lazy-loading, click to open Lightbox) */}
        {hasValidImage && marker.imageUrl && (
          <div className="group/photo relative aspect-video w-full overflow-hidden border-b border-white/[0.08] bg-black/50">
            <img
              src={marker.imageUrl}
              alt={marker.title}
              loading="lazy"
              onError={() => setFailedImageUrl(marker.imageUrl ?? null)}
              onClick={() => setIsLightboxOpen(true)}
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover/photo:scale-105"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(7,9,13,0.82)] via-transparent to-black/25"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="Ampliar imagem"
              className="absolute right-2.5 bottom-2.5 inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-black/65 px-2 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md transition-colors hover:border-[var(--accent-primary)] hover:text-white"
            >
              <Maximize2 className="h-3 w-3" />
              Ampliar
            </button>
          </div>
        )}

        <div className="p-4">
          {/* Header: Category + Level Badge + Region + Close */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <GlassBadge
                variant={isFound ? 'success' : 'accent'}
                badgeStyle={badgeStyle}
                dot
              >
                {category?.name ?? marker.category}
              </GlassBadge>

              {marker.level !== undefined && (
                <GlassBadge
                  variant="neutral"
                  size="sm"
                  icon={<Shield className="h-3 w-3 text-amber-400" />}
                >
                  Nv. {marker.level}
                </GlassBadge>
              )}

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

          {/* Tags */}
          {marker.tags && marker.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {marker.tags.map((tag) => (
                <GlassBadge key={tag} variant="muted" size="sm">
                  #{tag}
                </GlassBadge>
              ))}
            </div>
          )}

          {/* Mini-Checklist persisted in IndexedDB */}
          {checklist.length > 0 && (
            <div className="mt-3.5 rounded-lg border border-white/[0.08] bg-black/35 p-2.5">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <span>Checklist do Local</span>
                <span className="text-[var(--accent-primary)]">
                  {checkedCount}/{checklist.length}
                </span>
              </div>
              <div className="space-y-1">
                {checklist.map((item) => {
                  const isChecked = checkedChecklistKeys.has(
                    `${marker.id}:${item.id}`
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggleChecklistItem(item.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-left text-xs transition-colors hover:bg-white/[0.06]"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)]" />
                      ) : (
                        <Square className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                      )}
                      <span
                        className={
                          isChecked
                            ? 'text-[var(--text-muted)] line-through'
                            : 'text-[var(--text-primary)]'
                        }
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Primary Actions: Mark Found + Wiki Link */}
          <div className="mt-3.5 flex flex-col gap-2">
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

            {marker.wikiUrl && (
              <a
                href={marker.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neon-focus-ring inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[color-mix(in_srgb,var(--accent-primary)_50%,transparent)] hover:text-[var(--text-primary)]"
              >
                <span>Ver na Wiki</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Lightbox Modal for Location Photo */}
      {isLightboxOpen && marker.imageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem ampliada de ${marker.title}`}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90svh] max-w-4xl overflow-hidden rounded-xl border border-white/15 bg-[#07090d] shadow-2xl"
          >
            <img
              src={marker.imageUrl}
              alt={marker.title}
              className="max-h-[82svh] w-auto object-contain"
            />
            <div className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-2.5 text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                {marker.title}
              </span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Fechar (ESC)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
