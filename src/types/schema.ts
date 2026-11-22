export type BadgeStyle = 'chamfered' | 'ornate' | 'minimal';

export type ExplorationStatus = 'all' | 'in-progress' | 'completed' | 'not-started';

export interface GameTheme {
  id: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  surfaceBase: string;
  glassBg: string;
  glassBorder: string;
  fontDisplay: string;
  badgeStyle: BadgeStyle;
  /** Optional key-art URL; when omitted, a procedural cartographic cover is rendered using theme tokens. */
  bannerUrl?: string;
  logoUrl?: string;
  /** Atmospheric motif identifier for the procedural cartographic cover fallback. */
  coverMotif: 'topographic-rings' | 'cyber-grid' | 'abyssal-contours';
}

export interface MapLayer {
  id: string;
  name: string;
  icon: string;
  tileUrlTemplate: string;
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number];
  defaultCenter: [number, number];
  defaultZoom: number;
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
  gameId: string;
  layerId: string;
  categoryId: string;
  title: string;
  subtitle?: string;
  description: string;
  coordinates: [number, number];
  region?: string;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
  };
  tags?: string[];
  relatedPinIds?: string[];
}

export interface UserPinState {
  pinId: string;
  gameId: string;
  found: boolean;
  foundAt?: number;
  note?: string;
}

export interface GameManifest {
  slug: string;
  title: string;
  subtitle: string;
  developer: string;
  releaseYear: number;
  genre: string[];
  totalMarkersCount: number;
  theme: GameTheme;
  layers: MapLayer[];
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
