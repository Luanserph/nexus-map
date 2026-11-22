import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Minus,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { InteractiveMap } from '../../core/engine';
import type { InteractiveMapHandle } from '../../core/engine';
import { useGameTheme } from '../../core/theme-engine';
import {
  getCompletionPercent,
  getMarkersByMap,
  getTotalPinsCount,
} from '../../data/games';
import type { Category, HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';
import { GameCoverArt } from '../hub/GameCoverArt';

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
  const [zoomLevel, setZoomLevel] = useState<number>(activeLayer?.defaultZoom ?? 0);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({
    x: activeLayer?.defaultCenter?.[0] ?? 512,
    y: activeLayer?.defaultCenter?.[1] ?? 512,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapHandleRef = useRef<InteractiveMapHandle>(null);

  const totalPins = getTotalPinsCount(manifest);
  const percent = getCompletionPercent(entry);
  const badgeStyle = activeTheme.badgeStyle ?? 'minimal';

  const categoriesById = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const group of manifest.categoryGroups) {
      for (const category of group.categories) {
        map[category.id] = category;
      }
    }
    return map;
  }, [manifest.categoryGroups]);

  const layerMarkers = useMemo(() => {
    if (!activeLayer) return [];
    return getMarkersByMap(manifest.slug, activeLayer.id);
  }, [manifest.slug, activeLayer]);

  const markerCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const marker of layerMarkers) {
      counts[marker.category] = (counts[marker.category] ?? 0) + 1;
    }
    return counts;
  }, [layerMarkers]);

  const normalizedPinSearch = pinSearchQuery.trim().toLowerCase();

  const filteredMarkers = useMemo(() => {
    return layerMarkers.filter((marker) => {
      if (!visibleCategories[marker.category]) return false;
      if (!normalizedPinSearch) return true;

      const categoryName = categoriesById[marker.category]?.name ?? '';
      const haystack = [
        marker.title,
        marker.description,
        marker.region ?? '',
        categoryName,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedPinSearch);
    });
  }, [layerMarkers, visibleCategories, normalizedPinSearch, categoriesById]);

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

  const visibleCategoryCount = Object.values(visibleCategories).filter(Boolean).length;
  const totalCategoryCount = manifest.categoryGroups.reduce(
    (sum, g) => sum + g.categories.length,
    0
  );

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* ================================================================= */}
      {/* INTERACTIVE LEAFLET MAP ENGINE (L.CRS.Simple + Canvas + Fallback) */}
      {/* ================================================================= */}
      <div className="relative z-0 h-full w-full">
        {activeLayer && (
          <InteractiveMap
            mapRef={mapHandleRef}
            mapLayer={activeLayer}
            theme={activeTheme}
            markers={filteredMarkers}
            categoriesById={categoriesById}
            onCursorMove={setCursorCoords}
            onZoomChange={setZoomLevel}
          />
        )}
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
      {/* RETRACTABLE LEFT SIDEBAR (SEARCH & CATEGORY FILTERS)              */}
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
                placeholder="Buscar pins, chefes ou regiões..."
                aria-label="Buscar pins no mapa"
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

              {/* Quick-jump Search Matches */}
              {normalizedPinSearch && (
                <div className="space-y-1 rounded-lg border border-white/[0.08] bg-black/35 p-2">
                  <div className="flex items-center justify-between px-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <span>Resultados ({filteredMarkers.length})</span>
                    <span>Clique para ir</span>
                  </div>
                  {filteredMarkers.length > 0 ? (
                    <div className="max-h-36 space-y-1 overflow-y-auto">
                      {filteredMarkers.map((marker) => {
                        const cat = categoriesById[marker.category];
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={() => mapHandleRef.current?.flyToMarker(marker)}
                            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-primary)] transition-colors hover:bg-white/[0.08]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    cat?.color ?? 'var(--accent-primary)',
                                }}
                              />
                              <span className="truncate">{marker.title}</span>
                            </span>
                            <Navigation className="h-3 w-3 shrink-0 text-[var(--accent-primary)] opacity-80" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-1 py-2 text-center text-xs text-[var(--text-muted)]">
                      Nenhum pin visível corresponde à busca.
                    </p>
                  )}
                </div>
              )}

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
                  {visibleCategoryCount}/{totalCategoryCount} ativas
                </span>
              </div>

              {/* Category Groups Accordion */}
              <div className="space-y-2.5">
                {manifest.categoryGroups.map((group) => {
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
                            const count = markerCountByCategory[category.id] ?? 0;
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                className={[
                                  'flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all duration-150',
                                  isVisible
                                    ? 'bg-white/[0.05] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] opacity-55 hover:opacity-85',
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
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Progress Summary */}
              <div className="mt-auto space-y-1.5 border-t border-white/[0.07] pt-3 text-[11px] text-[var(--text-muted)]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    Pins na camada
                  </span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {filteredMarkers.length} / {layerMarkers.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Progresso total</span>
                  <span className="font-mono text-[var(--text-secondary)]">
                    {progress.foundMarkersCount.toLocaleString('pt-BR')} /{' '}
                    {totalPins.toLocaleString('pt-BR')}
                  </span>
                </div>
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
              onClick={() => mapHandleRef.current?.zoomIn()}
              aria-label="Aproximar zoom"
              className="neon-focus-ring flex h-9 w-9 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-primary)]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => mapHandleRef.current?.zoomOut()}
              aria-label="Afastar zoom"
              className="neon-focus-ring flex h-9 w-9 cursor-pointer items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-[var(--accent-primary)]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => mapHandleRef.current?.resetView()}
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
                {cursorCoords.x.toFixed(1)}
              </strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              Y:{' '}
              <strong className="font-semibold text-[var(--text-primary)]">
                {cursorCoords.y.toFixed(1)}
              </strong>
            </span>
            <span className="text-white/20">|</span>
            <span>
              Z:{' '}
              <strong className="font-semibold text-[var(--accent-primary)]">
                {zoomLevel.toFixed(2)}
              </strong>
            </span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
