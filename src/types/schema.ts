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
