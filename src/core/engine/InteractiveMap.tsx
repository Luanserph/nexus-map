import L from 'leaflet';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import type {
  Category,
  CustomRouteRecord,
  GameMapLayer,
  GameTheme,
  LivePlayerTelemetry,
  MapInteractionMode,
  MapMarker,
  MapRegion,
  UserNoteRecord,
} from '../../types/schema';
import { decodeHtmlEntities } from '../utils/text';
import { resolveTileUrlTemplate } from '../utils/assets';
import { createTacticalTileLayer } from './createFallbackTileLayer';
import {
  createCategoryPinIcon,
  createClusterPinIcon,
  createGuidedStepIcon,
  createLivePlayerIcon,
  createPersonalNoteIcon,
  createRouteVertexIcon,
} from './markerIcons';

export interface ActiveGuidedRouteOverlay {
  color: string;
  activeStepIndex: number;
  steps: Array<{
    stepNumber: number;
    marker: MapMarker;
  }>;
}

export interface InteractiveMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  flyToMarker: (marker: MapMarker) => void;
  flyToCoords: (coords: [number, number]) => void;
}

export interface InteractiveMapProps {
  mapLayer: GameMapLayer;
  activeTileSetId?: string;
  regions?: MapRegion[];
  theme: GameTheme;
  markers: MapMarker[];
  categoriesById: Record<string, Category>;
  foundMarkerIds: Set<string>;
  selectedMarkerId?: string | null;
  onSelectMarker: (marker: MapMarker) => void;
  clusteringEnabled?: boolean;
  guidedRoute?: ActiveGuidedRouteOverlay | null;
  onSelectGuidedStep?: (stepIndex: number) => void;
  livePlayer?: LivePlayerTelemetry | null;
  followLivePlayer?: boolean;
  userNotes: UserNoteRecord[];
  selectedNoteId?: string | null;
  onSelectNote: (note: UserNoteRecord) => void;
  routes: CustomRouteRecord[];
  hiddenRouteIds: Set<string>;
  draftRoutePoints: [number, number][];
  draftRouteColor: string;
  interactionMode: MapInteractionMode;
  onMapClick?: (coords: [number, number]) => void;
  onCursorMove?: (coords: { x: number; y: number }) => void;
  onZoomChange?: (zoom: number) => void;
  mapRef?: Ref<InteractiveMapHandle>;
}

