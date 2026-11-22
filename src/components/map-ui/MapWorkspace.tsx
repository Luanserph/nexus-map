import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useGameTheme } from '../../core/theme-engine';
import { getCompletionPercent, getTotalPinsCount } from '../../data/games';
import type { HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';
import { GameCoverArt, ProceduralCartographicArt } from '../hub/GameCoverArt';

export interface MapWorkspaceProps {
  entry: HubGameEntry;
  activeLayerId?: string;
  onSelectLayer: (layerId: string) => void;
  onBackToHub: () => void;
}

export function MapWorkspace({
  entry,
  activeLayerId,
  onSelectLayer,
  onBackToHub,
}: MapWorkspaceProps) {
  const { manifest, progress } = entry;
  const { activeTheme } = useGameTheme();

  const activeLayer = useMemo(() => {
    return (
      manifest.maps.find((m) => m.id === activeLayerId) ??
      manifest.maps.find((m) => m.id === progress.activeLayerId) ??
      manifest.maps[0]
    );
  }, [manifest.maps, activeLayerId, progress.activeLayerId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const group of manifest.categoryGroups) {
        for (const cat of group.categories) {
          initial[cat.id] = cat.defaultVisible;
        }
      }
      return initial;
    }
  );
  const [zoomByLayer, setZoomByLayer] = useState<Record<string, number>>({});
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const totalPins = getTotalPinsCount(manifest);
  const percent = getCompletionPercent(entry);
  const badgeStyle = activeTheme.badgeStyle ?? 'minimal';
  const currentLayerKey = activeLayer?.id ?? 'default';
  const zoomLevel = zoomByLayer[currentLayerKey] ?? activeLayer?.defaultZoom ?? 2;

  function updateZoom(nextValue: number) {
    setZoomByLayer((prev) => ({ ...prev, [currentLayerKey]: nextValue }));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSidebarOpen(true);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else if (event.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          if (pinSearchQuery) {
            setPinSearchQuery('');
          } else {
            searchInputRef.current?.blur();
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinSearchQuery]);

  function handleViewportMouseMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = 0.5 - (event.clientY - rect.top) / rect.height;

    const bounds = activeLayer?.bounds ?? [-4096, -4096, 4096, 4096];
    const spanX = bounds[2] - bounds[0];
    const spanY = bounds[3] - bounds[1];

    const worldX = Math.round(relX * spanX * 10) / 10;
    const worldY = Math.round(relY * spanY * 10) / 10;

    setCursorCoords({ x: worldX, y: worldY });
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function toggleCategory(categoryId: string) {
    setVisibleCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }

  function setAllCategories(visible: boolean) {
    const next: Record<string, boolean> = {};
    for (const group of manifest.categoryGroups) {
      for (const cat of group.categories) {
        next[cat.id] = visible;
      }
    }
    setVisibleCategories(next);
  }

  const minZoom = activeLayer?.minZoom ?? 0;
  const maxZoom = activeLayer?.maxZoom ?? 6;
  const visibleCount = Object.values(visibleCategories).filter(Boolean).length;
  const totalCategoryCount = manifest.categoryGroups.reduce(
    (sum, g) => sum + g.categories.length,
    0
  );

  const normalizedPinSearch = pinSearchQuery.trim().toLowerCase();
  const filteredCategoryGroups = useMemo(() => {
    if (!normalizedPinSearch) return manifest.categoryGroups;
    return manifest.categoryGroups
      .map((group) => ({
        ...group,
        categories: group.categories.filter(
          (cat) =>
            cat.name.toLowerCase().includes(normalizedPinSearch) ||
            group.label.toLowerCase().includes(normalizedPinSearch)
        ),
      }))
      .filter((group) => group.categories.length > 0);
  }, [manifest.categoryGroups, normalizedPinSearch]);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* ================================================================= */}
      {/* FULL-BLEED INTERACTIVE MAP VIEWPORT PLACEHOLDER (ETAPA 3 READY)   */}
      {/* ================================================================= */}
      <div
        onMouseMove={handleViewportMouseMove}
        className="relative h-full w-full cursor-crosshair overflow-hidden"
      >
        {/* Tactical Grid */}
        <div
          aria-hidden="true"
          className="nexus-tactical-grid pointer-events-none absolute inset-0 opacity-90"
        />

        {/* Procedural Game Background Pattern Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35"
        >
          <ProceduralCartographicArt pattern={activeTheme.backgroundPattern} />
        </div>

        {/* Ambient Radial Glow Driven by Active Game's --accent-primary */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 55% 48%, color-mix(in srgb, var(--accent-primary) 10%, transparent), transparent 72%), radial-gradient(ellipse 45% 40% at 85% 85%, color-mix(in srgb, var(--accent-secondary) 8%, transparent), transparent 70%)',
          }}
        />

        {/* Micro-Noise Overlay */}
        <div
          aria-hidden="true"
          className="nexus-noise-layer pointer-events-none absolute inset-0 opacity-[0.03]"
        />

        {/* Subtle Center Axis Lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/[0.04]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/[0.04]"
        />

        {/* Center Viewport Status Card (Tile Engine Placeholder) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <GlassPanel
            variant="subtle"
            padding="md"
            cornerMarks
            className="max-w-md text-center"
          >
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,rgba(7,9,13,0.75))] shadow-[0_0_18px_-4px_var(--accent-glow)]">
                <Crosshair className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <GlassBadge variant="accent" badgeStyle={badgeStyle} dot>
                Viewport Cartográfica · Etapa 3
              </GlassBadge>
              <h2
                className="text-lg font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--nexus-font-display)' }}
              >
                {activeLayer?.name ?? manifest.title}
              </h2>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Área pronta para receber o motor WebGL de pirâmide de tiles{' '}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[var(--accent-primary)]">
                  {'{z}/{x}/{y}.webp'}
                </code>{' '}
                e renderização de{' '}
                <span className="font-mono text-[var(--text-primary)]">
                  {(activeLayer?.pinsCount ?? totalPins).toLocaleString('pt-BR')}
                </span>{' '}
                pins desta camada.
              </p>
              {activeLayer?.tileUrlTemplate && (
                <div className="mt-1 w-full truncate rounded-md border border-white/[0.07] bg-black/35 px-2.5 py-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                  {activeLayer.tileUrlTemplate}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FLOATING TOPBAR (NEON GLASSMORPHISM)                              */}
      {/* ================================================================= */}
      <header className="pointer-events-none fixed inset-x-4 top-4 z-30 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back to Hub + Game Identity */}
        <GlassPanel
          variant="elevated"
          padding="none"
          className="pointer-events-auto flex items-center"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2 sm:px-3">
            <NeonButton
              size="sm"
              variant="glass"
              onClick={onBackToHub}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Voltar ao Hub
            </NeonButton>

            <div className="h-5 w-px bg-white/[0.10]" />

            <div className="flex items-center gap-2.5 pr-1">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  boxShadow: '0 0 10px var(--accent-glow)',
                }}
              />
              <div className="min-w-0">
                <h1
                  className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)] sm:text-base"
                  style={{ fontFamily: 'var(--nexus-font-display)' }}
                >
                  {manifest.title}
                </h1>
                <p className="hidden font-mono text-[10px] text-[var(--text-muted)] sm:block">
                  {manifest.studio} · {manifest.releaseYear}
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Center/Right: Layer / Map Switcher */}
        <GlassPanel
          variant="elevated"
          padding="none"
          className="pointer-events-auto max-w-full overflow-x-auto"
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-2"
            role="tablist"
            aria-label="Seletor de camadas do mapa"
          >
            <span className="hidden items-center gap-1.5 pr-1 pl-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] md:inline-flex">
              <Layers className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Camada
            </span>
            {manifest.maps.map((mapLayer) => {
              const isActive = activeLayer?.id === mapLayer.id;
              return (
                <NeonButton
                  key={mapLayer.id}
                  size="sm"
                  variant="glass"
                  active={isActive}
                  onClick={() => onSelectLayer(mapLayer.id)}
                >
                  <span>{mapLayer.name}</span>
                  <span className="ml-1 font-mono text-[10px] opacity-70">
                    {mapLayer.pinsCount.toLocaleString('pt-BR')}
                  </span>
                </NeonButton>
              );
            })}
          </div>
        </GlassPanel>
      </header>

      {/* ================================================================= */}
      {/* RETRACTABLE LEFT SIDEBAR (FILTERS & SEARCH SHELL)                 */}
      {/* ================================================================= */}
      <aside className="pointer-events-none fixed top-20 bottom-4 left-4 z-20 flex items-start gap-2.5">
        {isSidebarOpen ? (
          <GlassPanel
            variant="elevated"
            padding="none"
            cornerMarks
            className="pointer-events-auto flex max-h-full w-[308px] flex-col sm:w-[330px]"
          >
            {/* Sidebar Header Banner (real bannerImage/coverImage with procedural fallback) */}
            <div className="relative">
              <GameCoverArt
                title={manifest.title}
                imageUrl={manifest.assets.bannerImage ?? manifest.assets.coverImage}
                theme={activeTheme}
                heightClassName="h-28"
                showMetadataWatermark={false}
              />

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Recolher painel lateral"
                title="Recolher painel lateral"
                className="neon-focus-ring absolute top-2.5 right-2.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/15 bg-[rgba(7,9,13,0.75)] text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[var(--accent-primary)] hover:text-white"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>

              <div className="absolute right-3 bottom-2.5 left-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-white/90">
                    {activeLayer?.name}
                  </span>
                  <GlassBadge variant="accent" badgeStyle={badgeStyle} size="sm">
                    {percent}%
                  </GlassBadge>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow: percent > 0 ? '0 0 10px var(--accent-glow)' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-3.5">
              {/* Search Pins Input */}
              <GlassInput
                inputRef={searchInputRef}
                value={pinSearchQuery}
                onChange={(e) => setPinSearchQuery(e.target.value)}
                placeholder="Filtrar categorias ou pins..."
                aria-label="Buscar categorias ou pins no mapa"
                leftIcon={<Search className="h-3.5 w-3.5" />}
                rightSlot={
                  pinSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setPinSearchQuery('')}
                      aria-label="Limpar busca"
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <kbd className="rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      Ctrl K
                    </kbd>
                  )
                }
              />

              {/* Quick Filter Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <NeonButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setAllCategories(true)}
                    leftIcon={<Eye className="h-3 w-3" />}
                  >
                    Todos
                  </NeonButton>
                  <NeonButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setAllCategories(false)}
                    leftIcon={<EyeOff className="h-3 w-3" />}
                  >
                    Nenhum
                  </NeonButton>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {visibleCount}/{totalCategoryCount} ativas
                </span>
              </div>

              {/* Category Groups Accordion */}
              <div className="space-y-2.5">
                {filteredCategoryGroups.length > 0 ? (
                  filteredCategoryGroups.map((group) => {
                    const isCollapsed = Boolean(collapsedGroups[group.id]);
                    return (
                      <div
                        key={group.id}
                        className="rounded-lg border border-white/[0.07] bg-black/25"
                      >
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                        >
                          <span>{group.label}</span>
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          )}
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-1 border-t border-white/[0.06] p-1.5">
                            {group.categories.map((category) => {
                              const isVisible = Boolean(visibleCategories[category.id]);
                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => toggleCategory(category.id)}
                                  className={[
                                    'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all duration-150',
                                    isVisible
                                      ? 'bg-white/[0.05] text-[var(--text-primary)]'
                                      : 'text-[var(--text-muted)] opacity-60 hover:opacity-85',
                                  ].join(' ')}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span
                                      aria-hidden="true"
                                      className="h-2 w-2 shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: category.color,
                                        boxShadow: isVisible
                                          ? `0 0 8px ${category.color}`
                                          : 'none',
                                      }}
                                    />
                                    <span className="truncate">{category.name}</span>
                                  </span>
                                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                    {isVisible ? 'ON' : 'OFF'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                    Nenhuma categoria encontrada para &ldquo;{pinSearchQuery}&rdquo;.
                  </p>
                )}
              </div>

              {/* Footer Progress Summary */}
              <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-3 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  Encontrados
                </span>
                <span className="font-mono text-[var(--text-primary)]">
                  {progress.foundMarkersCount.toLocaleString('pt-BR')} /{' '}
                  {totalPins.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir painel lateral de filtros"
              title="Abrir painel lateral de filtros"
              className="neon-focus-ring flex h-10 w-10 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
            >
              <PanelLeftOpen className="h-4.5 w-4.5" />
            </button>
          </GlassPanel>
        )}
      </aside>

      {/* ================================================================= */}
      {/* BOTTOM-RIGHT TACTICAL HUD: ZOOM CONTROLS + REAL-TIME COORDS [X,Y] */}
      {/* ================================================================= */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-20 flex flex-col items-end gap-2.5">
        {/* Zoom Controls */}
        <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
          <div className="flex flex-col divide-y divide-white/[0.07]">
            <button
              type="button"
              onClick={() => updateZoom(Math.min(maxZoom, +(zoomLevel + 0.5).toFixed(1)))}
              aria-label="Aproximar zoom"
              className="neon-focus-ring flex h-9 w-9 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-primary)]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateZoom(Math.max(minZoom, +(zoomLevel - 0.5).toFixed(1)))}
              aria-label="Afastar zoom"
              className="neon-focus-ring flex h-9 w-9 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-primary)]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateZoom(activeLayer?.defaultZoom ?? 2)}
              aria-label="Resetar visão"
              title="Resetar visão"
              className="neon-focus-ring flex h-9 w-9 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-primary)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </GlassPanel>

        {/* Real-Time Cursor Coordinate Readout */}
        <GlassPanel variant="elevated" padding="none" className="pointer-events-auto">
          <div className="flex items-center gap-3 px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
            <span>
              X:{' '}
              <strong className="font-semibold text-[var(--text-primary)]">
                {cursorCoords.x >= 0 ? `+${cursorCoords.x.toFixed(1)}` : cursorCoords.x.toFixed(1)}
              </strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              Y:{' '}
              <strong className="font-semibold text-[var(--text-primary)]">
                {cursorCoords.y >= 0 ? `+${cursorCoords.y.toFixed(1)}` : cursorCoords.y.toFixed(1)}
              </strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              Z:{' '}
              <strong className="font-semibold text-[var(--accent-primary)]">
                {zoomLevel.toFixed(1)}x
              </strong>
            </span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
