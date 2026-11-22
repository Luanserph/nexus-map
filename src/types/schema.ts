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

export interface GameMapLayer {
  id: string;
  name: string;
  pinsCount: number;
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

export interface MapMarker {
  id: string;
  mapId: string;
  category: string;
  title: string;
  description: string;
  /** Cartographic coordinates [x, y] in L.CRS.Simple planar space. */
  coords: [number, number];
  region?: string;
  metadata?: Record<string, string | number | boolean | string[]>;
}

export interface UserPinState {
  pinId: string;
  gameId: string;
  found: boolean;
  foundAt?: number;
  note?: string;
}

export type MapInteractionMode = 'explore' | 'add-note' | 'draw-route';

export interface FoundMarkerRecord {
  /** Composite key: `${gameSlug}:${markerId}` */
  id: string;
  gameSlug: string;
  markerId: string;
  foundAt: number;
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

export interface NexusBackupPayload {
  version: 1;
  exportedAt: string;
  foundMarkers: FoundMarkerRecord[];
  userNotes: UserNoteRecord[];
  customRoutes: CustomRouteRecord[];
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
  assets: GameAssets;
  theme: GameTheme;
  maps: GameMapLayer[];
  categoryGroups: CategoryGroup[];
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
