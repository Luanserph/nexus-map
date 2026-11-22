import L from 'leaflet';
import { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import type { Category, GameMapLayer, GameTheme, MapMarker } from '../../types/schema';
import { createTacticalTileLayer } from './createFallbackTileLayer';
import { createCategoryPinIcon } from './markerIcons';

export interface InteractiveMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  flyToMarker: (marker: MapMarker) => void;
}

export interface InteractiveMapProps {
  mapLayer: GameMapLayer;
  theme: GameTheme;
  markers: MapMarker[];
  categoriesById: Record<string, Category>;
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

function buildMarkerPopupHtml(marker: MapMarker, category?: Category): string {
  const categoryName = escapeHtml(category?.name ?? marker.category);
  const categoryColor = category?.color ?? 'var(--accent-primary)';
  const title = escapeHtml(marker.title);
  const description = escapeHtml(marker.description);
  const region = marker.region ? escapeHtml(marker.region) : '';

  const metadataEntries = marker.metadata
    ? Object.entries(marker.metadata).slice(0, 3)
    : [];

  const metadataHtml =
    metadataEntries.length > 0
      ? `<div class="nexus-popup-meta">${metadataEntries
          .map(([key, value]) => {
            const formatted = Array.isArray(value)
              ? value.join(', ')
              : typeof value === 'boolean'
                ? value
                  ? 'Sim'
                  : 'Não'
                : String(value);
            return `<span class="nexus-popup-chip"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(formatted)}</span>`;
          })
          .join('')}</div>`
      : '';

  return `
    <div class="nexus-popup-card">
      <div class="nexus-popup-header">
        <span class="nexus-popup-badge" style="--pin-color: ${categoryColor};">
          <span class="nexus-popup-dot"></span>
          ${categoryName}
        </span>
        ${region ? `<span class="nexus-popup-region">${region}</span>` : ''}
      </div>
      <h3 class="nexus-popup-title">${title}</h3>
      <p class="nexus-popup-desc">${description}</p>
      ${metadataHtml}
      <div class="nexus-popup-coords">
        X: ${marker.coords[0].toFixed(1)} &nbsp;|&nbsp; Y: ${marker.coords[1].toFixed(1)}
      </div>
    </div>
  `;
}

export function InteractiveMap({
  mapLayer,
  theme,
  markers,
  categoriesById,
  onCursorMove,
  onZoomChange,
  mapRef,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.GridLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const onCursorMoveRef = useRef(onCursorMove);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => {
    onCursorMoveRef.current = onCursorMove;
    onZoomChangeRef.current = onZoomChange;
  }, [onCursorMove, onZoomChange]);

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

    const markerGroup = L.layerGroup().addTo(map);

    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      onCursorMoveRef.current?.({
        x: Math.round(event.latlng.lng * 10) / 10,
        y: Math.round(event.latlng.lat * 10) / 10,
      });
    });

    map.on('zoomend', () => {
      onZoomChangeRef.current?.(map.getZoom());
    });

    leafletMapRef.current = map;
    markersLayerRef.current = markerGroup;
    onZoomChangeRef.current?.(map.getZoom());

    return () => {
      map.remove();
      leafletMapRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
    };
    // Mount-only initialization; dynamic layer/bounds updates happen in the effect below.
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

  // 3. Render filtered markers with category icons, tooltips, and glass popups
  useEffect(() => {
    const group = markersLayerRef.current;
    if (!group) return;

    group.clearLayers();

    for (const marker of markers) {
      const category = categoriesById[marker.category];
      const [x, y] = marker.coords;

      const leafletMarker = L.marker(L.latLng(y, x), {
        icon: createCategoryPinIcon(category),
        title: marker.title,
      });

      leafletMarker.bindTooltip(
        `<span class="nexus-tooltip-title">${escapeHtml(marker.title)}</span>`,
        {
          direction: 'top',
          offset: L.point(0, -14),
          className: 'nexus-leaflet-tooltip',
          opacity: 1,
        }
      );

      leafletMarker.bindPopup(buildMarkerPopupHtml(marker, category), {
        className: 'nexus-leaflet-popup',
        maxWidth: 290,
        minWidth: 230,
        closeButton: true,
      });

      leafletMarker.addTo(group);
    }
  }, [markers, categoriesById]);

  // 4. Expose imperative controls to MapWorkspace HUD
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
        map.flyTo(L.latLng(y, x), Math.max(map.getZoom(), 1.5), {
          duration: 0.5,
        });
      },
    }),
    [resolvedCenter, defaultZoom]
  );

  return (
    <div
      ref={containerRef}
      aria-label={`Mapa interativo de ${mapLayer.name}`}
      className="h-full w-full bg-[var(--surface-base)]"
    />
  );
}
