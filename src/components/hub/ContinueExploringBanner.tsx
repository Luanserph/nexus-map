import { ArrowRight, Compass, Layers } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useI18n } from '../../core/i18n';
import { DEFAULT_FONT_DISPLAY } from '../../core/theme-engine';
import { getCompletionPercent, getTotalPinsCount } from '../../data/games';
import type { HubGameEntry } from '../../types/schema';
import { GlassBadge, GlassPanel, NeonButton } from '../glass';
import { ProceduralCartographicArt } from './GameCoverArt';

export interface ContinueExploringBannerProps {
  entry: HubGameEntry;
  lastMapId?: string;
  onResume: (slug: string, layerId?: string) => void;
  onHoverAccent?: (accent: string | null) => void;
}

export function ContinueExploringBanner({
  entry,
  lastMapId,
  onResume,
  onHoverAccent,
}: ContinueExploringBannerProps) {
  const { t } = useI18n();
  const { manifest, progress } = entry;
  const { theme } = manifest;
  const [imgFailed, setImgFailed] = useState(false);

  const activeMap =
    manifest.maps.find((m) => m.id === lastMapId) ?? manifest.maps[0];
  const totalPins = getTotalPinsCount(manifest);
  const percent = getCompletionPercent(entry);
  const bannerUrl = manifest.assets.bannerImage ?? manifest.assets.coverImage;
  const showImage = Boolean(bannerUrl && !imgFailed);

  const scopedVars = {
    '--accent-primary': theme.accentPrimary,
    '--accent-secondary': theme.accentSecondary,
    '--accent-glow': theme.accentGlow,
    '--glass-bg': theme.glassTint,
    '--nexus-font-display': theme.fontDisplay ?? DEFAULT_FONT_DISPLAY,
  } as CSSProperties;

  return (
    <section className="mb-7">
      <GlassPanel
        variant="elevated"
        padding="none"
        cornerMarks
        style={scopedVars}
        onMouseEnter={() => onHoverAccent?.(theme.accentPrimary)}
        onMouseLeave={() => onHoverAccent?.(null)}
        className="group/banner relative overflow-hidden border-[color-mix(in_srgb,var(--accent-primary)_35%,rgba(255,255,255,0.10))] transition-all duration-300 hover:border-[color-mix(in_srgb,var(--accent-primary)_60%,rgba(255,255,255,0.16))] hover:shadow-[0_0_32px_-10px_var(--accent-glow)]"
      >
        {/* Widescreen darkened background artwork */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {showImage ? (
            <img
              src={bannerUrl}
              alt=""
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover/banner:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full opacity-40">
              <ProceduralCartographicArt pattern={theme.backgroundPattern} />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(7,9,13,0.95) 0%, rgba(7,9,13,0.82) 52%, rgba(7,9,13,0.58) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 90% at 92% 50%, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 70%)',
            }}
          />
        </div>

        {/* Content Row */}
        <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge
                variant="accent"
                badgeStyle={theme.badgeStyle ?? 'minimal'}
                size="sm"
                dot
                icon={<Compass className="h-3 w-3" />}
              >
                {t('hub.continueExploring')}
              </GlassBadge>
              {activeMap && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  <Layers className="h-3 w-3 text-[var(--accent-primary)]" />
                  {t('hub.lastActiveMap')}:{' '}
                  <strong className="font-medium text-[var(--text-primary)]">
                    {activeMap.name}
                  </strong>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                className="truncate text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl"
                style={{ fontFamily: 'var(--nexus-font-display)' }}
              >
                {manifest.title}
              </h2>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {manifest.studio}
              </span>
            </div>

            {/* Compact Progress Bar */}
            <div className="flex max-w-md items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.09]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: 'var(--accent-primary)',
                    boxShadow: percent > 0 ? '0 0 12px var(--accent-glow)' : 'none',
                  }}
                />
              </div>
              <span className="shrink-0 font-mono text-xs text-[var(--text-secondary)]">
                <strong className="text-[var(--accent-primary)]">{percent}%</strong>{' '}
                ({progress.foundMarkersCount.toLocaleString('pt-BR')}/
                {totalPins.toLocaleString('pt-BR')})
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <NeonButton
              variant="primary"
              size="lg"
              onClick={() => onResume(manifest.slug, activeMap?.id)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {t('hub.resumeExploration')}
            </NeonButton>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
