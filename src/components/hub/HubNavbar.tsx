import { Database, MonitorDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { getGenreLabel, LanguageSelector, useI18n } from '../../core/i18n';
import type { TranslationKey } from '../../core/i18n';
import type { ExplorationStatus } from '../../types/schema';
import { GlassBadge, GlassInput, GlassPanel, NeonButton, NexusLogo } from '../glass';

export interface HubNavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  selectedStatus: ExplorationStatus;
  onStatusChange: (status: ExplorationStatus) => void;
  resultsCount: number;
  totalCount: number;
  showInstallButton?: boolean;
  onInstallClick?: () => void;
}

const STATUS_OPTIONS: { value: ExplorationStatus; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'hub.statusAll' },
  { value: 'in-progress', labelKey: 'hub.statusInProgress' },
  { value: 'completed', labelKey: 'hub.statusCompleted' },
  { value: 'not-started', labelKey: 'hub.statusNotStarted' },
];

export function HubNavbar({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
  selectedStatus,
  onStatusChange,
  resultsCount,
  totalCount,
  showInstallButton = false,
  onInstallClick,
}: HubNavbarProps) {
  const { t, locale } = useI18n();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        event.key === 'Escape' &&
        document.activeElement === searchInputRef.current
      ) {
        if (searchQuery) {
          onSearchChange('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onSearchChange]);

  return (
    <>
      {/* ================================================================= */}
      {/* MOBILE (< md): THIN OPAQUE STICKY TOP BAR + SCROLLABLE FILTERS    */}
      {/* ================================================================= */}
      <div className="md:hidden">
        {/* Thin, opaque sticky brand & quick-actions bar */}
        <header className="sticky top-0 z-40 -mx-4 border-b border-white/[0.08] bg-[#07090f]/95 px-3.5 py-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            {/* Compact Brand */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_42%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,var(--accent-primary)_10%,rgba(7,9,13,0.85))]">
                <NexusLogo className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--nexus-font-display)' }}
                  >
                    NEXUS MAPS
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Right Actions (Install + Language) — never overflows 390px */}
            <div className="flex shrink-0 items-center gap-1.5">
              {showInstallButton && onInstallClick && (
                <button
                  type="button"
                  onClick={onInstallClick}
                  aria-label={t('pwa.installButton')}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(7,9,13,0.8))] px-2 py-1.5 text-[11px] font-semibold text-[var(--accent-primary)] transition-colors active:scale-95"
                >
                  <MonitorDown className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden xs:inline">App</span>
                </button>
              )}
              <LanguageSelector />
            </div>
          </div>
        </header>

        {/* Non-sticky Search & Horizontal-Scroll Filters (scrolls naturally above cards) */}
        <div className="mt-3 space-y-2.5 rounded-xl border border-white/[0.08] bg-[var(--glass-bg)] p-3 backdrop-blur-xl">
          <GlassInput
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('hub.searchPlaceholder')}
            aria-label={t('hub.searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            rightSlot={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpar busca"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                  {resultsCount}/{totalCount}
                </span>
              )
            }
          />

          {/* Status Chips — single horizontal scrollable row */}
          <div
            className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t('hub.status')}
          >
            <span className="mr-0.5 inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              <SlidersHorizontal className="h-3 w-3" />
              {t('hub.status')}
            </span>
            {STATUS_OPTIONS.map((option) => (
              <NeonButton
                key={option.value}
                size="sm"
                variant="glass"
                active={selectedStatus === option.value}
                onClick={() => onStatusChange(option.value)}
                className="shrink-0 whitespace-nowrap"
              >
                {t(option.labelKey)}
              </NeonButton>
            ))}
          </div>

          {/* Genre Chips — horizontal carousel (never wraps into 5 lines) */}
          <div
            className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] pt-2 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t('hub.genre')}
          >
            <span className="mr-0.5 shrink-0 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {t('hub.genre')}
            </span>
            <NeonButton
              size="sm"
              variant="ghost"
              active={selectedGenre === 'all'}
              onClick={() => onGenreChange('all')}
              className="shrink-0 whitespace-nowrap"
            >
              {t('hub.statusAll')}
            </NeonButton>
            {availableGenres.map((genreKey) => (
              <NeonButton
                key={genreKey}
                size="sm"
                variant="ghost"
                active={selectedGenre === genreKey}
                onClick={() => onGenreChange(genreKey)}
                className="shrink-0 whitespace-nowrap"
              >
                {getGenreLabel(genreKey, locale)}
              </NeonButton>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* DESKTOP (>= md): ORIGINAL FULL GLASS STICKY NAVBAR (INTACT)       */}
      {/* ================================================================= */}
      <header className="sticky top-4 z-30 hidden md:block">
        <GlassPanel variant="elevated" padding="sm" cornerMarks className="sm:px-5 sm:py-3.5">
          {/* Top Row: Brand + Global Search + Local Storage Status */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Brand Logo */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_42%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,var(--accent-primary)_10%,rgba(7,9,13,0.85))] shadow-[0_0_16px_-4px_var(--accent-glow)]">
                  <NexusLogo className="h-5.5 w-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-base font-bold tracking-tight text-[var(--text-primary)]"
                      style={{ fontFamily: 'var(--nexus-font-display)' }}
                    >
                      NEXUS MAPS
                    </span>
                    <GlassBadge variant="accent" size="sm">
                      HUB
                    </GlassBadge>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {t('hub.tagline')}
                  </p>
                </div>
              </div>

              {/* Tablet Install & Language Indicator */}
              <div className="flex items-center gap-2 lg:hidden">
                {showInstallButton && onInstallClick && (
                  <NeonButton
                    size="sm"
                    variant="glass"
                    active
                    onClick={onInstallClick}
                    leftIcon={<MonitorDown className="h-3.5 w-3.5" />}
                  >
                    {t('pwa.installButton')}
                  </NeonButton>
                )}
                <LanguageSelector />
              </div>
            </div>

            {/* Global Search Input */}
            <div className="w-full lg:max-w-md xl:max-w-lg">
              <GlassInput
                inputRef={searchInputRef}
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t('hub.searchPlaceholder')}
                aria-label={t('hub.searchPlaceholder')}
                leftIcon={<Search className="h-4 w-4" />}
                rightSlot={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      aria-label="Limpar busca"
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] sm:inline-block">
                      Ctrl K
                    </kbd>
                  )
                }
              />
            </div>

            {/* Desktop Install + Language Selector + Local-First Telemetry Badge */}
            <div className="hidden items-center gap-2.5 lg:flex">
              {showInstallButton && onInstallClick && (
                <NeonButton
                  size="sm"
                  variant="glass"
                  active
                  onClick={onInstallClick}
                  leftIcon={<MonitorDown className="h-3.5 w-3.5" />}
                >
                  {t('pwa.installButton')}
                </NeonButton>
              )}
              <LanguageSelector />
              <GlassBadge
                variant="neutral"
                size="md"
                dot
                icon={<Database className="h-3 w-3 text-[var(--accent-primary)]" />}
              >
                {t('hub.offlineFirst')}
              </GlassBadge>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {resultsCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Bottom Filter Row: Status + Genre */}
          <div className="mt-3 flex flex-col gap-2.5 border-t border-white/[0.07] pt-3 md:flex-row md:items-center md:justify-between">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('hub.status')}>
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                <SlidersHorizontal className="h-3 w-3" />
                {t('hub.status')}
              </span>
              {STATUS_OPTIONS.map((option) => (
                <NeonButton
                  key={option.value}
                  size="sm"
                  variant="glass"
                  active={selectedStatus === option.value}
                  onClick={() => onStatusChange(option.value)}
                >
                  {t(option.labelKey)}
                </NeonButton>
              ))}
            </div>

            {/* Genre Filter */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('hub.genre')}>
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {t('hub.genre')}
              </span>
              <NeonButton
                size="sm"
                variant="ghost"
                active={selectedGenre === 'all'}
                onClick={() => onGenreChange('all')}
              >
                {t('hub.statusAll')}
              </NeonButton>
              {availableGenres.map((genreKey) => (
                <NeonButton
                  key={genreKey}
                  size="sm"
                  variant="ghost"
                  active={selectedGenre === genreKey}
                  onClick={() => onGenreChange(genreKey)}
                >
                  {getGenreLabel(genreKey, locale)}
                </NeonButton>
              ))}
            </div>
          </div>
        </GlassPanel>
      </header>
    </>
  );
}
