export type BadgeStyle = 'chamfered' | 'ornate' | 'minimal';

export type BackgroundPattern =
  | 'tactical-grid'
  | 'topographic-rings'
  | 'cyber-grid'
  | 'abyssal-contours';

export type GameCatalogStatus = 'available' | 'beta' | 'coming-soon';

export type ExplorationStatus = 'all' | 'in-progress' | 'completed' | 'not-started';

export interface GameAssets {
  coverImage?: string;
  bannerImage?: string;
  logoImage?: string;
}

export interface GameTheme {
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  glassTint: string;
  surfaceBase: string;
  fontDisplay?: string;
  backgroundPattern: BackgroundPattern;
  badgeStyle?: BadgeStyle;
}

export interface GameDlc {
  id: string;
  name: string;
  shortLabel?: string;
  accentColor?: string;
}

export interface GameMapLayer {
  id: string;
  name: string;
  pinsCount: number;
  dlc?: string;
  parentMapId?: string;
  isInterior?: boolean;
  icon?: string;
  tileUrlTemplate?: string;
  minZoom?: number;
  maxZoom?: number;
  bounds?: [number, number, number, number];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  color: string;
  defaultVisible: boolean;
}

export interface CategoryGroup {
  id: string;
  label: string;
  categories: Category[];
}

export interface CategoryPreset {
  id: string;
  label: string;
  description?: string;
  /** Category IDs enabled when this preset is selected. Use ['*'] for all categories. */
  categoryIds: string[];
}

export interface MarkerChecklistItem {
  id: string;
  label: string;
}

export interface MarkerTranslation {
  title?: string;
  description?: string;
}

export interface MapMarker {
  id: string;
  mapId: string;
  category: string;
  title: string;
  description: string;
  /** Cartographic coordinates [x, y] in L.CRS.Simple planar space. */
  coords: [number, number];
  region?: string;
  dlc?: string;
  linkedMapId?: string;
  translations?: Record<string, MarkerTranslation>;
  imageUrl?: string;
  wikiUrl?: string;
  level?: number;
  tags?: string[];
  checklist?: MarkerChecklistItem[];
  metadata?: Record<string, string | number | boolean | string[]>;
}

export interface GuidedRouteStep {
  stepNumber: number;
  markerId: string;
  tip: string;
}

export interface GuidedRoute {
  id: string;
  mapId: string;
  title: string;
  description: string;
  dlc?: string;
  color?: string;
  steps: GuidedRouteStep[];
}

export interface LivePlayerTelemetry {
  game: string;
  mapId: string;
  x: number;
  y: number;
  /** Heading in degrees (0 = North/Up, 90 = East/Right, 180 = South/Down, 270 = West/Left). */
  heading: number;
}

export interface UserPinState {
  pinId: string;
  gameId: string;
  found: boolean;
  foundAt?: number;
  note?: string;
}

export type MapInteractionMode =
  | 'explore'
  | 'add-note'
  | 'draw-route'
  | 'pick-guide-start';

export type GuideScope = 'all' | 'base' | 'dlcs';

export type GuideFocus =
  | 'all'
  | 'skills-power'
  | 'gear-treasures'
  | 'quests-contracts';

export type GuideStartMode = 'fast-travel' | 'map-click' | 'live-player';

export interface FoundMarkerRecord {
  /** Composite key: `${gameSlug}:${markerId}` */
  id: string;
  gameSlug: string;
  markerId: string;
  foundAt: number;
}

export interface MarkerChecklistRecord {
  /** Composite key: `${gameSlug}:${markerId}:${itemId}` */
  id: string;
  gameSlug: string;
  markerId: string;
  itemId: string;
  checkedAt: number;
}

export interface UserNoteRecord {
  id: string;
  gameSlug: string;
  mapId: string;
  title: string;
  content: string;
  coords: [number, number];
  createdAt: number;
}

export interface CustomRouteRecord {
  id: string;
  gameSlug: string;
  mapId: string;
  name: string;
  color: string;
  points: [number, number][];
  createdAt: number;
}

export interface UserContributionRecord {
  id: string;
  gameSlug: string;
  markerId: string;
  imageDataUrl?: string;
  requirementNote?: string;
  createdAt: number;
}

export interface NexusBackupPayload {
  version: 1;
  exportedAt: string;
  foundMarkers: FoundMarkerRecord[];
  userNotes: UserNoteRecord[];
  customRoutes: CustomRouteRecord[];
  checklistItems?: MarkerChecklistRecord[];
  userContributions?: UserContributionRecord[];
}

export interface GameManifest {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  studio: string;
  releaseYear: number;
  genres: string[];
  status: GameCatalogStatus;
  dlc?: string;
  dlcs?: GameDlc[];
  assets: GameAssets;
  theme: GameTheme;
  maps: GameMapLayer[];
  categoryGroups: CategoryGroup[];
  presets?: CategoryPreset[];
}

export interface GameProgressSummary {
  gameSlug: string;
  foundMarkersCount: number;
  lastVisitedAt?: string;
  activeLayerId?: string;
}

export interface HubGameEntry {
  manifest: GameManifest;
  progress: GameProgressSummary;
}
