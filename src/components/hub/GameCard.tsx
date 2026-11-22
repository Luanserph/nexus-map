import { ArrowUpRight, CheckCircle2, Clock, Layers, MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';
import { DEFAULT_FONT_DISPLAY } from '../../core/theme-engine';
import {
  getCompletionPercent,
  getGameStatus,
  getTotalPinsCount,
} from '../../data/games';
import type { HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassPanel } from '../glass';
import { GameCoverArt } from './GameCoverArt';

export interface GameCardProps {
  entry: HubGameEntry;
  onOpenGame: (slug: string, layerId?: string) => void;
}

const statusConfig = {
  completed: {
    label: 'Concluído',
    variant: 'success' as const,
  },
  'in-progress': {
    label: 'Em progresso',
    variant: 'accent' as const,
  },
  'not-started': {
    label: 'Não iniciado',
    variant: 'neutral' as const,
  },
};

export function GameCard({ entry, onOpenGame }: GameCardProps) {
  const { manifest, progress } = entry;
  const { theme } = manifest;
  const totalPins = getTotalPinsCount(manifest);
  const percent = getCompletionPercent(entry);
  const status = getGameStatus(entry);
  const statusMeta = statusConfig[status];
  const badgeStyle = theme.badgeStyle ?? 'minimal';

  /**
   * Scoped theme preview variables from manifest.json — keeps the Hub neutral
   * while previewing each game's chromatic signature on hover.
   */
  const scopedThemeVars = {
    '--accent-primary': theme.accentPrimary,
    '--accent-secondary': theme.accentSecondary,
    '--accent-glow': theme.accentGlow,
    '--glass-tint': theme.glassTint,
    '--glass-bg': theme.glassTint,
    '--nexus-font-display': theme.fontDisplay ?? DEFAULT_FONT_DISPLAY,
  } as CSSProperties;

  function handleOpen() {
    onOpenGame(manifest.slug, progress.activeLayerId ?? manifest.maps[0]?.id);
  }

  return (
    <GlassPanel
      padding="none"
      style={scopedThemeVars}
      onClick={handleOpen}
      className="group/card nexus-game-card flex h-full cursor-pointer flex-col"
    >
      {/* Top 2px identity accent bar */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full opacity-75 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            'linear-gradient(90deg, var(--accent-primary) 0%, color-mix(in srgb, var(--accent-secondary) 70%, transparent) 65%, transparent 100%)',
        }}
      />

      {/* Cover Art (real coverImage with automatic procedural fallback) & Floating Badges */}
      <div className="relative">
        <GameCoverArt
          title={manifest.title}
          imageUrl={manifest.assets.coverImage ?? manifest.assets.bannerImage}
          theme={theme}
          layersCount={manifest.maps.length}
          releaseYear={manifest.releaseYear}
        />

        {/* Top-left Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <GlassBadge variant={statusMeta.variant} badgeStyle={badgeStyle} dot>
            {statusMeta.label}
          </GlassBadge>
        </div>

        {/* Top-right Game Color Identity Indicator */}
        <div
          title={`Identidade cromática: ${theme.accentPrimary} / ${theme.accentSecondary}`}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-white/12 bg-[rgba(7,9,13,0.72)] px-2 py-1 backdrop-blur-md"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 0 8px var(--accent-glow)',
            }}
          />
          <span
            className="h-2 w-2 rounded-full opacity-85"
            style={{ backgroundColor: 'var(--accent-secondary)' }}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">
            {theme.accentPrimary}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Title & Studio */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2
              className="text-xl font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-200 group-hover/card:text-white"
              style={{ fontFamily: 'var(--nexus-font-display)' }}
            >
              {manifest.title}
            </h2>
            {status === 'completed' && (
              <CheckCircle2
                className="mt-1 h-4 w-4 shrink-0 text-emerald-400"
                aria-label="Mapa 100% concluído"
              />
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            {manifest.subtitle}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)]">
            {manifest.studio}
          </p>
        </div>

        {/* Genre Chips */}
        <div className="flex flex-wrap gap-1.5">
          {manifest.genres.map((genre) => (
            <GlassBadge key={genre} variant="muted" size="sm">
              {genre}
            </GlassBadge>
          ))}
        </div>

        {/* Telemetry Counters: Maps & Pins */}
        <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-white/[0.06] bg-[rgba(7,9,13,0.45)] p-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)] opacity-85" />
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {manifest.maps.length}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Camadas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/[0.06] pl-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-primary)] opacity-85" />
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {totalPins.toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Pins totais
              </div>
            </div>
          </div>
        </div>

        {/* Local Progress Bar */}
        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Progresso local</span>
            <span className="font-mono text-xs text-[var(--text-primary)]">
              <span className="text-[var(--accent-primary)]">{percent}%</span>
              <span className="ml-1.5 text-[11px] text-[var(--text-muted)]">
                ({progress.foundMarkersCount.toLocaleString('pt-BR')}/
                {totalPins.toLocaleString('pt-BR')})
              </span>
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso em ${manifest.title}`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percent}%`,
                backgroundColor: 'var(--accent-primary)',
                boxShadow: percent > 0 ? '0 0 12px var(--accent-glow)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Footer Action Row */}
        <div className="flex items-center justify-between border-t border-white/[0.07] pt-3.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5" />
            <span>{progress.lastVisitedAt ?? 'Nunca acessado'}</span>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
            className="neon-focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent-primary)_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)] hover:text-white hover:shadow-[0_0_16px_-4px_var(--accent-glow)]"
          >
            <span>{status === 'not-started' ? 'Explorar' : 'Continuar'}</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
