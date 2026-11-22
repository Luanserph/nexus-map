import L from 'leaflet';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import type {
  Category,
  CustomRouteRecord,
  GameMapLayer,
  GameTheme,
  MapInteractionMode,
  MapMarker,
  UserNoteRecord,
} from '../../types/schema';
import { createTacticalTileLayer } from './createFallbackTileLayer';
import {
  createCategoryPinIcon,
  createClusterPinIcon,
  createPersonalNoteIcon,
  createRouteVertexIcon,
} from './markerIcons';

export interface InteractiveMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  flyToMarker: (marker: MapMarker) => void;
  flyToCoords: (coords: [number, number]) => void;
}

export interface InteractiveMapProps {
  mapLayer: GameMapLayer;
  theme: GameTheme;
  markers: MapMarker[];
  categoriesById: Record<string, Category>;
  foundMarkerIds: Set<string>;
  selectedMarkerId?: string | null;
  onSelectMarker: (marker: MapMarker) => void;
  clusteringEnabled?: boolean;
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
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CLUSTER_CELL_PX = 44;

export function InteractiveMap({
  mapLayer,
  theme,
  markers,
  categoriesById,
  foundMarkerIds,
  selectedMarkerId,
  onSelectMarker,
  clusteringEnabled = true,
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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const notesLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  const onCursorMoveRef = useRef(onCursorMove);
  const onZoomChangeRef = useRef(onZoomChange);
  const onMapClickRef = useRef(onMapClick);
  const onSelectMarkerRef = useRef(onSelectMarker);
  const onSelectNoteRef = useRef(onSelectNote);
  const interactionModeRef = useRef(interactionMode);

  useEffect(() => {
    onCursorMoveRef.current = onCursorMove;
    onZoomChangeRef.current = onZoomChange;
    onMapClickRef.current = onMapClick;
    onSelectMarkerRef.current = onSelectMarker;
    onSelectNoteRef.current = onSelectNote;
    interactionModeRef.current = interactionMode;
  }, [
    onCursorMove,
    onZoomChange,
    onMapClick,
    onSelectMarker,
    onSelectNote,
    interactionMode,
  ]);

  const resolvedBounds = useMemo(() => {
    const [minX, minY, maxX, maxY] = mapLayer.bounds ?? [0, 0, 1024, 1024];
    return L.latLngBounds(L.latLng(minY, minX), L.latLng(maxY, maxX));
  }, [mapLayer.bounds]);

  const resolvedCenter = useMemo(() => {
    const [cx, cy] = mapLayer.defaultCenter ?? [512, 512];
    return L.latLng(cy, cx);
  }, [mapLayer.defaultCenter]);

  const minZoom = mapLayer.minZoom ?? -1;
  const maxZoom = mapLayer.maxZoom ?? 4;
  const defaultZoom = mapLayer.defaultZoom ?? 0;

  /**
   * High-performance renderer for 500-1,000+ pins:
   * 1. Viewport culling (only processes markers inside padded viewport bounds).
   * 2. Optional O(N) screen-space grid clustering when zoom < maxZoom.
   */
  const renderVisibleMarkers = useCallback(() => {
    const map = leafletMapRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const paddedBounds = map.getBounds().pad(0.25);
    const currentZoom = map.getZoom();
    const shouldCluster =
      clusteringEnabled && markers.length > 40 && currentZoom < maxZoom - 0.25;

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

    if (!shouldCluster) {
      for (const marker of visibleInViewport) {
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

        leafletMarker.addTo(group);
      }
      return;
    }

    // Step 2: Fast O(N) screen-space spatial grid clustering
    const buckets = new Map<string, MapMarker[]>();
    for (const marker of visibleInViewport) {
      if (selectedMarkerId === marker.id) {
        // Always keep the currently selected marker unclustered
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

    for (const bucket of buckets.values()) {
      if (bucket.length === 1) {
        const marker = bucket[0];
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

        leafletMarker.addTo(group);
      } else {
        // Cluster centroid
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
          map.flyTo(centerLatLng, Math.min(maxZoom, map.getZoom() + 1.25), {
            duration: 0.35,
          });
        });

        clusterMarker.addTo(group);
      }
    }
  }, [
    markers,
    categoriesById,
    foundMarkerIds,
    selectedMarkerId,
    clusteringEnabled,
    maxZoom,
  ]);

  const renderVisibleMarkersRef = useRef(renderVisibleMarkers);
  useEffect(() => {
    renderVisibleMarkersRef.current = renderVisibleMarkers;
  }, [renderVisibleMarkers]);

  // 1. Initialize Leaflet instance once (L.CRS.Simple + preferCanvas: true)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || leafletMapRef.current) return;

    const map = L.map(container, {
      crs: L.CRS.Simple,
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false,
      minZoom,
      maxZoom,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxBounds: resolvedBounds.pad(0.25),
      maxBoundsViscosity: 0.85,
      center: resolvedCenter,
      zoom: defaultZoom,
    });

    const routesGroup = L.layerGroup().addTo(map);
    const markerGroup = L.layerGroup().addTo(map);
    const notesGroup = L.layerGroup().addTo(map);

    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      onCursorMoveRef.current?.({
        x: Math.round(event.latlng.lng * 10) / 10,
        y: Math.round(event.latlng.lat * 10) / 10,
      });
    });

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (interactionModeRef.current !== 'explore') {
        const coords: [number, number] = [
          Math.round(event.latlng.lng * 10) / 10,
          Math.round(event.latlng.lat * 10) / 10,
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
    routesLayerRef.current = routesGroup;
    markersLayerRef.current = markerGroup;
    notesLayerRef.current = notesGroup;
    onZoomChangeRef.current?.(map.getZoom());

    return () => {
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      notesLayerRef.current = null;
      routesLayerRef.current = null;
    };
    // Mount-only initialization; dynamic layer/bounds updates happen below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Swap active tile/fallback layer & update bounds smoothly on layer or theme change
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);
    map.setMaxBounds(resolvedBounds.pad(0.25));

    const nextTileLayer = createTacticalTileLayer({
      tileUrlTemplate: mapLayer.tileUrlTemplate,
      theme,
      mapId: mapLayer.id,
      bounds: resolvedBounds,
      minZoom,
      maxZoom,
    });

    nextTileLayer.addTo(map);
    tileLayerRef.current = nextTileLayer;

    map.setView(resolvedCenter, defaultZoom, { animate: true, duration: 0.35 });
    onZoomChangeRef.current?.(defaultZoom);
    renderVisibleMarkersRef.current();
  }, [
    mapLayer.id,
    mapLayer.tileUrlTemplate,
    theme,
    resolvedBounds,
    resolvedCenter,
    minZoom,
    maxZoom,
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

  // 6. Expose imperative controls to MapWorkspace HUD
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
        map.flyTo(L.latLng(y, x), Math.max(map.getZoom(), maxZoom - 0.5), {
          duration: 0.45,
        });
      },
      flyToCoords: (coords: [number, number]) => {
        const map = leafletMapRef.current;
        if (!map) return;
        const [x, y] = coords;
        map.flyTo(L.latLng(y, x), Math.max(map.getZoom(), maxZoom - 0.5), {
          duration: 0.45,
        });
      },
    }),
    [resolvedCenter, defaultZoom, maxZoom]
  );

  const cursorClass =
    interactionMode === 'explore' ? '' : 'nexus-map-mode-crosshair';

  return (
    <div
      ref={containerRef}
      aria-label={`Mapa interativo de ${mapLayer.name}`}
      className={`h-full w-full bg-[var(--surface-base)] ${cursorClass}`}
    />
  );
}
