import {
  Activity,
  AlertCircle,
  Anchor,
  ArrowLeft,
  Bookmark,
  Box,
  Castle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Compass,
  Copy,
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
  Heart,
  Landmark,
  Layers,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Moon,
  Mountain,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Radio,
  RotateCcw,
  ScrollText,
  Search,
  Shield,
  ShoppingBag,
  Signpost,
  Skull,
  Spade,
  Sparkles,
  Star,
  StickyNote,
  Store,
  Sun,
  Sword,
  Swords,
  Upload,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { InteractiveMap } from '../../core/engine';
import type {
  ActiveGuidedRouteOverlay,
  InteractiveMapHandle,
} from '../../core/engine';
import { LanguageSelector, useI18n } from '../../core/i18n';
import {
  deleteCustomRoute,
  deleteUserContribution,
  deleteUserNote,
  downloadBackupFile,
  importBackupJson,
  saveCustomRoute,
  saveUserContribution,
  saveUserNote,
  setMarkerFound,
  toggleChecklistItem,
  toggleMarkerFound,
  useGameMapStorage,
} from '../../core/storage';
import { generateOptimized100Route } from '../../core/routing';
import type { OptimizedRouteResult } from '../../core/routing';
import { useLivePlayer } from '../../core/telemetry';
import { useGameTheme } from '../../core/theme-engine';
import { getCategoryIconKey } from '../../core/utils/categoryIcons';
import {
  getCachedMarkersByGameSlug,
  getCachedRegionsByGameSlug,
  loadMarkersByGameSlug,
  loadRegionsByGameSlug,
} from '../../data/games';
import type {
  Category,
  CategoryPreset,
  GameDlc,
  GuideFocus,
  GuideScope,
  GuideStartMode,
  HubGameEntry,
  MapInteractionMode,
  MapMarker,
  UserNoteRecord,
} from '../../types/schema';
import { DesktopPinButton, GlassBadge, GlassInput, GlassPanel, NeonButton } from '../glass';
import { GameCoverArt } from '../hub/GameCoverArt';
import { GuidedRoutePanel } from './GuidedRoutePanel';
import { LiveTelemetryWidget } from './LiveTelemetryWidget';
import { MapLayerSwitcher } from './MapLayerSwitcher';
import { MapToolbar } from './MapToolbar';
import { MarkerDetailCard } from './MarkerDetailCard';
import { NoteEditorCard } from './NoteEditorCard';

export interface MapWorkspaceProps {
  entry: HubGameEntry;
  activeLayerId?: string;
  onSelectLayer: (layerId: string) => void;
  onBackToHub: () => void;
}

function renderCategoryIcon(category: Pick<Category, 'id' | 'name' | 'icon'>): ReactNode {
  const props = { className: 'h-3.5 w-3.5 shrink-0' };
  const iconKey = getCategoryIconKey(category.id, category.name, category.icon);
  switch (iconKey) {
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'landmark':
      return <Landmark {...props} />;
    case 'skull':
      return <Skull {...props} />;
    case 'swords':
      return <Swords {...props} />;
    case 'sword':
      return <Sword {...props} />;
    case 'radio':
      return <Radio {...props} />;
    case 'activity':
      return <Activity {...props} />;
    case 'alert-circle':
      return <AlertCircle {...props} />;
    case 'bookmark':
      return <Bookmark {...props} />;
    case 'box':
      return <Box {...props} />;
    case 'castle':
      return <Castle {...props} />;
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
    case 'wrench':
      return <Wrench {...props} />;
    case 'flask-conical':
      return <FlaskConical {...props} />;
    case 'leaf':
      return <Leaf {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'star':
      return <Star {...props} />;
    case 'store':
      return <Store {...props} />;
    case 'user':
      return <User {...props} />;
    case 'mountain':
      return <Mountain {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'shopping-bag':
      return <ShoppingBag {...props} />;
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
    case 'map-pin':
      return <MapPin {...props} />;
    default:
      return <CircleDot {...props} />;
  }
}

export function MapWorkspace({
  entry,
  activeLayerId,
  onSelectLayer,
  onBackToHub,
}: MapWorkspaceProps) {
  const { t, resolveMarkerTitle, resolveMarkerDescription } = useI18n();
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

  // Live IndexedDB storage
  const {
    foundMarkerIds,
    checkedChecklistKeys,
    contributionsByMarker,
    notes,
    routes,
  } = useGameMapStorage(manifest.slug, currentMapId);

  // Live Player Telemetry (WebSocket + Dev Simulator)
  const telemetry = useLivePlayer({
    gameSlug: manifest.slug,
    mapId: currentMapId,
    bounds: activeLayer?.bounds,
  });

  // Sidebar & filter state (closed by default on mobile < 768px for clean full-screen map)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [pinSearchQuery, setPinSearchQuery] = useState('');
  const [hideFound, setHideFound] = useState(false);
  const [selectedDlcFilter, setSelectedDlcFilter] = useState<string>('all');
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

  // Dynamic Guided 100% Route Optimizer state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [tileSetByLayer, setTileSetByLayer] = useState<Record<string, string>>({});
  const [guideScope, setGuideScope] = useState<GuideScope>('all');
  const [guideFocus, setGuideFocus] = useState<GuideFocus>('all');
  const [guideStartMode, setGuideStartMode] =
    useState<GuideStartMode>('fast-travel');
  const [guideCustomStartCoords, setGuideCustomStartCoords] = useState<
    [number, number] | null
  >(null);
  const [guideRespectFilters, setGuideRespectFilters] = useState(false);
  const [generatedRoute, setGeneratedRoute] =
    useState<OptimizedRouteResult | null>(null);
  const [activeGuideStepIndex, setActiveGuideStepIndex] = useState<number>(0);

  // Selection, Notes & Route Drawing state
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

  const [zoomLevel, setZoomLevel] = useState<number>(
    activeLayer?.initialZoom ?? activeLayer?.defaultZoom ?? 0
  );
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({
    x: activeLayer?.initialCenter?.[1] ?? activeLayer?.defaultCenter?.[0] ?? 512,
    y: activeLayer?.initialCenter?.[0] ?? activeLayer?.defaultCenter?.[1] ?? 512,
  });
  const cursorCoordsRef = useRef(cursorCoords);
  useEffect(() => {
    cursorCoordsRef.current = cursorCoords;
  }, [cursorCoords]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const isGeo = activeLayer?.crs === 'epsg3857';
      const c = cursorCoordsRef.current;
      const formatted = isGeo
        ? `[${c.y.toFixed(4)}, ${c.x.toFixed(4)}]`
        : `[${c.x.toFixed(1)}, ${c.y.toFixed(1)}]`;
      void navigator.clipboard?.writeText(formatted);
      showToast(`Coordenada copiada: ${formatted}`);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLayer?.crs]);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const mapHandleRef = useRef<InteractiveMapHandle>(null);

  const badgeStyle = activeTheme.badgeStyle ?? 'minimal';

  const dlcsById = useMemo(() => {
    const map: Record<string, GameDlc> = {};
    for (const dlc of manifest.dlcs ?? []) {
      map[dlc.id] = dlc;
    }
    return map;
  }, [manifest.dlcs]);

  const categoriesById = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const group of manifest.categoryGroups) {
      for (const category of group.categories) {
        map[category.id] = category;
      }
    }
    return map;
  }, [manifest.categoryGroups]);

  const [loadedGameData, setLoadedGameData] = useState<{
    slug: string;
    status: 'loading' | 'ready' | 'error';
    markers: MapMarker[];
    regions: import('../../types/schema').MapRegion[];
  }>(() => {
    const cachedMarkers = getCachedMarkersByGameSlug(manifest.slug);
    const cachedRegions = getCachedRegionsByGameSlug(manifest.slug);
    const hasCachedData =
      cachedMarkers.length > 0 || (activeLayer?.pinsCount ?? 0) === 0;
    return {
      slug: manifest.slug,
      status: hasCachedData ? 'ready' : 'loading',
      markers: cachedMarkers,
      regions: cachedRegions,
    };
  });

  const isLoadingMapData =
    loadedGameData.slug !== manifest.slug || loadedGameData.status === 'loading';

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    Promise.all([
      loadMarkersByGameSlug(manifest.slug, abortController.signal),
      loadRegionsByGameSlug(manifest.slug, abortController.signal),
    ])
      .then(([loadedMarkers, loadedRegions]) => {
        if (!isActive || abortController.signal.aborted) return;
        setLoadedGameData({
          slug: manifest.slug,
          status: 'ready',
          markers: loadedMarkers,
          regions: loadedRegions,
        });
      })
      .catch((error: unknown) => {
        if (!isActive || abortController.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadedGameData({
          slug: manifest.slug,
          status: 'error',
          markers: [],
          regions: [],
        });
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [manifest.slug]);

  const gameRegions = useMemo(() => {
    const all = loadedGameData.slug === manifest.slug ? loadedGameData.regions : [];
    return all.filter((region) => !region.mapId || region.mapId === currentMapId);
  }, [loadedGameData, manifest.slug, currentMapId]);

  const layerMarkers = useMemo(() => {
    const all = loadedGameData.slug === manifest.slug ? loadedGameData.markers : [];
    return all.filter((marker) => marker.mapId === currentMapId);
  }, [loadedGameData, manifest.slug, currentMapId]);

  // DLC-scoped markers (separates Base Game vs DLC progress cleanly)
  const dlcScopedMarkers = useMemo(() => {
    if (selectedDlcFilter === 'all') return layerMarkers;
    return layerMarkers.filter((m) => (m.dlc ?? 'base') === selectedDlcFilter);
  }, [layerMarkers, selectedDlcFilter]);

  const availableLayerDlcs = useMemo(() => {
    const present = new Set<string>();
    for (const m of layerMarkers) {
      present.add(m.dlc ?? 'base');
    }
    return (manifest.dlcs ?? []).filter((d) => present.has(d.id));
  }, [layerMarkers, manifest.dlcs]);

  const layerStats = useMemo(() => {
    const totalByCat: Record<string, number> = {};
    const foundByCat: Record<string, number> = {};
    let foundInScope = 0;

    for (const marker of dlcScopedMarkers) {
      totalByCat[marker.category] = (totalByCat[marker.category] ?? 0) + 1;
      if (foundMarkerIds.has(marker.id)) {
        foundByCat[marker.category] = (foundByCat[marker.category] ?? 0) + 1;
        foundInScope += 1;
      }
    }

    const scopePercent =
      dlcScopedMarkers.length > 0
        ? Math.round((foundInScope / dlcScopedMarkers.length) * 100)
        : 0;

    return { totalByCat, foundByCat, foundInScope, scopePercent };
  }, [dlcScopedMarkers, foundMarkerIds]);

  const normalizedPinSearch = pinSearchQuery.trim().toLowerCase();

  const filteredMarkers = useMemo(() => {
    return dlcScopedMarkers.filter((marker) => {
      if (!visibleCategories[marker.category]) return false;
      if (hideFound && foundMarkerIds.has(marker.id)) return false;
      if (!normalizedPinSearch) return true;

      const categoryName = categoriesById[marker.category]?.name ?? '';
      const haystack = [
        resolveMarkerTitle(marker),
        resolveMarkerDescription(marker),
        marker.region ?? '',
        categoryName,
        ...(marker.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedPinSearch);
    });
  }, [
    dlcScopedMarkers,
    visibleCategories,
    hideFound,
    foundMarkerIds,
    normalizedPinSearch,
    categoriesById,
    resolveMarkerTitle,
    resolveMarkerDescription,
  ]);

  // Dynamic Guided 100% Route overlay for InteractiveMap
  const guidedOverlay: ActiveGuidedRouteOverlay | null = useMemo(() => {
    if (!isGuideOpen || !generatedRoute || generatedRoute.steps.length === 0) {
      return null;
    }
    return {
      color: activeTheme.accentSecondary,
      activeStepIndex: Math.min(
        activeGuideStepIndex,
        generatedRoute.steps.length - 1
      ),
      steps: generatedRoute.steps.map((s) => ({
        stepNumber: s.stepNumber,
        marker: s.marker,
      })),
    };
  }, [
    isGuideOpen,
    generatedRoute,
    activeGuideStepIndex,
    activeTheme.accentSecondary,
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
        if (isGuideOpen) {
          setIsGuideOpen(false);
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
    isGuideOpen,
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
    setIsGuideOpen(false);
    setGeneratedRoute(null);
    setSelectedDlcFilter('all');
    if (telemetry.isSimulating) {
      telemetry.disconnect();
    }
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

  function runRouteGenerator(overrides?: {
    scope?: GuideScope;
    focus?: GuideFocus;
    startMode?: GuideStartMode;
    customStartCoords?: [number, number] | null;
    respectVisibleCategories?: boolean;
  }) {
    const nextScope = overrides?.scope ?? guideScope;
    const nextFocus = overrides?.focus ?? guideFocus;
    const nextStartMode = overrides?.startMode ?? guideStartMode;
    const nextCustomCoords =
      overrides?.customStartCoords !== undefined
        ? overrides.customStartCoords
        : guideCustomStartCoords;
    const nextRespectFilters =
      overrides?.respectVisibleCategories ?? guideRespectFilters;

    const result = generateOptimized100Route({
      markers: layerMarkers,
      foundMarkerIds,
      categoriesById,
      scope: nextScope,
      focus: nextFocus,
      startMode: nextStartMode,
      customStartCoords: nextCustomCoords,
      livePlayerCoords: telemetry.player
        ? [telemetry.player.x, telemetry.player.y]
        : null,
      visibleCategories,
      respectVisibleCategories: nextRespectFilters,
    });

    setGeneratedRoute(result);
    setActiveGuideStepIndex(0);

    if (result.steps[0]) {
      mapHandleRef.current?.flyToMarker(result.steps[0].marker);
    }
  }

  function handleToggleGuideMode() {
    if (isGuideOpen) {
      setIsGuideOpen(false);
      if (interactionMode === 'pick-guide-start') {
        setInteractionMode('explore');
      }
      return;
    }

    setSelectedMarker(null);
    setSelectedNote(null);
    setDraftNoteCoords(null);
    setIsGuideOpen(true);
    runRouteGenerator();
  }

  function handleSelectGuideStep(idx: number) {
    const steps = generatedRoute?.steps ?? [];
    if (steps.length === 0) return;
    const clamped = Math.max(0, Math.min(steps.length - 1, idx));
    setActiveGuideStepIndex(clamped);
    const step = steps[clamped];
    if (step) {
      mapHandleRef.current?.flyToMarker(step.marker);
    }
  }

  async function handleCompleteAndNextGuideStep() {
    const steps = generatedRoute?.steps ?? [];
    const currentStep = steps[activeGuideStepIndex];
    if (!currentStep) return;

    await setMarkerFound(manifest.slug, currentStep.marker.id, true);

    if (activeGuideStepIndex < steps.length - 1) {
      const nextIdx = activeGuideStepIndex + 1;
      setActiveGuideStepIndex(nextIdx);
      const nextStep = steps[nextIdx];
      if (nextStep) {
        mapHandleRef.current?.flyToMarker(nextStep.marker);
      }
    } else {
      showToast('Rota 100% concluída!');
    }
  }

  function handleMapClick(coords: [number, number]) {
    if (interactionMode === 'pick-guide-start') {
      setGuideStartMode('map-click');
      setGuideCustomStartCoords(coords);
      setInteractionMode('explore');
      runRouteGenerator({
        startMode: 'map-click',
        customStartCoords: coords,
      });
      showToast(
        `Ponto de partida definido em [${coords[0].toFixed(1)}, ${coords[1].toFixed(1)}].`
      );
      return;
    }

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
    const contribCount = payload.userContributions?.length ?? 0;
    showToast(
      `Backup: ${payload.foundMarkers.length} pins, ${payload.userNotes.length} notas, ${payload.customRoutes.length} rotas, ${contribCount} prints.`
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
        `Importado: ${summary.foundMarkers} pins, ${summary.userNotes} notas, ${summary.customRoutes} rotas, ${summary.userContributions} prints.`
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

  const showRightPanel = Boolean(
    selectedMarker || selectedNote || draftNoteCoords || isGuideOpen
  );

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* ================================================================= */}
      {/* INTERACTIVE LEAFLET MAP ENGINE                                    */}
      {/* ================================================================= */}
      <div className="relative z-0 h-full w-full">
        {isLoadingMapData && (
          <div className="pointer-events-none fixed top-20 left-1/2 z-40 -translate-x-1/2">
            <GlassPanel variant="elevated" padding="none">
              <div className="flex items-center gap-2 px-3.5 py-2 font-mono text-xs text-[var(--text-primary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-primary)]" />
                <span>Carregando mapa...</span>
              </div>
            </GlassPanel>
          </div>
        )}
        {activeLayer && (
          <InteractiveMap
            mapRef={mapHandleRef}
            mapLayer={activeLayer}
            regions={gameRegions}
            activeTileSetId={
              activeLayer.tileSets
                ? (tileSetByLayer[activeLayer.id] ?? activeLayer.tileSets[0]?.id)
                : undefined
            }
            theme={activeTheme}
            markers={filteredMarkers}
            categoriesById={categoriesById}
            foundMarkerIds={foundMarkerIds}
            selectedMarkerId={selectedMarker?.id}
            onSelectMarker={handleSelectMarker}
            clusteringEnabled={clusteringEnabled}
            guidedRoute={guidedOverlay}
            onSelectGuidedStep={handleSelectGuideStep}
            livePlayer={telemetry.player}
            followLivePlayer={telemetry.followCamera}
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
      {/* FLOATING TOPBAR (BACK + TITLE + LAYERS WITH DLC BADGES + GUIDE)   */}
      {/* ================================================================= */}
      <header className="pointer-events-none fixed inset-x-2.5 top-2.5 z-30 flex flex-wrap items-center justify-between gap-2 md:inset-x-4 md:top-4 md:gap-3">
        <GlassPanel
          variant="elevated"
          padding="none"
          className="pointer-events-auto flex max-w-full items-center"
        >
          <div className="flex min-w-0 items-center gap-2 px-2 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2">
            <NeonButton
              size="sm"
              variant="glass"
              onClick={onBackToHub}
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              <span className="hidden sm:inline">{t('map.backToHub')}</span>
              <span className="sm:hidden">Hub</span>
            </NeonButton>

            {activeLayer?.isInterior && (
              <NeonButton
                size="sm"
                variant="primary"
                onClick={() =>
                  handleSelectLayer(
                    activeLayer.parentMapId ?? manifest.maps[0]?.id ?? 'main'
                  )
                }
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              >
                {t('map.backToSurface')}
              </NeonButton>
            )}

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

        <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 md:gap-2">
          {/* Desktop-only Always-on-Top Pin (Tauri) */}
          <DesktopPinButton compact />

          {/* Language Selector in Map Topbar (desktop only; moved into drawer on mobile) */}
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          {/* TileSet Variant Switcher (e.g. Dia / Noite) */}
          {activeLayer?.tileSets && activeLayer.tileSets.length > 1 && (
            <GlassPanel variant="elevated" padding="none">
              <div
                className="flex items-center gap-1 px-2 py-2"
                role="tablist"
                aria-label="Estilo do mapa"
              >
                {activeLayer.tileSets.map((tileSet) => {
                  const currentTsId =
                    tileSetByLayer[activeLayer.id] ?? activeLayer.tileSets?.[0]?.id;
                  const isActive = currentTsId === tileSet.id;
                  const lowerId = tileSet.id.toLowerCase();
                  const icon =
                    lowerId.includes('night') || lowerId.includes('noite') ? (
                      <Moon className="h-3.5 w-3.5" />
                    ) : lowerId.includes('day') || lowerId.includes('dia') ? (
                      <Sun className="h-3.5 w-3.5" />
                    ) : (
                      <Layers className="h-3.5 w-3.5" />
                    );
                  return (
                    <NeonButton
                      key={tileSet.id}
                      size="sm"
                      variant="glass"
                      active={isActive}
                      onClick={() =>
                        setTileSetByLayer((prev) => ({
                          ...prev,
                          [activeLayer.id]: tileSet.id,
                        }))
                      }
                      leftIcon={icon}
                    >
                      {tileSet.label}
                    </NeonButton>
                  );
                })}
              </div>
            </GlassPanel>
          )}

          {/* Dynamic Guided 100% Route Generator Trigger */}
          {layerMarkers.length > 0 && (
            <GlassPanel variant="elevated" padding="none">
              <div className="px-1.5 py-1.5 md:px-2 md:py-2">
                <NeonButton
                  size="sm"
                  variant="glass"
                  active={isGuideOpen}
                  onClick={handleToggleGuideMode}
                  leftIcon={
                    <Compass className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  }
                >
                  <span className="hidden sm:inline">{t('map.guide100')}</span>
                  <span className="sm:hidden">Guia</span>
                </NeonButton>
              </div>
            </GlassPanel>
          )}

          {/* Layer / Map Switcher with DLC & Interior Badges */}
          <MapLayerSwitcher
            maps={manifest.maps}
            activeLayerId={activeLayer?.id}
            dlcsById={dlcsById}
            onSelectLayer={handleSelectLayer}
          />
        </div>
      </header>

      {/* ================================================================= */}
      {/* RETRACTABLE LEFT SIDEBAR (MOBILE FULL DRAWER + DESKTOP FLOATING)  */}
      {/* ================================================================= */}
      <aside
        className={
          isSidebarOpen
            ? 'fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:pointer-events-none md:inset-auto md:top-20 md:bottom-4 md:left-4 md:z-20 md:bg-transparent md:backdrop-blur-none'
            : 'pointer-events-none fixed top-24 left-2.5 z-20 flex items-start gap-2.5 md:top-20 md:left-4'
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsSidebarOpen(false);
          }
        }}
      >
        {isSidebarOpen ? (
          <GlassPanel
            variant="elevated"
            padding="none"
            cornerMarks
            className="pointer-events-auto flex h-full w-[min(90vw,344px)] flex-col !bg-[#07090f]/95 md:max-h-full md:w-[316px] md:!bg-[var(--glass-bg-elevated)] sm:w-[344px]"
          >
            {/* Sidebar Header Banner + Active Scope Progress */}
            <div className="relative">
              <GameCoverArt
                title={manifest.title}
                imageUrl={manifest.assets.bannerImage ?? manifest.assets.coverImage}
                theme={activeTheme}
                heightClassName="h-28"
                showMetadataWatermark={false}
              />

              {/* Mobile-only Language Selector inside drawer */}
              <div className="absolute top-2.5 left-2.5 md:hidden">
                <LanguageSelector />
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Recolher painel lateral"
                title="Recolher painel lateral"
                className="neon-focus-ring absolute top-2.5 right-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/20 bg-[rgba(7,9,13,0.85)] text-white backdrop-blur-md transition-colors hover:border-[var(--accent-primary)] md:h-7 md:w-7 md:border-white/15 md:bg-[rgba(7,9,13,0.75)] md:text-[var(--text-secondary)] md:hover:text-white"
              >
                <X className="h-4 w-4 md:hidden" />
                <PanelLeftClose className="hidden h-4 w-4 md:block" />
              </button>

              <div className="absolute right-3 bottom-2.5 left-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-white/95">
                    {activeLayer?.name}
                    {selectedDlcFilter !== 'all' && dlcsById[selectedDlcFilter]
                      ? ` · ${dlcsById[selectedDlcFilter].shortLabel ?? dlcsById[selectedDlcFilter].name}`
                      : ''}
                  </span>
                  <GlassBadge variant="accent" badgeStyle={badgeStyle} size="sm">
                    {layerStats.foundInScope}/{dlcScopedMarkers.length} ·{' '}
                    {layerStats.scopePercent}%
                  </GlassBadge>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${layerStats.scopePercent}%`,
                      backgroundColor: 'var(--accent-primary)',
                      boxShadow:
                        layerStats.scopePercent > 0
                          ? '0 0 10px var(--accent-glow)'
                          : 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
              {/* DLC Filter Strip (separates Base Game vs DLCs) */}
              {availableLayerDlcs.length > 1 && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t('map.dlcSection')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <NeonButton
                      size="sm"
                      variant="glass"
                      active={selectedDlcFilter === 'all'}
                      onClick={() => setSelectedDlcFilter('all')}
                    >
                      {t('map.all')} ({layerMarkers.length})
                    </NeonButton>
                    {availableLayerDlcs.map((dlc) => {
                      const count = layerMarkers.filter(
                        (m) => (m.dlc ?? 'base') === dlc.id
                      ).length;
                      return (
                        <NeonButton
                          key={dlc.id}
                          size="sm"
                          variant="glass"
                          active={selectedDlcFilter === dlc.id}
                          onClick={() => setSelectedDlcFilter(dlc.id)}
                        >
                          <span>{dlc.shortLabel ?? dlc.name}</span>
                          <span className="ml-1 font-mono text-[10px] opacity-70">
                            {count}
                          </span>
                        </NeonButton>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instant Pin Search */}
              <GlassInput
                inputRef={searchInputRef}
                value={pinSearchQuery}
                onChange={(e) => setPinSearchQuery(e.target.value)}
                placeholder={t('map.searchPins')}
                aria-label={t('map.searchPins')}
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
                    <span>
                      {t('map.results')} ({filteredMarkers.length})
                    </span>
                    <span>{t('map.center')}</span>
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
                                {resolveMarkerTitle(marker)}
                              </span>
                            </span>
                            <Navigation className="h-3 w-3 shrink-0 text-[var(--accent-primary)] opacity-80" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-1 py-2 text-center text-xs text-[var(--text-muted)]">
                      {t('map.noResults')}
                    </p>
                  )}
                </div>
              )}

              {/* Quick Presets */}
              {manifest.presets && manifest.presets.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t('map.presets')}
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
                  {t('map.showAll')}
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  onClick={() => setAllCategories(false)}
                  leftIcon={<EyeOff className="h-3 w-3" />}
                >
                  {t('map.hideAll')}
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  active={hideFound}
                  onClick={() => setHideFound((prev) => !prev)}
                  leftIcon={<CheckCircle2 className="h-3 w-3" />}
                >
                  {hideFound ? t('map.pendingOnly') : t('map.hideFound')}
                </NeonButton>
                <NeonButton
                  size="sm"
                  variant="glass"
                  active={clusteringEnabled}
                  onClick={() => setClusteringEnabled((prev) => !prev)}
                  leftIcon={<Grid2x2 className="h-3 w-3" />}
                >
                  {clusteringEnabled ? t('map.clusterOn') : t('map.clusterOff')}
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
                                    {renderCategoryIcon(category)}
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
                      {t('map.personalNotes')} ({notes.length})
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
                    {t('map.export')}
                  </NeonButton>
                  <NeonButton
                    size="sm"
                    variant="glass"
                    onClick={() => importInputRef.current?.click()}
                    leftIcon={<Upload className="h-3 w-3" />}
                  >
                    {t('map.import')}
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
              className="neon-focus-ring flex h-10 cursor-pointer items-center justify-center gap-2 px-3 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-primary)] md:w-10 md:px-0"
            >
              <PanelLeftOpen className="h-4 w-4 text-[var(--accent-primary)] md:h-4.5 md:w-4.5 md:text-current" />
              <span className="md:hidden">Filtros</span>
            </button>
          </GlassPanel>
        )}
      </aside>

      {/* ================================================================= */}
      {/* FLOATING RIGHT PANEL: MARKER CARD, NOTE EDITOR OR GUIDED MODE     */}
      {/* ================================================================= */}
      {showRightPanel && (
        <div className="pointer-events-none fixed inset-x-3 top-24 bottom-20 z-40 overflow-y-auto md:inset-x-auto md:top-20 md:right-4 md:bottom-auto md:z-30 md:overflow-visible">
          <div className="pointer-events-auto">
            {selectedMarker ? (
              <MarkerDetailCard
                key={selectedMarker.id}
                marker={selectedMarker}
                category={categoriesById[selectedMarker.category]}
                isFound={foundMarkerIds.has(selectedMarker.id)}
                checkedChecklistKeys={checkedChecklistKeys}
                contributions={contributionsByMarker[selectedMarker.id] ?? []}
                linkedMapName={
                  selectedMarker.linkedMapId
                    ? manifest.maps.find(
                        (m) => m.id === selectedMarker.linkedMapId
                      )?.name
                    : undefined
                }
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
                onAddContribution={async (data) => {
                  await saveUserContribution({
                    gameSlug: manifest.slug,
                    markerId: selectedMarker.id,
                    imageDataUrl: data.imageDataUrl,
                    requirementNote: data.requirementNote,
                  });
                  showToast('Contribuição salva no IndexedDB.');
                }}
                onDeleteContribution={async (id) => {
                  await deleteUserContribution(id);
                  showToast('Contribuição removida.');
                }}
                onEnterLinkedMap={(linkedMapId) =>
                  handleSelectLayer(linkedMapId)
                }
                onClose={() => setSelectedMarker(null)}
              />
            ) : selectedNote || draftNoteCoords ? (
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
            ) : isGuideOpen ? (
              <GuidedRoutePanel
                routeResult={generatedRoute}
                activeStepIndex={activeGuideStepIndex}
                foundMarkerIds={foundMarkerIds}
                categoriesById={categoriesById}
                scope={guideScope}
                onChangeScope={(nextScope) => {
                  setGuideScope(nextScope);
                  runRouteGenerator({ scope: nextScope });
                }}
                focus={guideFocus}
                onChangeFocus={(nextFocus) => {
                  setGuideFocus(nextFocus);
                  runRouteGenerator({ focus: nextFocus });
                }}
                startMode={guideStartMode}
                onChangeStartMode={(nextMode) => {
                  setGuideStartMode(nextMode);
                  setInteractionMode('explore');
                  runRouteGenerator({ startMode: nextMode });
                }}
                isPickingStartOnMap={interactionMode === 'pick-guide-start'}
                onPickStartOnMap={() => {
                  setInteractionMode(
                    interactionMode === 'pick-guide-start'
                      ? 'explore'
                      : 'pick-guide-start'
                  );
                }}
                hasLivePlayer={Boolean(telemetry.player)}
                respectVisibleCategories={guideRespectFilters}
                onToggleRespectVisibleCategories={() => {
                  const next = !guideRespectFilters;
                  setGuideRespectFilters(next);
                  runRouteGenerator({ respectVisibleCategories: next });
                }}
                onGenerateRoute={() => runRouteGenerator()}
                onSelectStep={handleSelectGuideStep}
                onPreviousStep={() =>
                  handleSelectGuideStep(activeGuideStepIndex - 1)
                }
                onCompleteAndNext={() => void handleCompleteAndNextGuideStep()}
                onFocusCurrentStep={() =>
                  handleSelectGuideStep(activeGuideStepIndex)
                }
                onClose={() => {
                  setIsGuideOpen(false);
                  if (interactionMode === 'pick-guide-start') {
                    setInteractionMode('explore');
                  }
                }}
              />
            ) : null}
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
      {/* BOTTOM-RIGHT TACTICAL HUD: LIVE TELEMETRY + ZOOM + COORDS         */}
      {/* ================================================================= */}
      <div className="pointer-events-none fixed right-3 bottom-20 z-20 flex flex-col items-end gap-2.5 md:right-4 md:bottom-4">
        <div className="hidden md:block">
          <LiveTelemetryWidget telemetry={telemetry} />
        </div>

        <div className="flex items-end gap-2.5">
          <GlassPanel variant="elevated" padding="none" className="pointer-events-auto hidden md:block">
            <button
              type="button"
              onClick={() => {
                const isGeo = activeLayer?.crs === 'epsg3857';
                const formatted = isGeo
                  ? `[${cursorCoords.y.toFixed(4)}, ${cursorCoords.x.toFixed(4)}]`
                  : `[${cursorCoords.x.toFixed(1)}, ${cursorCoords.y.toFixed(1)}]`;
                void navigator.clipboard?.writeText(formatted);
                showToast(`Coordenada copiada: ${formatted}`);
              }}
              title="Clique para copiar a coordenada atual (ou pressione C)"
              className="group flex cursor-pointer items-center gap-3 px-3 py-1.5 font-mono text-[11px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {activeLayer?.crs === 'epsg3857' ? (
                <>
                  <span>
                    Lat:{' '}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      {cursorCoords.y.toFixed(4)}
                    </strong>
                  </span>
                  <span className="text-white/20">|</span>
                  <span>
                    Lng:{' '}
                    <strong className="font-semibold text-[var(--text-primary)]">
                      {cursorCoords.x.toFixed(4)}
                    </strong>
                  </span>
                </>
              ) : (
                <>
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
                </>
              )}
              <span className="text-white/20">|</span>
              <span>
                Z:{' '}
                <strong className="font-semibold text-[var(--accent-primary)]">
                  {zoomLevel.toFixed(2)}
                </strong>
              </span>
              <Copy className="h-3 w-3 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-primary)]" />
            </button>
          </GlassPanel>

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
        </div>
      </div>
    </div>
  );
}
