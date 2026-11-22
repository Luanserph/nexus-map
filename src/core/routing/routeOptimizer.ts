import type {
  Category,
  GuideFocus,
  GuideScope,
  GuideStartMode,
  MapMarker,
} from '../../types/schema';

export interface OptimizedRouteStep {
  stepNumber: number;
  marker: MapMarker;
  tip: string;
}

export interface OptimizeRouteInput {
  markers: MapMarker[];
  foundMarkerIds: Set<string>;
  categoriesById: Record<string, Category>;
  scope: GuideScope;
  focus: GuideFocus;
  startMode: GuideStartMode;
  customStartCoords?: [number, number] | null;
  livePlayerCoords?: [number, number] | null;
  visibleCategories?: Record<string, boolean>;
  respectVisibleCategories?: boolean;
}

export interface OptimizedRouteResult {
  steps: OptimizedRouteStep[];
  totalMatchingCount: number;
  alreadyFoundCount: number;
  totalDistance: number;
  startLabel: string;
}

const FAST_TRAVEL_CATEGORIES = new Set([
  'signpost',
  'harbor',
  'site-of-grace',
  'dataterm',
  'stag-station',
  'fast-travel',
]);

const SKILLS_POWER_CATEGORIES = new Set([
  'pop',
  'site-of-grace',
  'golden-seed',
  'charm',
  'grub',
  'gwent',
  'collectible',
  'signpost',
  'harbor',
  'bench',
]);

const GEAR_TREASURES_CATEGORIES = new Set([
  'guarded',
  'hidden',
  'smugglers',
  'spoils',
  'armourer',
  'blacksmith',
  'armourerstable',
  'grindstone',
  'ripperdoc',
  'dungeon',
]);

const QUESTS_CONTRACTS_CATEGORIES = new Set([
  'notice',
  'pid',
  'abandoned',
  'monsternest',
  'monsterden',
  'banditcamp',
  'demigod-boss',
  'field-boss',
  'cyberpsycho',
  'tarot',
]);

function matchesScope(marker: MapMarker, scope: GuideScope): boolean {
  const markerDlc = marker.dlc ?? 'base';
  if (scope === 'all') return true;
  if (scope === 'base') return markerDlc === 'base';
  return markerDlc !== 'base';
}

function matchesFocus(
  marker: MapMarker,
  focus: GuideFocus,
  categoriesById: Record<string, Category>
): boolean {
  if (focus === 'all') return true;
  const cat = categoriesById[marker.category];
  const groupId = cat?.groupId ?? '';

  if (focus === 'skills-power') {
    return (
      SKILLS_POWER_CATEGORIES.has(marker.category) ||
      groupId === 'collectibles' ||
      Boolean(marker.tags?.includes('ponto-de-habilidade'))
    );
  }

  if (focus === 'gear-treasures') {
    return (
      GEAR_TREASURES_CATEGORIES.has(marker.category) ||
      groupId === 'gear-treasures'
    );
  }

  return (
    QUESTS_CONTRACTS_CATEGORIES.has(marker.category) ||
    groupId === 'quests-contracts' ||
    groupId === 'bosses' ||
    groupId === 'dangers-monsters' ||
    groupId === 'contracts'
  );
}

