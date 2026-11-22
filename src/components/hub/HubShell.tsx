import { Compass, Layers, MapPin, RotateCcw, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  HUB_GAMES,
  getAllGenres,
  getCompletionPercent,
  getGameStatus,
} from '../../data/games/registry';
import type { ExplorationStatus, HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';
import { GameCard } from './GameCard';
import { HubNavbar } from './HubNavbar';

export function HubShell() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<ExplorationStatus>('all');
  const [selectedGame, setSelectedGame] = useState<HubGameEntry | null>(null);

  const availableGenres = useMemo(() => getAllGenres(HUB_GAMES), []);

  const filteredGames = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return HUB_GAMES.filter((entry) => {
      const { manifest } = entry;

      if (selectedStatus !== 'all' && getGameStatus(entry) !== selectedStatus) {
        return false;
      }

      if (selectedGenre !== 'all' && !manifest.genre.includes(selectedGenre)) {
        return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [
        manifest.title,
        manifest.subtitle,
        manifest.developer,
        ...manifest.genre,
        ...manifest.layers.map((layer) => layer.name),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedGenre, selectedStatus]);

  const hubTelemetry = useMemo(() => {
    const totalLayers = HUB_GAMES.reduce((acc, g) => acc + g.manifest.layers.length, 0);
    const totalMarkers = HUB_GAMES.reduce(
      (acc, g) => acc + g.manifest.totalMarkersCount,
      0
    );
    const totalFound = HUB_GAMES.reduce(
      (acc, g) => acc + g.progress.foundMarkersCount,
      0
    );
    const globalPercent =
      totalMarkers > 0 ? Math.round((totalFound / totalMarkers) * 100) : 0;

    return { totalLayers, totalMarkers, totalFound, globalPercent };
  }, []);

  useEffect(() => {
    if (!selectedGame) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedGame(null);
      }
    }

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedGame]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedGenre !== 'all' || selectedStatus !== 'all';

  function resetFilters() {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedStatus('all');
  }

  return (
    <div
      data-game-theme="hub-default"
      className="relative min-h-svh overflow-x-clip bg-[var(--surface-base)] text-[var(--text-primary)]"
    >
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
          totalCount={HUB_GAMES.length}
        />

        {/* Hero / Tactical Telemetry Header */}
        <section className="mt-8 mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2.5 flex items-center gap-2">
              <GlassBadge variant="accent" size="sm" dot>
                Atlas Interativo v0.1
              </GlassBadge>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                Data-Driven Manifests
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
              identidade visual. Passe o cursor sobre um jogo para antecipar sua
              assinatura cromática.
            </p>
          </div>

          {/* Compact Telemetry Strip */}
          <GlassPanel variant="subtle" padding="sm" className="shrink-0">
            <div className="flex flex-wrap items-center gap-5 px-1">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[var(--accent-primary)]" />
                <div>
                  <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {HUB_GAMES.length}
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
                  key={entry.manifest.slug}
                  entry={entry}
                  isSelected={selectedGame?.manifest.slug === entry.manifest.slug}
                  onSelect={setSelectedGame}
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
            Progresso salvo localmente (mock na Etapa 1 · IndexedDB nas próximas etapas)
          </span>
        </footer>
      </div>

      {/* Manifest & Dynamic Theme Preview Modal */}
      {selectedGame && (
        <GameManifestPreviewModal
          entry={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}

function GameManifestPreviewModal({
  entry,
  onClose,
}: {
  entry: HubGameEntry;
  onClose: () => void;
}) {
  const { manifest, progress } = entry;
  const { theme } = manifest;
  const percent = getCompletionPercent(entry);

  const scopedThemeVars = {
    '--accent-primary': theme.accentPrimary,
    '--accent-secondary': theme.accentSecondary,
    '--accent-glow': theme.accentGlow,
    '--glass-bg-elevated': theme.glassBg,
    '--nexus-font-display': theme.fontDisplay,
  } as CSSProperties;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        style={scopedThemeVars}
        className="w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <GlassPanel variant="elevated" padding="lg" cornerMarks accentActive>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <GlassBadge
                  variant="accent"
                  badgeStyle={theme.badgeStyle}
                  icon={<Sparkles className="h-3 w-3" />}
                >
                  Theme Engine Preview
                </GlassBadge>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  manifest.json
                </span>
              </div>
              <h2
                id="manifest-preview-title"
                className="text-2xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--nexus-font-display)' }}
              >
                {manifest.title}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {manifest.subtitle} · {manifest.developer} ({manifest.releaseYear})
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar pré-visualização"
              className="neon-focus-ring flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Layers List */}
          <div className="mt-5 space-y-2">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Camadas declaradas ({manifest.layers.length})
            </h3>
            <div className="space-y-1.5">
              {manifest.layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/30 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-[var(--text-primary)]">
                    {layer.name}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    z:{layer.minZoom}–{layer.maxZoom}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress & Next Stage Info */}
          <div className="mt-5 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,rgba(7,9,13,0.6))] p-3.5 text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">
              Progresso local mockado: {percent}% (
              {progress.foundMarkersCount.toLocaleString('pt-BR')} de{' '}
              {manifest.totalMarkersCount.toLocaleString('pt-BR')} pins)
            </p>
            <p className="mt-1 text-[var(--text-secondary)]">
              A viewport interativa WebGL (MapLibre + Tile Pyramid) será conectada a
              este manifesto nas próximas etapas.
            </p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <NeonButton variant="glass" onClick={onClose}>
              Fechar (ESC)
            </NeonButton>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
