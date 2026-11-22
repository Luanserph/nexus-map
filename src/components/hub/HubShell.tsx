import { ArrowUpDown, Clock, Compass, Globe, Layers, MapPin, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getGenreLabel, normalizeGenreKey, useI18n } from '../../core/i18n';
import type { LastVisitedRecord } from '../../core/storage';
import { getGameStatus, getTotalPinsCount } from '../../data/games';
import type { ExplorationStatus, HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';
import { ContinueExploringBanner } from './ContinueExploringBanner';
import { FeaturedSpotlightBanner } from './FeaturedSpotlightBanner';
import { GameCard } from './GameCard';
import { HubNavbar } from './HubNavbar';
import { RecentGameCard } from './RecentGameCard';

export interface HubShellProps {
  games: HubGameEntry[];
  lastVisited?: LastVisitedRecord | null;
  onOpenGame: (slug: string, layerId?: string) => void;
}

type CatalogSortMode = 'default' | 'progress-desc' | 'pins-desc' | 'alpha';

function getProgressRatio(entry: HubGameEntry): number {
  const total = getTotalPinsCount(entry.manifest);
  return total > 0 ? entry.progress.foundMarkersCount / total : 0;
}

export function HubShell({ games, lastVisited, onOpenGame }: HubShellProps) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ExplorationStatus>('all');
  const [sortBy, setSortBy] = useState<CatalogSortMode>('default');
  const [hoveredAccent, setHoveredAccent] = useState<string | null>(null);

  const availableGenres = useMemo(() => {
    const normalizedSet = new Set<string>();
    for (const entry of games) {
      for (const genre of entry.manifest.genres) {
        normalizedSet.add(normalizeGenreKey(genre));
      }
    }
    return Array.from(normalizedSet).sort((a, b) =>
      getGenreLabel(a, locale).localeCompare(getGenreLabel(b, locale), locale)
    );
  }, [games, locale]);

  const lastVisitedEntry = useMemo(() => {
    if (!lastVisited) return null;
    return (
      games.find((entry) => entry.manifest.slug === lastVisited.gameSlug) ?? null
    );
  }, [games, lastVisited]);

  const featuredEntry = useMemo(
    () => games.find((entry) => entry.manifest.featured) ?? null,
    [games]
  );

  const recentGames = useMemo(() => {
    return games
      .filter((entry) => entry.manifest.isRecent)
      .sort((a, b) => {
        if (a.manifest.featured && !b.manifest.featured) return -1;
        if (!a.manifest.featured && b.manifest.featured) return 1;
        return b.manifest.releaseYear - a.manifest.releaseYear;
      });
  }, [games]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedGenre !== 'all' || selectedStatus !== 'all';

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matched = games.filter((entry) => {
      const { manifest } = entry;

      if (selectedStatus !== 'all' && getGameStatus(entry) !== selectedStatus) {
        return false;
      }

      if (
        selectedGenre !== 'all' &&
        !manifest.genres.some((g) => normalizeGenreKey(g) === selectedGenre)
      ) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        manifest.title,
        manifest.subtitle,
        manifest.studio,
        ...manifest.genres,
        ...manifest.genres.map((g) => getGenreLabel(g, locale)),
        ...manifest.maps.map((mapLayer) => mapLayer.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    // When browsing without active search/filters, show the core catalog separately from Recently Added
    const baseList =
      hasActiveFilters || recentGames.length === 0
        ? matched
        : matched.filter((entry) => !entry.manifest.isRecent);

    const sorted = [...baseList];
    if (sortBy === 'progress-desc') {
      sorted.sort((a, b) => getProgressRatio(b) - getProgressRatio(a));
    } else if (sortBy === 'pins-desc') {
      sorted.sort(
        (a, b) => getTotalPinsCount(b.manifest) - getTotalPinsCount(a.manifest)
      );
    } else if (sortBy === 'alpha') {
      sorted.sort((a, b) =>
        a.manifest.title.localeCompare(b.manifest.title, locale)
      );
    }

    return sorted;
  }, [
    games,
    searchQuery,
    selectedGenre,
    selectedStatus,
    locale,
    hasActiveFilters,
    recentGames.length,
    sortBy,
  ]);

  const hubTelemetry = useMemo(() => {
    const totalLayers = games.reduce((acc, g) => acc + g.manifest.maps.length, 0);
    const totalMarkers = games.reduce(
      (acc, g) => acc + getTotalPinsCount(g.manifest),
      0
    );
    const totalFound = games.reduce(
      (acc, g) => acc + g.progress.foundMarkersCount,
      0
    );
    const globalPercent =
      totalMarkers > 0 ? Math.round((totalFound / totalMarkers) * 100) : 0;

    return { totalLayers, totalMarkers, totalFound, globalPercent };
  }, [games]);

  function resetFilters() {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
    setSortBy('default');
  }

  return (
    <div className="relative min-h-svh overflow-x-clip bg-[var(--surface-base)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Background Layers: Pixel Art Hub Artwork + Center/Bottom Vignette + Dynamic Ambient Glow + Micro-Noise */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: "url('/bg-hub.webp'), url('/bg-hub.jpg')",
          imageRendering: 'pixelated',
        }}
      />
      {/* Deep center & bottom vignette (#07090f) preserving side characters while keeping cards high-contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 58% 62% at 50% 42%, rgba(7, 9, 15, 0.72) 0%, rgba(7, 9, 15, 0.34) 68%, rgba(7, 9, 15, 0.55) 100%), linear-gradient(180deg, rgba(7, 9, 15, 0.45) 0%, rgba(7, 9, 15, 0.15) 38%, rgba(7, 9, 15, 0.88) 84%, #07090f 100%)',
        }}
      />
      {/* Dynamic Ambient Glow reacting to hovered game accent with screen blend over the pixel art */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 mix-blend-screen transition-all duration-500"
        style={{
          background: hoveredAccent
            ? `radial-gradient(ellipse 72% 55% at 50% -6%, color-mix(in srgb, ${hoveredAccent} 22%, transparent), transparent 72%), radial-gradient(ellipse 50% 45% at 88% 85%, color-mix(in srgb, ${hoveredAccent} 14%, transparent), transparent 70%), radial-gradient(ellipse 45% 45% at 12% 85%, color-mix(in srgb, ${hoveredAccent} 12%, transparent), transparent 70%)`
            : 'radial-gradient(ellipse 68% 50% at 50% -10%, color-mix(in srgb, var(--accent-primary) 15%, transparent), transparent 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="nexus-noise-layer pointer-events-none fixed inset-0 opacity-[0.025]"
      />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex min-h-svh max-w-7xl flex-col px-4 pt-4 pb-14 sm:px-6 lg:px-8">
        <HubNavbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          availableGenres={availableGenres}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          resultsCount={
            hasActiveFilters ? filteredGames.length : games.length
          }
          totalCount={games.length}
        />

        {/* Hero / Tactical Telemetry Header */}
        <section className="mt-7 mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <GlassBadge variant="accent" size="sm" dot>
                {t('hub.heroBadge')}
              </GlassBadge>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                IndexedDB Offline-First
              </span>
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl"
              style={{ fontFamily: 'var(--nexus-font-display)' }}
            >
              {t('hub.heroTitle')}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('hub.heroDesc')}
            </p>
          </div>

          {/* Compact Telemetry Strip */}
          <GlassPanel variant="subtle" padding="sm" className="shrink-0">
            <div className="flex flex-wrap items-center gap-5 px-1">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[var(--accent-primary)]" />
                <div>
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {games.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t('hub.statGames')}
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-white/[0.08]" />

              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--accent-primary)]" />
                <div>
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {hubTelemetry.totalLayers}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t('hub.statLayers')}
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-white/[0.08]" />

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--accent-primary)]" />
                <div>
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {hubTelemetry.totalMarkers.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {t('hub.statPins')}
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-white/[0.08]" />

              <div>
                <div className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                  {hubTelemetry.globalPercent}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {t('hub.statGlobalProgress')}
                </div>
              </div>
            </div>
          </GlassPanel>
        </section>

        {/* Hero Banner — Featured Spotlight ("Jogo do Momento": GTA VI) */}
        {featuredEntry && !hasActiveFilters && (
          <FeaturedSpotlightBanner
            entry={featuredEntry}
            onOpenGame={onOpenGame}
            onHoverAccent={setHoveredAccent}
          />
        )}

        {/* Continue Exploring Banner (last visited game & map) */}
        {lastVisitedEntry && !hasActiveFilters && (
          <ContinueExploringBanner
            entry={lastVisitedEntry}
            lastMapId={lastVisited?.mapId}
            onResume={onOpenGame}
            onHoverAccent={setHoveredAccent}
          />
        )}

        {/* Recently Added Horizontal Row (GTA VI & Hollow Knight) */}
        {recentGames.length > 0 && !hasActiveFilters && (
          <section className="mb-10">
            <div className="mb-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-primary)]">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg"
                    style={{ fontFamily: 'var(--nexus-font-display)' }}
                  >
                    {t('hub.recentTitle')}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('hub.recentSubtitle')}
                  </p>
                </div>
              </div>
              <GlassBadge variant="neutral" size="sm">
                {recentGames.length}
              </GlassBadge>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recentGames.map((entry) => (
                <RecentGameCard
                  key={entry.manifest.id}
                  entry={entry}
                  onOpenGame={onOpenGame}
                  onHoverAccent={setHoveredAccent}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Universes Catalog Section */}
        <main className="flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--accent-primary)]">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h2
                  className="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg"
                  style={{ fontFamily: 'var(--nexus-font-display)' }}
                >
                  {t('hub.allUniversesTitle')}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t('hub.allUniversesSubtitle')}
                </p>
              </div>
            </div>

            {/* Progress / Pins / Alphabetical Sort Controls */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/35 p-1 backdrop-blur-md">
              <span className="inline-flex items-center gap-1 px-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <ArrowUpDown className="h-3 w-3" />
                {t('hub.sortBy')}
              </span>
              {(
                [
                  { id: 'default', label: t('hub.sortDefault') },
                  { id: 'progress-desc', label: t('hub.sortProgressDesc') },
                  { id: 'pins-desc', label: t('hub.sortPinsDesc') },
                  { id: 'alpha', label: t('hub.sortAlpha') },
                ] as const
              ).map((option) => {
                const active = sortBy === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortBy(option.id)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-[var(--accent-primary)]/18 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40'
                        : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredGames.map((entry) => (
                <GameCard
                  key={entry.manifest.id}
                  entry={entry}
                  onOpenGame={onOpenGame}
                  onHoverAccent={setHoveredAccent}
                />
              ))}
            </div>
          ) : (
            <GlassPanel variant="subtle" padding="lg" className="my-8 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-6">
                <Compass className="h-8 w-8 text-[var(--text-muted)]" />
                <h2
                  className="text-lg font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--nexus-font-display)' }}
                >
                  {t('hub.emptyTitle')}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('hub.emptyDesc')}
                </p>
                {hasActiveFilters && (
                  <NeonButton
                    variant="glass"
                    active
                    onClick={resetFilters}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                    className="mt-2"
                  >
                    {t('hub.clearFilters')}
                  </NeonButton>
                )}
              </div>
            </GlassPanel>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="mt-14 flex flex-col items-center justify-between gap-2 border-t border-white/[0.07] pt-5 text-xs text-[var(--text-muted)] sm:flex-row">
          <span className="font-mono">
            NEXUS MAPS // TACTICAL NEON GLASSMORPHISM
          </span>
          <span>{t('hub.footerRight')}</span>
        </footer>
      </div>
    </div>
  );
}
