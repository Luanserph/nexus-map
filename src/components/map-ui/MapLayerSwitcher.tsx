import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../core/i18n';
import type { GameDlc, GameMapLayer } from '../../types/schema';
import { GlassPanel, NeonButton } from '../glass';

export interface MapLayerSwitcherProps {
  maps: GameMapLayer[];
  activeLayerId?: string;
  dlcsById: Record<string, GameDlc>;
  onSelectLayer: (layerId: string) => void;
}

const SCROLL_STEP_PX = 220;

export function MapLayerSwitcher({
  maps,
  activeLayerId,
  dlcsById,
  onSelectLayer,
}: MapLayerSwitcherProps) {
  const { t } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && el.scrollLeft < maxScroll - 2);
  }, []);

  // Track overflow on mount, resize, and map list updates
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateScrollState())
        : null;
    resizeObserver?.observe(el);

    return () => {
      resizeObserver?.disconnect();
    };
  }, [maps, updateScrollState]);

  // Intercept normal vertical mouse wheel to scroll horizontally without Shift
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaY) >= Math.abs(event.deltaX) && event.deltaY !== 0) {
        event.preventDefault();
        event.stopPropagation();
        el.scrollLeft += event.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Auto-center the active map button when selected
  useEffect(() => {
    if (!activeLayerId) return;
    const activeButton = itemRefs.current[activeLayerId];
    if (!activeButton) return;

    const rafId = requestAnimationFrame(() => {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeLayerId, maps.length]);

  const scrollByDirection = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -SCROLL_STEP_PX : SCROLL_STEP_PX,
      behavior: 'smooth',
    });
  };

  if (maps.length <= 1) return null;

  return (
    <GlassPanel
      variant="elevated"
      padding="none"
      className="relative max-w-[min(100vw-1.25rem,560px)] overflow-hidden"
    >
      <div className="relative flex items-center">
        {/* Left fade gradient + scroll button */}
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-[#0a0f1a]/95 via-[#0a0f1a]/80 to-transparent pr-5 pl-1">
            <button
              type="button"
              onClick={() => scrollByDirection('left')}
              aria-label="Rolar mapas para a esquerda"
              className="neon-focus-ring pointer-events-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-[#0a0f1a]/90 text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--accent-primary)]/60 hover:text-[var(--accent-primary)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Scrollable multi-map tablist */}
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className="flex items-center gap-1.5 overflow-x-auto px-2.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Seletor de camadas do mapa"
        >
          <span className="hidden shrink-0 items-center gap-1.5 pr-1 pl-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] md:inline-flex">
            <Layers className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            {t('map.layer')}
          </span>
          {maps.map((mapLayer) => {
            const isActive = activeLayerId === mapLayer.id;
            const layerDlc = mapLayer.dlc ? dlcsById[mapLayer.dlc] : undefined;
            return (
              <NeonButton
                key={mapLayer.id}
                ref={(node) => {
                  itemRefs.current[mapLayer.id] = node;
                }}
                size="sm"
                variant="glass"
                active={isActive}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectLayer(mapLayer.id)}
                className="shrink-0 whitespace-nowrap"
              >
                <span>{mapLayer.name}</span>
                {mapLayer.isInterior && (
                  <span className="ml-1.5 rounded bg-white/10 px-1 py-0.5 font-mono text-[9px] uppercase text-[var(--text-secondary)]">
                    {t('map.interior')}
                  </span>
                )}
                {layerDlc && layerDlc.id !== 'base' && (
                  <span
                    className="ml-1.5 rounded px-1 py-0.5 font-mono text-[9px] font-semibold uppercase"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${layerDlc.accentColor ?? 'var(--accent-secondary)'} 20%, transparent)`,
                      color: layerDlc.accentColor ?? 'var(--accent-secondary)',
                    }}
                  >
                    {layerDlc.shortLabel ?? 'DLC'}
                  </span>
                )}
              </NeonButton>
            );
          })}
        </div>

        {/* Right fade gradient + scroll button */}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-[#0a0f1a]/95 via-[#0a0f1a]/80 to-transparent pr-1 pl-5">
            <button
              type="button"
              onClick={() => scrollByDirection('right')}
              aria-label="Rolar mapas para a direita"
              className="neon-focus-ring pointer-events-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-[#0a0f1a]/90 text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--accent-primary)]/60 hover:text-[var(--accent-primary)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
