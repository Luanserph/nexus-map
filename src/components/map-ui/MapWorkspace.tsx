import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Crown,
  DoorOpen,
  Download,
  Eye,
  EyeOff,
  Flag,
  Flame,
  FlaskConical,
  Gem,
  Grid2x2,
  Hammer,
  Landmark,
  Layers,
  Leaf,
  Lock,
  MapPin,
  Minus,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radio,
  RotateCcw,
  Scissors,
  ScrollText,
  Search,
  Shield,
  ShoppingBag,
  Signpost,
  Skull,
  Spade,
  Sparkles,
  Sprout,
  StickyNote,
  Swords,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { InteractiveMap } from '../../core/engine';
import type { InteractiveMapHandle } from '../../core/engine';
import {
  deleteCustomRoute,
  deleteUserNote,
  downloadBackupFile,
  importBackupJson,
  saveCustomRoute,
  saveUserNote,
  toggleChecklistItem,
  toggleMarkerFound,
  useGameMapStorage,
} from '../../core/storage';
import { useGameTheme } from '../../core/theme-engine';
import { getMarkersByMap } from '../../data/games';
import type {
  Category,
  CategoryPreset,
  HubGameEntry,
  MapInteractionMode,
  MapMarker,
  UserNoteRecord,
} from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';
import { GameCoverArt } from '../hub/GameCoverArt';
import { MapToolbar } from './MapToolbar';
import { MarkerDetailCard } from './MarkerDetailCard';
import { NoteEditorCard } from './NoteEditorCard';

export interface MapWorkspaceProps {
  entry: HubGameEntry;
  activeLayerId?: string;
  onSelectLayer: (layerId: string) => void;
  onBackToHub: () => void;
}