function escapeHtml(raw: string): string {
  return decodeHtmlEntities(raw)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CLUSTER_CELL_PX = 44;

export function InteractiveMap({
  mapLayer,
  activeTileSetId,
  regions = [],
  theme,
  markers,
  categoriesById,
  foundMarkerIds,
  selectedMarkerId,
  onSelectMarker,
  clusteringEnabled = true,
  guidedRoute = null,
  onSelectGuidedStep,
  livePlayer = null,
  followLivePlayer = false,
  userNotes,
  selectedNoteId,
  onSelectNote,
  routes,
  hiddenRouteIds,
  draftRoutePoints,
  draftRouteColor,
  interactionMode,
  onMapClick,
  onCursorMove,
  onZoomChange,
  mapRef,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.GridLayer | null>(null);
  const regionsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const chunkRafRef = useRef<number | null>(null);
  const notesLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const guidedLayerRef = useRef<L.LayerGroup | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);

  const onCursorMoveRef = useRef(onCursorMove);
  const onZoomChangeRef = useRef(onZoomChange);
  const onMapClickRef = useRef(onMapClick);
  const onSelectMarkerRef = useRef(onSelectMarker);
  const onSelectNoteRef = useRef(onSelectNote);
  const onSelectGuidedStepRef = useRef(onSelectGuidedStep);
  const interactionModeRef = useRef(interactionMode);

  useEffect(() => {
    onCursorMoveRef.current = onCursorMove;
    onZoomChangeRef.current = onZoomChange;
    onMapClickRef.current = onMapClick;
    onSelectMarkerRef.current = onSelectMarker;
    onSelectNoteRef.current = onSelectNote;
    onSelectGuidedStepRef.current = onSelectGuidedStep;
    interactionModeRef.current = interactionMode;
  }, [
    onCursorMove,
    onZoomChange,
    onMapClick,
    onSelectMarker,
    onSelectNote,
    onSelectGuidedStep,
    interactionMode,
  ]);

  const crsType = mapLayer.crs ?? 'simple';

  const activeTileSet = useMemo(() => {
    const sets = mapLayer.tileSets;
    if (!sets || sets.length === 0) return null;
    if (activeTileSetId) {
      return sets.find((s) => s.id === activeTileSetId) ?? sets[0];
    }
    return sets[0];
  }, [mapLayer.tileSets, activeTileSetId]);

  const resolvedBounds = useMemo(() => {
    if (mapLayer.maxBounds) {
      return L.latLngBounds(mapLayer.maxBounds[0], mapLayer.maxBounds[1]);
    }
    if (activeTileSet?.tileBounds) {
      return L.latLngBounds(
        activeTileSet.tileBounds[0],
        activeTileSet.tileBounds[1]
      );
    }
    const [minX, minY, maxX, maxY] = mapLayer.bounds ?? [0, 0, 1024, 1024];
    return L.latLngBounds(L.latLng(minY, minX), L.latLng(maxY, maxX));
  }, [mapLayer.maxBounds, mapLayer.bounds, activeTileSet]);

  const resolvedTileBounds = useMemo(() => {
    if (activeTileSet?.tileBounds) {
      return L.latLngBounds(
        activeTileSet.tileBounds[0],
        activeTileSet.tileBounds[1]
      );
    }
    return resolvedBounds;
  }, [activeTileSet, resolvedBounds]);

  const resolvedCenter = useMemo(() => {
    if (mapLayer.initialCenter) {
      return L.latLng(mapLayer.initialCenter[0], mapLayer.initialCenter[1]);
    }
    const [cx, cy] = mapLayer.defaultCenter ?? [512, 512];
    return L.latLng(cy, cx);
  }, [mapLayer.initialCenter, mapLayer.defaultCenter]);

  const effectiveMinZoom = activeTileSet
    ? activeTileSet.minZoom
    : Math.min(0, mapLayer.minZoom ?? 0);
  const nativeMaxZoom = activeTileSet
    ? activeTileSet.maxNativeZoom
    : (mapLayer.maxZoom ?? 4);
  const overzoomMaxZoom = activeTileSet
    ? activeTileSet.maxZoom
    : nativeMaxZoom + 3;
  const defaultZoom = mapLayer.initialZoom ?? mapLayer.defaultZoom ?? 0;
  const resolvedBgColor =
    activeTileSet?.backgroundColor ?? mapLayer.backgroundColor ?? theme.surfaceBase;

  /**
   * High-performance renderer for 500-1,000+ pins:
   * 1. Viewport culling (only processes markers inside padded viewport bounds).
   * 2. Optional O(N) screen-space grid clustering (disabled at >= nativeMaxZoom so overzoom exposes every pin cleanly).
   */
  const renderVisibleMarkers = useCallback(() => {
    const map = leafletMapRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    if (chunkRafRef.current !== null) {
      cancelAnimationFrame(chunkRafRef.current);
      chunkRafRef.current = null;
    }

    group.clearLayers();

    const paddedBounds = map.getBounds().pad(0.25);
    const currentZoom = map.getZoom();

    // Render discrete zoom-aware region labels
    const regGroup = regionsLayerRef.current;
    if (regGroup) {
      regGroup.clearLayers();
      if (regions.length > 0 && currentZoom >= 9.5) {
        const MAJOR_TITLES = new Set([
          'Vice City',
          'Vice Beach',
          'Gellhorn',
          'Port Gellhorn',
          'Ambrosia',
          'Grassrivers',
          'Kalaga National Park',
          'Mount Kalaga',
          'Key Lento',
          'Ocean Beach',
          'Starfish Island',
          'VCIA',
          'Hamlet',
          'Watson Bay',
          'Downtown',
          'Little Cuba',
          'Mariana County',
          'Vice-Dale County',
          'Kelly County',
          'Leonard County',
          'Lummox County',
        ]);
        for (const region of regions) {
          if (region.parentRegionId === null) continue;
          const isMajor = MAJOR_TITLES.has(region.title);
          if (!isMajor && currentZoom < 12.25) continue;
          const pos = L.latLng(region.centerY, region.centerX);
          if (!paddedBounds.contains(pos)) continue;

          L.marker(pos, {
            interactive: false,
            keyboard: false,
            zIndexOffset: -500,
            icon: L.divIcon({
              className: 'nexus-region-label-wrapper',
              html: `<span class="nexus-region-label ${
                isMajor ? 'nexus-region-label--major' : 'nexus-region-label--sub'
              }">${escapeHtml(region.title)}</span>`,
              iconSize: [0, 0],
            }),
          }).addTo(regGroup);
        }
      }
    }

    const disableClusteringAtZoom = nativeMaxZoom;
    const shouldCluster =
      clusteringEnabled &&
      markers.length > 40 &&
      currentZoom < disableClusteringAtZoom;

    // Step 1: Viewport culling
    const visibleInViewport: MapMarker[] = [];
    for (const marker of markers) {
      const [x, y] = marker.coords;
      if (
        selectedMarkerId === marker.id ||
        paddedBounds.contains(L.latLng(y, x))
      ) {
        visibleInViewport.push(marker);
      }
    }

    const buildPinLayer = (marker: MapMarker): L.Marker => {
      const category = categoriesById[marker.category];
      const [x, y] = marker.coords;
      const isFound = foundMarkerIds.has(marker.id);
      const isSelected = selectedMarkerId === marker.id;

      const leafletMarker = L.marker(L.latLng(y, x), {
        icon: createCategoryPinIcon(category, isFound, isSelected),
        title: marker.title,
      });

      const foundSuffix = isFound ? ' · Encontrado' : '';
      leafletMarker.bindTooltip(
        `<span class="nexus-tooltip-title">${escapeHtml(marker.title)}${foundSuffix}</span>`,
        {
          direction: 'top',
          offset: L.point(0, -14),
          className: 'nexus-leaflet-tooltip',
          opacity: 1,
        }
      );

      leafletMarker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectMarkerRef.current(marker);
      });

      return leafletMarker;
    };

    // Chunked loading helper (keeps 2,690+ markers smooth at 60fps during pan/zoom)
    const addInChunks = (items: Array<() => L.Layer>) => {
      const CHUNK_SIZE = 160;
      if (items.length <= CHUNK_SIZE) {
        for (const create of items) {
          create().addTo(group);
        }
        return;
      }

      let cursor = 0;
      const step = () => {
        const end = Math.min(cursor + CHUNK_SIZE, items.length);
        for (; cursor < end; cursor++) {
          items[cursor]().addTo(group);
        }
        if (cursor < items.length) {
          chunkRafRef.current = requestAnimationFrame(step);
        } else {
          chunkRafRef.current = null;
        }
      };
      step();
    };

    if (!shouldCluster) {
      addInChunks(visibleInViewport.map((m) => () => buildPinLayer(m)));
      return;
    }

    // Step 2: Fast O(N) screen-space spatial grid clustering
    const buckets = new Map<string, MapMarker[]>();
    for (const marker of visibleInViewport) {
      if (selectedMarkerId === marker.id) {
        buckets.set(`selected:${marker.id}`, [marker]);
        continue;
      }

      const [x, y] = marker.coords;
      const pt = map.latLngToContainerPoint(L.latLng(y, x));
      const cellKey = `${Math.floor(pt.x / CLUSTER_CELL_PX)}:${Math.floor(pt.y / CLUSTER_CELL_PX)}`;
      const bucket = buckets.get(cellKey);
      if (bucket) {
        bucket.push(marker);
      } else {
        buckets.set(cellKey, [marker]);
      }
    }

    const renderQueue: Array<() => L.Layer> = [];
    for (const bucket of buckets.values()) {
      if (bucket.length === 1) {
        const marker = bucket[0];
        renderQueue.push(() => buildPinLayer(marker));
      } else {
        renderQueue.push(() => {
          let sumX = 0;
          let sumY = 0;
          for (const m of bucket) {
            sumX += m.coords[0];
            sumY += m.coords[1];
          }
          const avgX = sumX / bucket.length;
          const avgY = sumY / bucket.length;
          const centerLatLng = L.latLng(avgY, avgX);

          const clusterMarker = L.marker(centerLatLng, {
            icon: createClusterPinIcon(bucket.length),
            title: `${bucket.length} marcadores`,
          });

          clusterMarker.bindTooltip(
            `<span class="nexus-tooltip-title">${bucket.length} marcadores (clique para aproximar)</span>`,
            {
              direction: 'top',
              offset: L.point(0, -16),
              className: 'nexus-leaflet-tooltip',
              opacity: 1,
            }
          );

          clusterMarker.on('click', (event) => {
            L.DomEvent.stopPropagation(event);
            map.flyTo(
              centerLatLng,
              Math.min(overzoomMaxZoom, map.getZoom() + 1.25),
              {
                duration: 0.35,
              }
            );
          });

          return clusterMarker;
        });
      }
    }

    addInChunks(renderQueue);
  }, [
    markers,
    regions,
    categoriesById,
    foundMarkerIds,
    selectedMarkerId,
    clusteringEnabled,
    nativeMaxZoom,
    overzoomMaxZoom,
  ]);

  const renderVisibleMarkersRef = useRef(renderVisibleMarkers);
  useEffect(() => {
    renderVisibleMarkersRef.current = renderVisibleMarkers;
  }, [renderVisibleMarkers]);

  // 1. Initialize Leaflet instance (supports both L.CRS.Simple and L.CRS.EPSG3857)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const leafletCrs =
      crsType === 'epsg3857' ? L.CRS.EPSG3857 : L.CRS.Simple;
    const coordPrecision = crsType === 'epsg3857' ? 100000 : 10;

    const map = L.map(container, {
      crs: leafletCrs,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false,
      minZoom: effectiveMinZoom,
      maxZoom: overzoomMaxZoom,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxBounds: resolvedBounds.pad(crsType === 'epsg3857' ? 0.15 : 0.25),
      maxBoundsViscosity: 0.85,
      center: resolvedCenter,
      zoom: defaultZoom,
    });

    const regionsGroup = L.layerGroup().addTo(map);
    const routesGroup = L.layerGroup().addTo(map);
    const guidedGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    const notesGroup = L.layerGroup().addTo(map);

    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      onCursorMoveRef.current?.({
        x: Math.round(event.latlng.lng * coordPrecision) / coordPrecision,
        y: Math.round(event.latlng.lat * coordPrecision) / coordPrecision,
      });
    });

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (interactionModeRef.current !== 'explore') {
        const coords: [number, number] = [
          Math.round(event.latlng.lng * coordPrecision) / coordPrecision,
          Math.round(event.latlng.lat * coordPrecision) / coordPrecision,
        ];
        onMapClickRef.current?.(coords);
      }
    });

    map.on('zoomend', () => {
      onZoomChangeRef.current?.(map.getZoom());
      renderVisibleMarkersRef.current();
    });

    map.on('moveend', () => {
      renderVisibleMarkersRef.current();
    });

    leafletMapRef.current = map;
    regionsLayerRef.current = regionsGroup;
    routesLayerRef.current = routesGroup;
    guidedLayerRef.current = guidedGroup;
    markersLayerRef.current = markerGroup;
    notesLayerRef.current = notesGroup;
    onZoomChangeRef.current?.(map.getZoom());

    return () => {
      if (chunkRafRef.current !== null) {
        cancelAnimationFrame(chunkRafRef.current);
        chunkRafRef.current = null;
      }
      map.off();
      regionsLayerRef.current?.clearLayers();
      markersLayerRef.current?.clearLayers();
      notesLayerRef.current?.clearLayers();
      routesLayerRef.current?.clearLayers();
      guidedLayerRef.current?.clearLayers();
      playerMarkerRef.current?.remove();
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      regionsLayerRef.current = null;
      markersLayerRef.current = null;
      notesLayerRef.current = null;
      routesLayerRef.current = null;
      guidedLayerRef.current = null;
      playerMarkerRef.current = null;
    };
    // Re-initialize Leaflet only if the CRS projection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crsType]);

  // Keep track of previous mapLayer.id so switching Day/Night tileSets preserves camera position
  const prevMapIdRef = useRef<string | null>(null);

  // 2. Swap active tile/fallback layer & update bounds smoothly on layer, tileSet, or theme change
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const isSameLayer = prevMapIdRef.current === mapLayer.id;
    prevMapIdRef.current = mapLayer.id;

    if (!isSameLayer) {
      // Clear previous layer overlays immediately so stale pins never flash across layers
      markersLayerRef.current?.clearLayers();
      guidedLayerRef.current?.clearLayers();
    }

    map.setMinZoom(effectiveMinZoom);
    map.setMaxZoom(overzoomMaxZoom);
    map.setMaxBounds(
      resolvedBounds.pad(crsType === 'epsg3857' ? 0.15 : 0.25)
    );

    const rawTemplate = activeTileSet?.urlTemplate ?? mapLayer.tileUrlTemplate;
    const resolvedTemplate = resolveTileUrlTemplate(rawTemplate);

    // Use native L.tileLayer for external URLs or multi-tileset layers (supports {z}/{y}/{x}, tileBounds, and avoids CORS canvas tainting)
    const useNativeTileLayer =
      Boolean(activeTileSet) ||
      Boolean(resolvedTemplate && /^https?:\/\//i.test(resolvedTemplate));

    const nextTileLayer: L.GridLayer =
      useNativeTileLayer && resolvedTemplate
        ? L.tileLayer(resolvedTemplate, {
            bounds: resolvedTileBounds,
            minZoom: effectiveMinZoom,
            maxNativeZoom: nativeMaxZoom,
            maxZoom: overzoomMaxZoom,
            noWrap: true,
            keepBuffer: 2,
          })
        : createTacticalTileLayer({
            tileUrlTemplate: resolvedTemplate,
            theme,
            mapId: mapLayer.id,
            bounds: resolvedTileBounds,
            minZoom: effectiveMinZoom,
            maxNativeZoom: nativeMaxZoom,
            maxZoom: overzoomMaxZoom,
          });

    nextTileLayer.addTo(map);
    tileLayerRef.current = nextTileLayer;

    if (!isSameLayer) {
      map.setView(resolvedCenter, defaultZoom, { animate: true, duration: 0.35 });
      onZoomChangeRef.current?.(defaultZoom);
    }
    renderVisibleMarkersRef.current();
  }, [
    crsType,
    mapLayer.id,
    mapLayer.tileUrlTemplate,
    activeTileSet,
    theme,
    resolvedBounds,
    resolvedTileBounds,
    resolvedCenter,
    effectiveMinZoom,
    nativeMaxZoom,
    overzoomMaxZoom,
    defaultZoom,
  ]);

  // 3. Re-render culled/clustered markers when filters, found states, or clustering change
  useEffect(() => {
    renderVisibleMarkers();
  }, [renderVisibleMarkers]);

  // 4. Render personal user notes
  useEffect(() => {
    const group = notesLayerRef.current;
    if (!group) return;

    group.clearLayers();

    for (const note of userNotes) {
      const [x, y] = note.coords;
      const isSelected = selectedNoteId === note.id;

      const noteMarker = L.marker(L.latLng(y, x), {
        icon: createPersonalNoteIcon(isSelected),
        title: note.title,
      });

      noteMarker.bindTooltip(
        `<span class="nexus-tooltip-title">Nota: ${escapeHtml(note.title)}</span>`,
        {
          direction: 'top',
          offset: L.point(0, -14),
          className: 'nexus-leaflet-tooltip',
          opacity: 1,
        }
      );

      noteMarker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectNoteRef.current(note);
      });

      noteMarker.addTo(group);
    }
  }, [userNotes, selectedNoteId]);

  // 5. Render saved neon routes + live draft route polyline
  useEffect(() => {
    const group = routesLayerRef.current;
    if (!group) return;

    group.clearLayers();

    for (const route of routes) {
      if (hiddenRouteIds.has(route.id) || route.points.length < 2) continue;

      const latLngs = route.points.map(([x, y]) => L.latLng(y, x));

      L.polyline(latLngs, {
        color: route.color,
        weight: 8,
        opacity: 0.22,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group);

      const line = L.polyline(latLngs, {
        color: route.color,
        weight: 2.5,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      });

      line.bindTooltip(
        `<span class="nexus-tooltip-title">Rota: ${escapeHtml(route.name)} (${route.points.length} pts)</span>`,
        {
          sticky: true,
          className: 'nexus-leaflet-tooltip',
          opacity: 1,
        }
      );

      line.addTo(group);
    }

    if (draftRoutePoints.length > 0) {
      const draftLatLngs = draftRoutePoints.map(([x, y]) => L.latLng(y, x));

      if (draftLatLngs.length >= 2) {
        L.polyline(draftLatLngs, {
          color: draftRouteColor,
          weight: 8,
          opacity: 0.24,
          interactive: false,
        }).addTo(group);

        L.polyline(draftLatLngs, {
          color: draftRouteColor,
          weight: 2.5,
          opacity: 0.95,
          dashArray: '6 6',
          interactive: false,
        }).addTo(group);
      }

      draftRoutePoints.forEach(([x, y], idx) => {
        L.marker(L.latLng(y, x), {
          icon: createRouteVertexIcon(draftRouteColor, idx),
          interactive: false,
        }).addTo(group);
      });
    }
  }, [routes, hiddenRouteIds, draftRoutePoints, draftRouteColor]);

  // 6. Render Dynamic Guided 100% Route:
  //    - Subtle full path polyline (zero visual clutter even with 400+ steps)
  //    - High-glow highlighted segment for the next 5 steps + numbered beacons
  useEffect(() => {
    const group = guidedLayerRef.current;
    if (!group) return;

    group.clearLayers();
    if (!guidedRoute || guidedRoute.steps.length === 0) return;

    const allLatLngs = guidedRoute.steps.map(({ marker }) =>
      L.latLng(marker.coords[1], marker.coords[0])
    );

    // Subtle full-route line across the entire 100% path
    if (allLatLngs.length >= 2) {
      L.polyline(allLatLngs, {
        color: guidedRoute.color,
        weight: 2,
        opacity: 0.2,
        dashArray: '4 8',
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group);
    }

    // Highlighted window: current step + next 5 steps
    const startIdx = Math.max(
      0,
      Math.min(guidedRoute.activeStepIndex, guidedRoute.steps.length - 1)
    );
    const windowEnd = Math.min(guidedRoute.steps.length, startIdx + 6);
    const windowSteps = guidedRoute.steps.slice(startIdx, windowEnd);
    const windowLatLngs = windowSteps.map(({ marker }) =>
      L.latLng(marker.coords[1], marker.coords[0])
    );

    if (windowLatLngs.length >= 2) {
      // High-glow ambient outer stroke
      L.polyline(windowLatLngs, {
        color: guidedRoute.color,
        weight: 10,
        opacity: 0.28,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group);

      // Crisp bright core line for the next 5 steps
      L.polyline(windowLatLngs, {
        color: guidedRoute.color,
        weight: 3.5,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(group);
    }

    // Render numbered beacons only for the active window (current + next 5)
    windowSteps.forEach((step, offset) => {
      const absoluteIdx = startIdx + offset;
      const isActive = offset === 0;
      const isDone = foundMarkerIds.has(step.marker.id);

      const stepMarker = L.marker(
        L.latLng(step.marker.coords[1], step.marker.coords[0]),
        {
          icon: createGuidedStepIcon(
            step.stepNumber,
            isActive,
            isDone,
            guidedRoute.color
          ),
          zIndexOffset: isActive ? 950 : 500 - offset * 10,
        }
      );

      stepMarker.bindTooltip(
        `<span class="nexus-tooltip-title">Passo ${step.stepNumber}: ${escapeHtml(step.marker.title)}</span>`,
        {
          direction: 'top',
          offset: L.point(0, -16),
          className: 'nexus-leaflet-tooltip',
          opacity: 1,
        }
      );

      stepMarker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectGuidedStepRef.current?.(absoluteIdx);
      });

      stepMarker.addTo(group);
    });
  }, [guidedRoute, foundMarkerIds]);

  // 7. Render Live Telemetry Player directional arrow (60 FPS smooth update)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (!livePlayer || livePlayer.mapId !== mapLayer.id) {
      if (playerMarkerRef.current) {
        map.removeLayer(playerMarkerRef.current);
        playerMarkerRef.current = null;
      }
      return;
    }

    const nextLatLng = L.latLng(livePlayer.y, livePlayer.x);

    if (!playerMarkerRef.current) {
      const marker = L.marker(nextLatLng, {
        icon: createLivePlayerIcon(livePlayer.heading),
        zIndexOffset: 1200,
        interactive: false,
      }).addTo(map);
      playerMarkerRef.current = marker;
    } else {
      playerMarkerRef.current.setLatLng(nextLatLng);
      const el = playerMarkerRef.current.getElement();
      const rotator = el?.querySelector<HTMLElement>('.nexus-player-rotator');
      if (rotator) {
        rotator.style.transform = `rotate(${livePlayer.heading}deg)`;
      }
    }

    if (followLivePlayer) {
      map.panTo(nextLatLng, { animate: true, duration: 0.25, noMoveStart: true });
    }
  }, [livePlayer, followLivePlayer, mapLayer.id]);

  // 8. Expose imperative controls to MapWorkspace HUD
  useImperativeHandle(
    mapRef,
    () => ({
      zoomIn: () => {
        leafletMapRef.current?.zoomIn(0.5);
      },
      zoomOut: () => {
        leafletMapRef.current?.zoomOut(0.5);
      },
      resetView: () => {
        leafletMapRef.current?.setView(resolvedCenter, defaultZoom, {
          animate: true,
          duration: 0.35,
        });
      },
      flyToMarker: (marker: MapMarker) => {
        const map = leafletMapRef.current;
        if (!map) return;
        const [x, y] = marker.coords;
        const targetZoom =
          crsType === 'epsg3857'
            ? Math.min(overzoomMaxZoom, Math.max(map.getZoom(), defaultZoom + 3))
            : Math.min(overzoomMaxZoom, Math.max(map.getZoom(), nativeMaxZoom + 0.5));
        map.flyTo(L.latLng(y, x), targetZoom, {
          duration: 0.45,
        });
      },
      flyToCoords: (coords: [number, number]) => {
        const map = leafletMapRef.current;
        if (!map) return;
        const [x, y] = coords;
        const targetZoom =
          crsType === 'epsg3857'
            ? Math.min(overzoomMaxZoom, Math.max(map.getZoom(), defaultZoom + 3))
            : Math.min(overzoomMaxZoom, Math.max(map.getZoom(), nativeMaxZoom + 0.5));
        map.flyTo(L.latLng(y, x), targetZoom, {
          duration: 0.45,
        });
      },
    }),
    [crsType, resolvedCenter, defaultZoom, nativeMaxZoom, overzoomMaxZoom]
  );

  const cursorClass =
    interactionMode === 'explore' ? '' : 'nexus-map-mode-crosshair';

  return (
    <div
      ref={containerRef}
      aria-label={`Mapa interativo de ${mapLayer.name}`}
      className={`h-full w-full transition-colors duration-300 ${cursorClass}`}
      style={{ backgroundColor: resolvedBgColor }}
    />
  );
}
