import L from 'leaflet';
import type { Category } from '../../types/schema';
import {
  CATEGORY_ICON_SVG_PATHS,
  getCategoryIconKey,
} from '../utils/categoryIcons';

// High-performance in-memory icon caches (reused across 5,000–16,500+ pins with zero re-allocation)
const pinIconCache = new Map<string, L.DivIcon>();
const clusterIconCache = new Map<number, L.DivIcon>();

export function createCategoryPinIcon(
  category?: Category,
  isFound = false,
  isSelected = false
): L.DivIcon {
  const color = category?.color ?? 'var(--accent-primary)';
  const iconKey = getCategoryIconKey(
    category?.id,
    category?.name,
    category?.icon
  );
  const cacheKey = `${iconKey}:${color}:${isFound ? 1 : 0}:${isSelected ? 1 : 0}`;

  const cached = pinIconCache.get(cacheKey);
  if (cached) return cached;

  const svgInner =
    CATEGORY_ICON_SVG_PATHS[iconKey] ?? CATEGORY_ICON_SVG_PATHS['circle-dot'];

  const stateClasses = [
    'nexus-map-pin',
    isFound ? 'is-found' : '',
    isSelected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const foundCheckBadge = isFound
    ? '<span class="nexus-pin-found-badge" aria-hidden="true">✓</span>'
    : '';

  const html = `
    <div class="${stateClasses}" style="--pin-color: ${color};">
      ${isSelected ? '<span class="nexus-map-pin-pulse"></span>' : ''}
      <span class="nexus-map-pin-core">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          ${svgInner}
        </svg>
      </span>
      ${foundCheckBadge}
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -15],
  });

  pinIconCache.set(cacheKey, icon);
  return icon;
}

export function createClusterPinIcon(count: number): L.DivIcon {
  const cached = clusterIconCache.get(count);
  if (cached) return cached;

  const size = count >= 50 ? 40 : count >= 15 ? 36 : 32;
  const html = `
    <div class="nexus-cluster-pin" style="width:${size}px;height:${size}px;">
      <span>${count}</span>
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  clusterIconCache.set(count, icon);
  return icon;
}

export function createPersonalNoteIcon(isSelected = false): L.DivIcon {
  const stateClasses = [
    'nexus-map-pin nexus-note-pin',
    isSelected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const html = `
    <div class="${stateClasses}" style="--pin-color: var(--accent-secondary);">
      <span class="nexus-map-pin-pulse"></span>
      <span class="nexus-map-pin-core">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/>
          <path d="M15 3v4a2 2 0 0 0 2 2h4"/>
        </svg>
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -15],
  });
}

export function createRouteVertexIcon(color: string, index: number): L.DivIcon {
  const html = `
    <div class="nexus-route-vertex" style="--route-color: ${color};">
      <span>${index + 1}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function createGuidedStepIcon(
  stepNumber: number,
  isActive: boolean,
  isDone: boolean,
  color: string
): L.DivIcon {
  const classes = [
    'nexus-guide-step-pin',
    isActive ? 'is-active' : '',
    isDone ? 'is-done' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const html = `
    <div class="${classes}" style="--guide-color: ${color};">
      ${isActive ? '<span class="nexus-guide-pulse"></span>' : ''}
      <span class="nexus-guide-step-core">${isDone ? '✓' : stepNumber}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function createLivePlayerIcon(heading: number): L.DivIcon {
  const html = `
    <div class="nexus-player-marker">
      <div class="nexus-player-rotator" style="transform: rotate(${heading}deg);">
        <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
          <defs>
            <linearGradient id="nexus-cone-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0" />
              <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.48" />
            </linearGradient>
          </defs>
          <!-- Vision Cone pointing North (0 deg) -->
          <path d="M 32 32 L 16 4 A 30 30 0 0 1 48 4 Z" fill="url(#nexus-cone-grad)" />
          <!-- Directional Arrow -->
          <polygon
            points="32,16 42,40 32,34 22,40"
            fill="var(--accent-primary)"
            stroke="#07090d"
            stroke-width="2"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="nexus-player-beacon"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}
