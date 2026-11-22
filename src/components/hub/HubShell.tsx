import { Compass, Layers, MapPin, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  getAllGenres,
  getGameStatus,
  getTotalPinsCount,
} from '../../data/games';
import type { ExplorationStatus, HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';
import { GameCard } from './GameCard';
import { HubNavbar } from './HubNavbar';

export interface HubShellProps {
  games: HubGameEntry[];
  onOpenGame: (slug: string, layerId?: string) => void;
}

export function HubShell({ games, onOpenGame }: HubShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ExplorationStatus>('all');

  const availableGenres = useMemo(() => getAllGenres(games), [games]);

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return games.filter((entry) => {
      const { manifest } = entry;

      if (selectedStatus !== 'all' && getGameStatus(entry) !== selectedStatus) {
        return false;
      }

      if (selectedGenre !== 'all' && !manifest.genres.includes(selectedGenre)) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        manifest.title,
        manifest.subtitle,
        manifest.studio,
        ...manifest.genres,
        ...manifest.maps.map((mapLayer) => mapLayer.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [games, searchQuery, selectedGenre, selectedStatus]);

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

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedGenre !== 'all' || selectedStatus !== 'all';

  function resetFilters() {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
  }

  return (
    <div className="relative min-h-svh overflow-x-clip bg-[var(--surface-base)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Background Architectural Layers: Tactical Grid + Subtle Ambient Top Glow + Micro-Noise */}
      <div
        aria-hidden="true"
        className="nexus-tactical-grid pointer-events-none fixed inset-0 opacity-75"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
        style={{
          background:
            'radial-gradient(ellipse 68% 50% at 50% -12%, color-mix(in srgb, var(--accent-primary) 13%, transparent), transparent 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="nexus-noise-layer pointer-events-none fixed inset-0 opacity-[0.028]"
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
          resultsCount={filteredGames.length}
          totalCount={games.length}
        />

        {/* Hero / Tactical Telemetry Header */}
        <section className="mt-8 mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2.5 flex items-center gap-2">
              <GlassBadge variant="accent" size="sm" dot>
                Atlas Interativo v0.4
              </GlassBadge>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                IndexedDB Offline-First
              </span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl"
              style={{ fontFamily: 'var(--nexus-font-display)' }}
            >
              Selecione um universo para explorar
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Cada mapa carrega seu próprio manifesto de camadas, marcadores e
              identidade visual. Seu progresso, notas e rotas são salvos
              automaticamente no navegador.
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
                    Jogos
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
                    Camadas
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
                    Pins catalogados
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-white/[0.08]" />

              <div>
                <div className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                  {hubTelemetry.globalPercent}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  Progresso global
                </div>
              </div>
            </div>
          </GlassPanel>
        </section>

        {/* Responsive Game Cards Grid */}
        <main className="flex-1">
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredGames.map((entry) => (
                <GameCard
                  key={entry.manifest.id}
                  entry={entry}
                  onOpenGame={onOpenGame}
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
                  Nenhum mapa encontrado
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Não há jogos correspondentes aos filtros atuais. Ajuste sua busca
                  ou limpe os filtros para visualizar todo o catálogo.
                </p>
                {hasActiveFilters && (
                  <NeonButton
                    variant="glass"
                    active
                    onClick={resetFilters}
                    leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                    className="mt-2"
                  >
                    Limpar filtros
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
          <span>
            Progresso, notas e rotas salvos localmente em IndexedDB (Offline-First)
          </span>
        </footer>
      </div>
    </div>
  );
}