function renderCategoryIcon(iconName: string): ReactNode {
  const props = { className: 'h-3.5 w-3.5 shrink-0' };
  switch (iconName) {
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'landmark':
      return <Landmark {...props} />;
    case 'skull':
      return <Skull {...props} />;
    case 'swords':
      return <Swords {...props} />;
    case 'sprout':
      return <Sprout {...props} />;
    case 'radio':
      return <Radio {...props} />;
    case 'activity':
      return <Activity {...props} />;
    case 'alert-triangle':
      return <AlertTriangle {...props} />;
    case 'bookmark':
      return <Bookmark {...props} />;
    case 'navigation':
      return <Navigation {...props} />;
    case 'gem':
      return <Gem {...props} />;
    case 'signpost':
      return <Signpost {...props} />;
    case 'anchor':
      return <Anchor {...props} />;
    case 'door-open':
      return <DoorOpen {...props} />;
    case 'scroll-text':
      return <ScrollText {...props} />;
    case 'flame':
      return <Flame {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'hammer':
      return <Hammer {...props} />;
    case 'flask-conical':
      return <FlaskConical {...props} />;
    case 'leaf':
      return <Leaf {...props} />;
    case 'shopping-bag':
      return <ShoppingBag {...props} />;
    case 'scissors':
      return <Scissors {...props} />;
    case 'spade':
      return <Spade {...props} />;
    case 'compass':
      return <Compass {...props} />;
    case 'lock':
      return <Lock {...props} />;
    case 'flag':
      return <Flag {...props} />;
    case 'crown':
      return <Crown {...props} />;
    default:
      return <MapPin {...props} />;
  }
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

  const currentMapId = activeLayer?.id ?? manifest.maps[0]?.id ?? 'default';

  const { foundMarkerIds, checkedChecklistKeys, notes, routes } =
    useGameMapStorage(manifest.slug, currentMapId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [hideFound, setHideFound] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
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

  const [interactionMode, setInteractionMode] =
    useState<MapInteractionMode>('explore');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [selectedNote, setSelectedNote] = useState<UserNoteRecord | null>(null);
  const [draftNoteCoords, setDraftNoteCoords] = useState<[number, number] | null>(
    null
  );
  const [draftRoutePoints, setDraftRoutePoints] = useState<[number, number][]>([]);
  const [draftRouteColor, setDraftRouteColor] = useState<string>(
    activeTheme.accentPrimary
  );
  const [hiddenRouteIds, setHiddenRouteIds] = useState<Set<string>>(
    () => new Set()
  );

  const [zoomLevel, setZoomLevel] = useState<number>(activeLayer?.defaultZoom ?? 0);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({
    x: activeLayer?.defaultCenter?.[0] ?? 512,
    y: activeLayer?.defaultCenter?.[1] ?? 512,
  });
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const mapHandleRef = useRef<InteractiveMapHandle>(null);

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
    return getMarkersByMap(manifest.slug, currentMapId);
  }, [manifest.slug, currentMapId]);

  const layerStats = useMemo(() => {
    const totalByCat: Record<string, number> = {};
    const foundByCat: Record<string, number> = {};
    let foundInLayer = 0;

    for (const marker of layerMarkers) {
      totalByCat[marker.category] = (totalByCat[marker.category] ?? 0) + 1;
      if (foundMarkerIds.has(marker.id)) {
        foundByCat[marker.category] = (foundByCat[marker.category] ?? 0) + 1;
        foundInLayer += 1;
      }
    }

    const layerPercent =
      layerMarkers.length > 0
        ? Math.round((foundInLayer / layerMarkers.length) * 100)
        : 0;

    return { totalByCat, foundByCat, foundInLayer, layerPercent };
  }, [layerMarkers, foundMarkerIds]);

  const normalizedPinSearch = pinSearchQuery.trim().toLowerCase();

  const filteredMarkers = useMemo(() => {
    return layerMarkers.filter((marker) => {
      if (!visibleCategories[marker.category]) return false;
      if (hideFound && foundMarkerIds.has(marker.id)) return false;
      if (!normalizedPinSearch) return true;

      const categoryName = categoriesById[marker.category]?.name ?? '';
      const haystack = [
        marker.title,
        marker.description,
        marker.region ?? '',
        categoryName,
        ...(marker.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedPinSearch);
    });
  }, [
    layerMarkers,
    visibleCategories,
    hideFound,
    foundMarkerIds,
    normalizedPinSearch,
    categoriesById,
  ]);

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
          return;
        }
        if (selectedMarker) {
          setSelectedMarker(null);
          return;
        }
        if (selectedNote || draftNoteCoords) {
          setSelectedNote(null);
          setDraftNoteCoords(null);
          return;
        }
        if (interactionMode !== 'explore') {
          setInteractionMode('explore');
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    pinSearchQuery,
    selectedMarker,
    selectedNote,
    draftNoteCoords,
    interactionMode,
  ]);

  function showToast(message: string) {
    setBackupFeedback(message);
    window.setTimeout(() => {
      setBackupFeedback((prev) => (prev === message ? null : prev));
    }, 3200);
  }

  function handleSelectLayer(layerId: string) {
    setSelectedMarker(null);
    setSelectedNote(null);
    setDraftNoteCoords(null);
    setDraftRoutePoints([]);
    onSelectLayer(layerId);
  }

  function handleSelectMarker(marker: MapMarker) {
    setSelectedNote(null);
    setDraftNoteCoords(null);
    setSelectedMarker(marker);
  }

  function handleSearchResultClick(marker: MapMarker) {
    handleSelectMarker(marker);
    mapHandleRef.current?.flyToMarker(marker);
  }

  function handleMapClick(coords: [number, number]) {
    if (interactionMode === 'add-note') {
      setSelectedMarker(null);
      setSelectedNote(null);
      setDraftNoteCoords(coords);
      setInteractionMode('explore');
    } else if (interactionMode === 'draw-route') {
      setDraftRoutePoints((prev) => [...prev, coords]);
    }
  }

  function applyPreset(preset: CategoryPreset) {
    const enableAll = preset.categoryIds.includes('*');
    const allowed = new Set(preset.categoryIds);
    const next: Record<string, boolean> = {};
    for (const group of manifest.categoryGroups) {
      for (const cat of group.categories) {
        next[cat.id] = enableAll || allowed.has(cat.id);
      }
    }
    setVisibleCategories(next);
    setActivePresetId(preset.id);
  }

  async function handleSaveNote(data: {
    id?: string;
    title: string;
    content: string;
    coords: [number, number];
  }) {
    const saved = await saveUserNote({
      id: data.id,
      gameSlug: manifest.slug,
      mapId: currentMapId,
      title: data.title,
      content: data.content,
      coords: data.coords,
    });
    setDraftNoteCoords(null);
    setSelectedNote(saved);
    showToast('Nota salva no IndexedDB.');
  }

  async function handleDeleteNote(id: string) {
    await deleteUserNote(id);
    setSelectedNote(null);
    showToast('Nota removida.');
  }

  async function handleSaveDraftRoute(name: string) {
    if (draftRoutePoints.length < 2) return;
    await saveCustomRoute({
      gameSlug: manifest.slug,
      mapId: currentMapId,
      name,
      color: draftRouteColor,
      points: draftRoutePoints,
    });
    setDraftRoutePoints([]);
    setInteractionMode('explore');
    showToast(`Rota "${name}" salva.`);
  }

  function handleToggleRouteVisibility(routeId: string) {
    setHiddenRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else {
        next.add(routeId);
      }
      return next;
    });
  }

  async function handleDeleteRoute(routeId: string) {
    await deleteCustomRoute(routeId);
    setHiddenRouteIds((prev) => {
      const next = new Set(prev);
      next.delete(routeId);
      return next;
    });
    showToast('Rota removida.');
  }

  async function handleExportBackup() {
    const payload = await downloadBackupFile();
    showToast(
      `Backup exportado (${payload.foundMarkers.length} pins, ${payload.userNotes.length} notas, ${payload.customRoutes.length} rotas).`
    );
  }

  async function handleImportBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const summary = await importBackupJson(text, 'merge');
      showToast(
        `Backup importado: ${summary.foundMarkers} pins, ${summary.userNotes} notas, ${summary.customRoutes} rotas.`
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao importar backup.'
      );
    }
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function toggleCategory(categoryId: string) {
    setActivePresetId(null);
    setVisibleCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }

  function setAllCategories(visible: boolean) {
    setActivePresetId(null);
    const next: Record<string, boolean> = {};
    for (const group of manifest.categoryGroups) {
      for (const cat of group.categories) {
        next[cat.id] = visible;
      }
    }
    setVisibleCategories(next);
  }

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* ================================================================= */}
      {/* INTERACTIVE LEAFLET MAP ENGINE (VIEWPORT CULLING + CLUSTERING)    */}
      {/* ================================================================= */}
      <div className="relative z-0 h-full w-full">
        {activeLayer && (
          <InteractiveMap
            mapRef={mapHandleRef}
            mapLayer={activeLayer}
            theme={activeTheme}
            markers={filteredMarkers}
            categoriesById={categoriesById}
            foundMarkerIds={foundMarkerIds}
            selectedMarkerId={selectedMarker?.id}
            onSelectMarker={handleSelectMarker}
            clusteringEnabled={clusteringEnabled}
            userNotes={notes}
            selectedNoteId={selectedNote?.id}
            onSelectNote={(note) => {
              setSelectedMarker(null);
              setDraftNoteCoords(null);
              setSelectedNote(note);
            }}
            routes={routes}
            hiddenRouteIds={hiddenRouteIds}
            draftRoutePoints={draftRoutePoints}
            draftRouteColor={draftRouteColor}
            interactionMode={interactionMode}
            onMapClick={handleMapClick}
            onCursorMove={setCursorCoords}
            onZoomChange={setZoomLevel}
          />
        )}
      </div>

      {/* ================================================================= */}
      {/* FLOATING TOPBAR (NEON GLASSMORPHISM)                              */}
      {/* ================================================================= */}
      <header className="pointer-events-none fixed inset-x-4 top-4 z-30 flex flex-wrap items-center justify-between gap-3">
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
                  onClick={() => handleSelectLayer(mapLayer.id)}
                >
                  <span>{mapLayer.name}</span>
                </NeonButton>
              );
            })}
          </div>
        </GlassPanel>
      </header>

      {/* ================================================================= */}
      {/* RETRACTABLE LEFT SIDEBAR (SEARCH, PRESETS, FILTERS, BACKUP)       */}
      {/* ================================================================= */}
      <aside className="pointer-events-none fixed top-20 bottom-4 left-4 z-20 flex items-start gap-2.5">
        {isSidebarOpen ? (
          <GlassPanel
            variant="elevated"
            padding="none"
            cornerMarks
            className="pointer-events-auto flex max-h-full w-[316px] flex-col sm:w-[344px]"
          >
            {/* Sidebar Header Banner + Active Map Progress */}
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
                  <span className="truncate text-xs font-medium text-white/95">
                    {activeLayer?.name}
                  </span>
                  <GlassBadge variant="accent" badgeStyle={badgeStyle} size="sm">
                    {layerStats.foundInLayer}/{layerMarkers.length} ·{' '}
                    {layerStats.layerPercent}%
                  </GlassBadge>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${layerStats.layerPercent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow:
                        layerStats.layerPercent > 0
                          ? '0 0 10px var(--accent-glow)'
                          : 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
              {/* Instant Pin Search */}
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

              {/* Instant Search Results */}
              {normalizedPinSearch && (
                <div className="space-y-1 rounded-lg border border-white/[0.08] bg-black/40 p-2">
                  <div className="flex items-center justify-between px-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <span>Resultados ({filteredMarkers.length})</span>
                    <span>Centralizar</span>
                  </div>
                  {filteredMarkers.length > 0 ? (
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {filteredMarkers.slice(0, 40).map((marker) => {
                        const cat = categoriesById[marker.category];
                        const isFound = foundMarkerIds.has(marker.id);
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={() => handleSearchResultClick(marker)}
                            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--text-primary)] transition-colors hover:bg-white/[0.08]"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    cat?.color ?? 'var(--accent-primary)',
                                  opacity: isFound ? 0.4 : 1,
                                }}
                              />
                              <span
                                className={
                                  isFound
                                    ? 'truncate text-[var(--text-muted)] line-through'
                                    : 'truncate'
                                }
                              >
                                {marker.title}
                              </span>
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

              {/* Quick Presets (data-driven from manifest.presets) */}
              {manifest.presets && manifest.presets.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Presets Rápidos
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {manifest.presets.map((preset) => (
                      <NeonButton
                        key={preset.id}
                        size="sm"
                        variant="glass"
                        active={activePresetId === preset.id}
                        title={preset.description}
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.label}
                      </NeonButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Filter Actions + Clustering Toggle */}
              <div className="grid grid-cols-2 gap-1.5">
                <NeonButton
                  size="sm"
                  variant="glass"
                  onClick={() => setAllCategories(true)}
                  leftIcon={<Eye className="h-3 w-3" />}
                >
                  Mostrar Tudo
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  onClick={() => setAllCategories(false)}
                  leftIcon={<EyeOff className="h-3 w-3" />}
                >
                  Ocultar Tudo
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  active={hideFound}
                  onClick={() => setHideFound((prev) => !prev)}
                  leftIcon={<CheckCircle2 className="h-3 w-3" />}
                >
                  {hideFound ? 'Só Pendentes' : 'Ocultar Achados'}
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  active={clusteringEnabled}
                  onClick={() => setClusteringEnabled((prev) => !prev)}
                  leftIcon={<Grid2x2 className="h-3 w-3" />}
                  title="Agrupar pins próximos em zooms distantes para 60 FPS"
                >
                  {clusteringEnabled ? 'Cluster: ON' : 'Cluster: OFF'}
                </NeonButton>
              </div>

              {/* Category Groups Accordion */}
              <div className="space-y-2">
                {manifest.categoryGroups.map((group) => {
                  const isCollapsed = Boolean(collapsedGroups[group.id]);
                  const groupTotal = group.categories.reduce(
                    (acc, c) => acc + (layerStats.totalByCat[c.id] ?? 0),
                    0
                  );
                  const groupFound = group.categories.reduce(
                    (acc, c) => acc + (layerStats.foundByCat[c.id] ?? 0),
                    0
                  );

                  return (
                    <div
                      key={group.id}
                      className="rounded-lg border border-white/[0.07] bg-black/25"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                      >
                        <span className="truncate">{group.label}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-[10px] font-normal text-[var(--text-muted)]">
                            {groupFound}/{groupTotal}
                          </span>
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          )}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1 border-t border-white/[0.06] p-1.5">
                          {group.categories.map((category) => {
                            const isVisible = Boolean(visibleCategories[category.id]);
                            const total = layerStats.totalByCat[category.id] ?? 0;
                            const found = layerStats.foundByCat[category.id] ?? 0;

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                className={[
                                  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-all duration-150',
                                  isVisible
                                    ? 'bg-white/[0.05] text-[var(--text-primary)]'
                                    : 'text-[var(--text-muted)] opacity-50 hover:opacity-80',
                                ].join(' ')}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span style={{ color: category.color }}>
                                    {renderCategoryIcon(category.icon)}
                                  </span>
                                  <span className="truncate">{category.name}</span>
                                </span>
                                <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                                  <span
                                    className={
                                      found > 0
                                        ? 'text-[var(--accent-primary)]'
                                        : ''
                                    }
                                  >
                                    {found}
                                  </span>
                                  /{total}
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

              {/* Personal Notes Quick List */}
              {notes.length > 0 && (
                <div className="rounded-lg border border-white/[0.07] bg-black/25 p-2">
                  <div className="mb-1.5 flex items-center justify-between px-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <StickyNote className="h-3 w-3 text-[var(--accent-secondary)]" />
                      Notas pessoais ({notes.length})
                    </span>
                  </div>
                  <div className="max-h-28 space-y-1 overflow-y-auto">
                    {notes.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => {
                          setSelectedMarker(null);
                          setDraftNoteCoords(null);
                          setSelectedNote(note);
                          mapHandleRef.current?.flyToCoords(note.coords);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-white/[0.07] hover:text-[var(--text-primary)]"
                      >
                        <span className="truncate">{note.title}</span>
                        <Navigation className="h-3 w-3 shrink-0 opacity-65" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer: Offline-First Backup Export / Import */}
              <div className="mt-auto space-y-2 border-t border-white/[0.07] pt-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <NeonButton
                    size="sm"
                    variant="glass"
                    onClick={() => void handleExportBackup()}
                    leftIcon={<Download className="h-3 w-3" />}
                  >
                    Exportar
                  </NeonButton>
                  <NeonButton
                    size="sm"
                    variant="glass"
                    onClick={() => importInputRef.current?.click()}
                    leftIcon={<Upload className="h-3 w-3" />}
                  >
                    Importar
                  </NeonButton>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={(e) => void handleImportBackupFile(e)}
                    className="hidden"
                  />
                </div>
                {backupFeedback && (
                  <p className="rounded-md border border-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,rgba(7,9,13,0.7))] px-2.5 py-1.5 text-[11px] text-[var(--text-primary)]">
                    {backupFeedback}
                  </p>
                )}
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
      {/* FLOATING RIGHT PANEL: RICH MARKER CARD OR PERSONAL NOTE EDITOR    */}
      {/* ================================================================= */}
      {(selectedMarker || selectedNote || draftNoteCoords) && (
        <div className="pointer-events-none fixed top-20 right-4 z-30">
          <div className="pointer-events-auto">
            {selectedMarker && (
              <MarkerDetailCard
                marker={selectedMarker}
                category={categoriesById[selectedMarker.category]}
                isFound={foundMarkerIds.has(selectedMarker.id)}
                checkedChecklistKeys={checkedChecklistKeys}
                badgeStyle={badgeStyle}
                onToggleFound={() =>
                  void toggleMarkerFound(manifest.slug, selectedMarker.id)
                }
                onToggleChecklistItem={(itemId) =>
                  void toggleChecklistItem(
                    manifest.slug,
                    selectedMarker.id,
                    itemId
                  )
                }
                onClose={() => setSelectedMarker(null)}
              />
            )}

            {(selectedNote || draftNoteCoords) && (
              <NoteEditorCard
                key={selectedNote?.id ?? `draft-${draftNoteCoords?.join(',')}`}
                note={selectedNote ?? undefined}
                draftCoords={draftNoteCoords ?? undefined}
                onSave={(data) => void handleSaveNote(data)}
                onDelete={(id) => void handleDeleteNote(id)}
                onClose={() => {
                  setSelectedNote(null);
                  setDraftNoteCoords(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FLOATING BOTTOM-CENTER TOOLBAR: EXPLORE / ADD NOTE / DRAW ROUTE   */}
      {/* ================================================================= */}
      <MapToolbar
        mode={interactionMode}
        onChangeMode={(nextMode) => {
          setInteractionMode(nextMode);
          if (nextMode !== 'draw-route') {
            setDraftRoutePoints([]);
          }
        }}
        draftPointsCount={draftRoutePoints.length}
        draftRouteColor={draftRouteColor}
        onChangeDraftColor={setDraftRouteColor}
        onUndoRoutePoint={() => setDraftRoutePoints((prev) => prev.slice(0, -1))}
        onClearDraftRoute={() => setDraftRoutePoints([])}
        onSaveDraftRoute={(name) => void handleSaveDraftRoute(name)}
        routes={routes}
        hiddenRouteIds={hiddenRouteIds}
        onToggleRouteVisibility={handleToggleRouteVisibility}
        onDeleteRoute={(id) => void handleDeleteRoute(id)}
      />

      {/* ================================================================= */}
      {/* BOTTOM-RIGHT TACTICAL HUD: ZOOM CONTROLS + REAL-TIME COORDS [X,Y] */}
      {/* ================================================================= */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-20 flex flex-col items-end gap-2.5">
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