function euclidean(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

/**
 * Weighted travel cost for Nearest Neighbor construction:
 * favors staying in the same region and smooth level progression when `level` is present.
 */
function weightedStepCost(from: MapMarker, to: MapMarker): number {
  let cost = euclidean(from.coords, to.coords);

  if (from.region && to.region && from.region === to.region) {
    cost *= 0.82;
  }

  if (from.level !== undefined && to.level !== undefined) {
    const levelJump = to.level - from.level;
    if (levelJump > 4) {
      cost += levelJump * 1.4;
    }
  } else if (to.level !== undefined && to.level >= 20) {
    // Gently push high-level encounters later when starting from unscaled waypoints
    cost += 6;
  }

  return cost;
}

/**
 * 2-opt local search refinement to untangle crossing segments in O(n^2) with a tight time budget
 * so 500-1,000+ pins optimize smoothly in < 20ms without blocking the UI thread.
 */
function refineWithTwoOpt(route: MapMarker[]): MapMarker[] {
  const n = route.length;
  if (n < 4) return route;

  const tour = route.slice();
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const maxDurationMs = 22;
  const maxPasses = 40;

  let improved = true;
  let pass = 0;

  while (improved && pass < maxPasses) {
    improved = false;
    pass += 1;

    for (let i = 0; i < n - 2; i += 1) {
      const a = tour[i].coords;
      const b = tour[i + 1].coords;
      const currentAB = euclidean(a, b);

      for (let k = i + 2; k < n - 1; k += 1) {
        const c = tour[k].coords;
        const d = tour[k + 1].coords;

        const before = currentAB + euclidean(c, d);
        const after = euclidean(a, c) + euclidean(b, d);

        if (after + 1e-4 < before) {
          // Reverse segment [i + 1 .. k] in-place
          let left = i + 1;
          let right = k;
          while (left < right) {
            const tmp = tour[left];
            tour[left] = tour[right];
            tour[right] = tmp;
            left += 1;
            right -= 1;
          }
          improved = true;
          break;
        }
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - startTime > maxDurationMs) {
        return tour;
      }
    }
  }

  return tour;
}

function buildDynamicTip(
  marker: MapMarker,
  category?: Category
): string {
  const parts: string[] = [];
  if (marker.description) {
    parts.push(marker.description);
  } else if (category) {
    parts.push(`Objetivo da categoria ${category.name}.`);
  }
  if (marker.level !== undefined) {
    parts.push(`Nível recomendado: ${marker.level}.`);
  }
  return parts.join(' ');
}

export function generateOptimized100Route(
  input: OptimizeRouteInput
): OptimizedRouteResult {
  const {
    markers,
    foundMarkerIds,
    categoriesById,
    scope,
    focus,
    startMode,
    customStartCoords,
    livePlayerCoords,
    visibleCategories,
    respectVisibleCategories = false,
  } = input;

  // 1. Filter matching objectives for this scope & focus
  const matching = markers.filter((marker) => {
    if (!matchesScope(marker, scope)) return false;
    if (!matchesFocus(marker, focus, categoriesById)) return false;
    if (
      respectVisibleCategories &&
      visibleCategories &&
      !visibleCategories[marker.category]
    ) {
      return false;
    }
    return true;
  });

  const pending = matching.filter((m) => !foundMarkerIds.has(m.id));
  const alreadyFoundCount = matching.length - pending.length;

  if (pending.length === 0) {
    return {
      steps: [],
      totalMatchingCount: matching.length,
      alreadyFoundCount,
      totalDistance: 0,
      startLabel: 'Todos os objetivos concluídos',
    };
  }

  // 2. Determine starting anchor coordinates
  let anchorCoords: [number, number];
  let startLabel: string;

  if (startMode === 'live-player' && livePlayerCoords) {
    anchorCoords = livePlayerCoords;
    startLabel = `Live Player [${livePlayerCoords[0].toFixed(1)}, ${livePlayerCoords[1].toFixed(1)}]`;
  } else if (startMode === 'map-click' && customStartCoords) {
    anchorCoords = customStartCoords;
    startLabel = `Ponto no Mapa [${customStartCoords[0].toFixed(1)}, ${customStartCoords[1].toFixed(1)}]`;
  } else {
    const firstFastTravel =
      pending.find((m) => FAST_TRAVEL_CATEGORIES.has(m.category)) ??
      markers.find((m) => FAST_TRAVEL_CATEGORIES.has(m.category)) ??
      pending[0];
    anchorCoords = firstFastTravel.coords;
    startLabel = firstFastTravel.title;
  }

  // 3. Pick starting node in `pending` (closest to anchor, breaking ties by lowest level)
  const remaining = pending.slice();
  let startIndex = 0;
  let bestStartScore = Number.POSITIVE_INFINITY;

  for (let i = 0; i < remaining.length; i += 1) {
    const m = remaining[i];
    const dist = euclidean(anchorCoords, m.coords);
    const levelBias = m.level !== undefined ? m.level * 0.25 : 0;
    const score = dist + levelBias;
    if (score < bestStartScore) {
      bestStartScore = score;
      startIndex = i;
    }
  }

  // 4. Nearest Neighbor greedy construction with region/level affinity
  const ordered: MapMarker[] = [];
  let current = remaining.splice(startIndex, 1)[0];
  ordered.push(current);

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestCost = Number.POSITIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const cost = weightedStepCost(current, remaining[i]);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }

    current = remaining.splice(bestIdx, 1)[0];
    ordered.push(current);
  }

  // 5. 2-opt refinement to eliminate crossing paths
  const refined = refineWithTwoOpt(ordered);

  // 6. Compute total Euclidean distance and build steps
  let totalDistance = 0;
  for (let i = 0; i < refined.length - 1; i += 1) {
    totalDistance += euclidean(refined[i].coords, refined[i + 1].coords);
  }

  const steps: OptimizedRouteStep[] = refined.map((marker, idx) => ({
    stepNumber: idx + 1,
    marker,
    tip: buildDynamicTip(marker, categoriesById[marker.category]),
  }));

  return {
    steps,
    totalMatchingCount: matching.length,
    alreadyFoundCount,
    totalDistance: Math.round(totalDistance * 10) / 10,
    startLabel,
  };
}
