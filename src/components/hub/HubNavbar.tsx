import { Database, MonitorDown, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LanguageSelector, useI18n } from '../../core/i18n';
import { DesktopPinButton, GlassBadge, GlassInput, NeonButton, NexusLogo } from '../glass';

export interface HubNavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resultsCount: number;
  totalCount: number;
  showInstallButton?: boolean;
  onInstallClick?: () => void;
  onBackupClick?: () => void;
}

export function HubNavbar({
  searchQuery,
  onSearchChange,
  resultsCount,
  totalCount,
  showInstallButton = false,
  onInstallClick,
  onBackupClick,
}: HubNavbarProps) {
  const { t } = useI18n();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090d16]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_42%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,var(--accent-primary)_10%,rgba(7,9,13,0.9))] shadow-[0_0_16px_-4px_var(--accent-glow)] md:h-9 md:w-9">
            <NexusLogo className="h-4.5 w-4.5 md:h-5.5 md:w-5.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="truncate text-sm font-bold tracking-tight text-[var(--text-primary)] md:text-base"
                style={{ fontFamily: 'var(--nexus-font-display)' }}
              >
                NEXUS MAPS
              </span>
              <GlassBadge variant="accent" size="sm" className="hidden sm:inline-flex">
                HUB
              </GlassBadge>
            </div>
            <p className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] xl:block">
              {t('hub.tagline')}
            </p>
          </div>
        </div>

        {/* Global Search Input (Desktop / Tablet >= md) */}
        <div className="hidden flex-1 md:block md:max-w-sm lg:max-w-md xl:max-w-lg">
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
                <kbd className="hidden rounded border border-white/12 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)] lg:inline-block">
                  Ctrl K
                </kbd>
              )
            }
          />
        </div>

        {/* Right Actions: Pin (Tauri) + Install + Language + Offline First + Counter */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:flex">
            <DesktopPinButton />
          </div>
          {showInstallButton && onInstallClick && (
            <>
              <button
                type="button"
                onClick={onInstallClick}
                aria-label={t('pwa.installButton')}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(7,9,13,0.8))] px-2 py-1.5 text-[11px] font-semibold text-[var(--accent-primary)] transition-colors active:scale-95 md:hidden"
              >
                <MonitorDown className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xs:inline">App</span>
              </button>
              <div className="hidden md:flex">
                <NeonButton
                  size="sm"
                  variant="glass"
                  active
                  onClick={onInstallClick}
                  leftIcon={<MonitorDown className="h-3.5 w-3.5" />}
                >
                  {t('pwa.installButton')}
                </NeonButton>
              </div>
            </>
          )}
          <LanguageSelector />
          <div className="hidden xl:flex">
            <button
              type="button"
              onClick={onBackupClick}
              title={t('hub.offlineFirstTooltip')}
              aria-label={`${t('hub.offlineFirst')} (${isOnline ? t('hub.statusOnline') : t('hub.statusOffline')}) — ${t('hub.offlineFirstTooltip')}`}
              className="neon-focus-ring group inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--glass-border)] bg-[rgba(13,17,24,0.72)] px-2.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-md transition-colors hover:border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] hover:text-[var(--text-primary)] select-none"
            >
              <span
                aria-hidden="true"
                className={
                  isOnline
                    ? 'h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]'
                    : 'h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]'
                }
              />
              <Database className="h-3 w-3 shrink-0 text-[var(--accent-primary)] opacity-90" />
              <span>{t('hub.offlineFirst')}</span>
            </button>
          </div>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[11px] font-medium text-[var(--text-secondary)]">
            {resultsCount}/{totalCount}
          </span>
        </div>
      </div>
    </header>
  );
}
