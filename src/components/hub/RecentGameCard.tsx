import { ArrowUpRight, Layers, MapPin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../core/i18n';
import { getTotalPinsCount } from '../../data/games';
import type { HubGameEntry } from '../../types/schema';
import { PlatformIcons } from './PlatformIcons';

export interface RecentGameCardProps {
  entry: HubGameEntry;
  onOpenGame: (slug: string, layerId?: string) => void;
  onHoverAccent?: (accent: string | null) => void;
}

export function RecentGameCard({
  entry,
  onOpenGame,
  onHoverAccent,
}: RecentGameCardProps) {
  const { t } = useI18n();
  const { manifest, progress } = entry;
  const [imgFailed, setImgFailed] = useState(false);

  const accent = manifest.theme.accentPrimary;
  const totalPins = getTotalPinsCount(manifest);
  const foundPins = progress.foundMarkersCount;
  const pct = totalPins > 0 ? Math.min(100, Math.round((foundPins / totalPins) * 100)) : 0;
  const coverSrc = manifest.assets.coverImage ?? manifest.assets.bannerImage;

  return (
    <button
      type="button"
      onClick={() => onOpenGame(manifest.slug, manifest.maps[0]?.id)}
      onMouseEnter={() => onHoverAccent?.(accent)}
      onMouseLeave={() => onHoverAccent?.(null)}
      className="group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-[var(--glass-bg)] p-3 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20"
      style={{
        boxShadow: `0 10px 28px -18px color-mix(in srgb, ${accent} 45%, rgba(0, 0, 0, 0.85))`,
      }}
    >
      {/* Left Thumbnail */}
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/50 sm:h-22 sm:w-32">
        {coverSrc && !imgFailed ? (
          <img
            src={coverSrc}
            alt={manifest.title}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-mono text-xs uppercase tracking-widest text-white/60"
            style={{
              background: `linear-gradient(135deg, ${manifest.theme.surfaceBase}, color-mix(in srgb, ${accent} 30%, #06090f))`,
            }}
          >
            {manifest.slug}
          </div>
        )}
        <span
          className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#07090d]"
          style={{ backgroundColor: accent }}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {t('hub.recentNew')}
        </span>
      </div>

      {/* Right Info */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3
              className="truncate text-sm font-bold text-[var(--text-primary)] sm:text-base"
              style={{ fontFamily: manifest.theme.fontDisplay ?? 'var(--nexus-font-display)' }}
            >
              {manifest.title}
            </h3>
            <p className="truncate text-[11px] text-[var(--text-secondary)]">
              {manifest.subtitle} · {manifest.releaseYear}
            </p>
          </div>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: accent }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-3 font-mono">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" style={{ color: accent }} />
              {totalPins.toLocaleString('pt-BR')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3 text-slate-400" />
              {manifest.maps.length}
            </span>
          </div>
          {manifest.platforms && manifest.platforms.length > 0 && (
            <PlatformIcons platforms={manifest.platforms} />
          )}
        </div>

        {/* Mini Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: accent,
              }}
            />
          </div>
          <span className="font-mono text-[10px] font-medium" style={{ color: accent }}>
            {pct}%
          </span>
        </div>
      </div>
    </button>
  );
}
