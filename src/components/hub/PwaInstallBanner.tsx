import { MonitorDown, Share, Smartphone, X } from 'lucide-react';
import { useEffect } from 'react';
import { useI18n } from '../../core/i18n';
import { GlassPanel, NeonButton } from '../glass';

export interface PwaInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function PwaInstallBanner({
  onInstall,
  onDismiss,
}: PwaInstallBannerProps) {
  const { t } = useI18n();

  return (
    <div className="mt-4">
      <GlassPanel
        variant="subtle"
        padding="none"
        className="border-[color-mix(in_srgb,var(--accent-primary)_26%,rgba(255,255,255,0.08))]"
      >
        <div className="flex flex-col gap-3 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,rgba(7,9,13,0.7))] text-[var(--accent-primary)]">
              <MonitorDown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
                {t('pwa.bannerTitle')}
              </p>
              <p className="truncate text-[11px] text-[var(--text-secondary)]">
                {t('pwa.bannerDesc')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <NeonButton
              size="sm"
              variant="glass"
              active
              onClick={onInstall}
              leftIcon={<MonitorDown className="h-3.5 w-3.5" />}
            >
              {t('pwa.installButton')}
            </NeonButton>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t('pwa.dismiss')}
              title={t('pwa.dismiss')}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

export interface PwaInstallModalProps {
  open: boolean;
  onClose: () => void;
}

export function PwaInstallModal({ open, onClose }: PwaInstallModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-modal-title"
      onClick={onClose}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <GlassPanel variant="elevated" padding="md" cornerMarks>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_38%,transparent)] bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(7,9,13,0.85))] text-[var(--accent-primary)]">
                <MonitorDown className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2
                  id="pwa-install-modal-title"
                  className="text-base font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--nexus-font-display)' }}
                >
                  {t('pwa.modalTitle')}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('pwa.modalSubtitle')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('pwa.close')}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {/* Desktop Instructions */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                <MonitorDown className="h-3.5 w-3.5" />
                <span>{t('pwa.desktopTitle')}</span>
              </div>
              <ol className="space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--text-secondary)] list-decimal">
                <li>{t('pwa.desktopStep1')}</li>
                <li>{t('pwa.desktopStep2')}</li>
              </ol>
            </div>

            {/* Mobile Instructions */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                <Smartphone className="h-3.5 w-3.5" />
                <span>{t('pwa.mobileTitle')}</span>
                <Share className="ml-auto h-3.5 w-3.5 text-[var(--text-muted)]" />
              </div>
              <ol className="space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--text-secondary)] list-decimal">
                <li>{t('pwa.mobileStep1')}</li>
                <li>{t('pwa.mobileStep2')}</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <NeonButton size="sm" variant="glass" active onClick={onClose}>
              {t('pwa.close')}
            </NeonButton>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
