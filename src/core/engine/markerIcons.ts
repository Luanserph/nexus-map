import L from 'leaflet';
import type { Category } from '../../types/schema';

const ICON_SVG_PATHS: Record<string, string> = {
  sparkles:
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 3v3"/><path d="M17.5 4.5h3"/>',
  landmark:
    '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  skull:
    '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17l-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
  swords:
    '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>',
  sprout:
    '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
  radio:
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'alert-triangle':
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  gem: '<polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/>',
  signpost:
    '<path d="M12 3v3"/><path d="M18.5 13h-13L2 9.5 5.5 6h13L22 9.5Z"/><path d="M12 13v8"/>',
  anchor:
    '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  'door-open':
    '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
  'scroll-text':
    '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  hammer:
    '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
  'flask-conical':
    '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  'shopping-bag':
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  spade:
    '<path d="M5 9c-1.5 1.5-3 3.2-3 5.5A5.5 5.5 0 0 0 7.5 20c1.8 0 3-.5 4.5-2 1.5 1.5 2.7 2 4.5 2a5.5 5.5 0 0 0 5.5-5.5c0-2.3-1.5-4-3-5.5l-7-7-7 7Z"/><path d="M12 18v4"/>',
  compass:
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  default: '<circle cx="12" cy="12" r="5"/>',
};

export function createCategoryPinIcon(
  category?: Category,
  isFound = false,
  isSelected = false
): L.DivIcon {
  const color = category?.color ?? 'var(--accent-primary)';
  const iconKey = category?.icon ?? 'default';
  const svgInner = ICON_SVG_PATHS[iconKey] ?? ICON_SVG_PATHS.default;

  const stateClasses = [
    'nexus-map-pin',
    isFound ? 'is-found' : '',
    isSelected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const html = `
    <div class="${stateClasses}" style="--pin-color: ${color};">
      <span class="nexus-map-pin-pulse"></span>
      <span class="nexus-map-pin-core">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          ${svgInner}
        </svg>
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -15],
  });
}

export function createClusterPinIcon(count: number): L.DivIcon {
  const size = count >= 50 ? 40 : count >= 15 ? 36 : 32;
  const html = `
    <div class="nexus-cluster-pin" style="width:${size}px;height:${size}px;">
      <span>${count}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'nexus-map-pin-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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
