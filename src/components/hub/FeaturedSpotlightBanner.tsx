import { ArrowUpRight, Flame, MapPin, Radio, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../core/i18n';
import { getTotalPinsCount } from '../../data/games';
import type { HubGameEntry } from '../../types/schema';
import { PlatformIcons } from './PlatformIcons';

export interface FeaturedSpotlightBannerProps {
  entry: HubGameEntry;
  onOpenGame: (slug: string, layerId?: string) => void;
  onHoverAccent?: (accent: string | null) => void;
}

const LEONIDA_REGIONS = [
  'Vice City',
  'Leonida Keys',
  'Grassrivers',
  'Port Gellhorn',
  'Ambrosia',
  'Mount Kalaga',
];

const PARTICLES = [
  { left: '12%', top: '24%', size: 4, delay: '0s', duration: '8.5s' },
  { left: '28%', top: '72%', size: 3, delay: '1.8s', duration: '10.2s' },
  { left: '46%', top: '18%', size: 5, delay: '3.1s', duration: '9.4s' },
  { left: '64%', top: '66%', size: 3, delay: '0.9s', duration: '11s' },
  { left: '78%', top: '28%', size: 4, delay: '2.4s', duration: '8.8s' },
  { left: '89%', top: '58%', size: 3, delay: '4.0s', duration: '9.6s' },
];

export function FeaturedSpotlightBanner({
  entry,
  onOpenGame,
  onHoverAccent,
}: FeaturedSpotlightBannerProps) {
  const { t } = useI18n();
  const { manifest, progress } = entry;
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const accentPrimary = manifest.theme.accentPrimary;
  const accentSecondary = manifest.theme.accentSecondary;
  const totalPins = getTotalPinsCount(manifest);
  const foundPins = progress.foundMarkersCount;
  const pct = totalPins > 0 ? Math.min(100, Math.round((foundPins / totalPins) * 100)) : 0;

  const bannerSrc = manifest.assets.bannerImage ?? manifest.assets.coverImage;
  const logoSrc = manifest.assets.logoImage;
  const primaryLayerId = manifest.maps[0]?.id;

  return (
    <section
      className="group relative mb-9 overflow-hidden rounded-2xl border transition-all duration-300"
      style={{
        borderColor: `color-mix(in srgb, ${accentPrimary} 34%, rgba(255, 255, 255, 0.12))`,
        backgroundColor: manifest.theme.surfaceBase,
        boxShadow: `0 22px 54px -24px color-mix(in srgb, ${accentPrimary} 45%, rgba(0, 0, 0, 0.9))`,
      }}
      onMouseEnter={() => onHoverAccent?.(accentPrimary)}
      onMouseLeave={() => onHoverAccent?.(null)}
    >
      {/* Panoramic Artwork Background */}
      {bannerSrc && !bannerFailed && (
        <img
          src={bannerSrc}
          alt={manifest.title}
          onError={() => setBannerFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-50 transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}

      {/* Sunset Neon Gradient Wash driven by manifest theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(105deg, rgba(10, 5, 16, 0.95) 0%, rgba(16, 7, 24, 0.84) 44%, color-mix(in srgb, ${accentPrimary} 20%, rgba(12, 6, 18, 0.56)) 76%, color-mix(in srgb, ${accentSecondary} 24%, rgba(10, 5, 16, 0.78)) 100%)`,
        }}
      />

      {/* Ambient Radial Glow Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-8 h-72 w-72 rounded-full blur-3xl opacity-35 transition-opacity duration-500 group-hover:opacity-55"
        style={{
          background: `radial-gradient(circle, ${accentPrimary} 0%, transparent 70%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full blur-3xl opacity-25 transition-opacity duration-500 group-hover:opacity-40"
        style={{
          background: `radial-gradient(circle, ${accentSecondary} 0%, transparent 70%)`,
        }}
      />

      {/* Slow Drifting Neon Particles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className="nexus-spotlight-particle absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: idx % 2 === 0 ? accentPrimary : accentSecondary,
              boxShadow: `0 0 12px ${idx % 2 === 0 ? accentPrimary : accentSecondary}`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Top Glass Specular Rim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${accentPrimary} 65%, white) 35%, color-mix(in srgb, ${accentSecondary} 65%, white) 75%, transparent 100%)`,
        }}
      />

      {/* Panoramic Content Layout */}
      <div className="relative z-10 flex flex-col justify-between gap-6 p-5 sm:p-7 lg:min-h-[268px] lg:flex-row lg:items-end lg:p-8">
        {/* Left: Spotlight Identity, Badges & Lore */}
        <div className="max-w-2xl space-y-3.5">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md"
              style={{
                color: accentPrimary,
                borderColor: `color-mix(in srgb, ${accentPrimary} 45%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentPrimary} 14%, rgba(10, 5, 16, 0.7))`,
              }}
            >
              <Flame className="h-3 w-3" />
              {t('hub.featuredTag')}
            </span>

            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider backdrop-blur-md"
              style={{
                color: accentSecondary,
                borderColor: `color-mix(in srgb, ${accentSecondary} 40%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${accentSecondary} 12%, rgba(10, 5, 16, 0.65))`,
              }}
            >
              <Sparkles className="h-3 w-3" />
              {t('hub.featuredBadgeRelease')}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-200 backdrop-blur-md">
              <Radio className="h-3 w-3 text-emerald-400" />
              {t('hub.featuredBadgeOnline')}
            </span>
          </div>

          {/* Title / Logo + Studio Meta */}
          <div className="flex flex-wrap items-center gap-3.5">
            {logoSrc && !logoFailed ? (
              <img
                src={logoSrc}
                alt={manifest.title}
                onError={() => setLogoFailed(true)}
                className="h-12 w-auto max-w-[210px] object-contain drop-shadow-[0_4px_18px_rgba(255,77,158,0.45)] sm:h-14"
              />
            ) : (
              <h2
                className="bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl"
                style={{
                  fontFamily: manifest.theme.fontDisplay ?? 'var(--nexus-font-display)',
                  backgroundImage: `linear-gradient(90deg, #ffffff 0%, ${accentPrimary} 55%, ${accentSecondary} 100%)`,
                }}
              >
                {manifest.title}
              </h2>
            )}

            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <span className="font-mono uppercase tracking-wider text-slate-400">
                {manifest.studio} · {manifest.releaseYear}
              </span>
              {manifest.platforms && manifest.platforms.length > 0 && (
                <PlatformIcons platforms={manifest.platforms} />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="max-w-xl text-sm leading-relaxed text-slate-200/90">
            {t('hub.featuredDesc')}
          </p>

          {/* Leonida Regions Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {LEONIDA_REGIONS.map((region) => (
              <span
                key={region}
                className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-slate-300 backdrop-blur-sm"
              >
                {region}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Progress Card & Primary CTA */}
        <div className="flex w-full flex-col gap-3.5 rounded-xl border border-white/12 bg-black/50 p-4 backdrop-blur-xl lg:w-[310px] lg:shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-300">
              <MapPin className="h-3.5 w-3.5" style={{ color: accentPrimary }} />
              {t('hub.featuredProgress')}
            </span>
            <span
              className="font-mono text-xs font-semibold"
              style={{ color: accentPrimary }}
            >
              {pct}% ({foundPins}/{totalPins.toLocaleString('pt-BR')})
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(pct, foundPins > 0 ? 3 : 0)}%`,
                backgroundImage: `linear-gradient(90deg, ${accentPrimary}, ${accentSecondary})`,
                boxShadow: `0 0 12px ${accentPrimary}`,
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenGame(manifest.slug, primaryLayerId)}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-[#09050e] transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            style={{
              backgroundImage: `linear-gradient(95deg, ${accentPrimary} 0%, ${accentSecondary} 100%)`,
              boxShadow: `0 0 26px color-mix(in srgb, ${accentPrimary} 45%, transparent)`,
            }}
          >
            <span>{t('hub.featuredCta')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
