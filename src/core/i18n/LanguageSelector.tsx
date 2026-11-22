import { Globe } from 'lucide-react';
import { SUPPORTED_LOCALES } from './dictionaries';
import { useI18n } from './useI18n';

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label="Selecionar idioma"
      className="inline-flex items-center gap-0.5 rounded-lg border border-[var(--glass-border)] bg-[rgba(7,9,13,0.62)] p-0.5 backdrop-blur-md"
    >
      <Globe
        aria-hidden="true"
        className="mr-0.5 ml-1.5 h-3.5 w-3.5 text-[var(--text-muted)]"
      />
      {SUPPORTED_LOCALES.map((item) => {
        const isActive = locale === item.code;
        return (
          <button
            key={item.code}
            type="button"
            title={item.label}
            aria-pressed={isActive}
            onClick={() => setLocale(item.code)}
            className={[
              'neon-focus-ring cursor-pointer rounded-md px-1.5 py-1 font-mono text-[10px] font-semibold transition-all duration-150',
              isActive
                ? 'bg-[color-mix(in_srgb,var(--accent-primary)_18%,rgba(13,17,24,0.9))] text-[var(--accent-primary)] shadow-[0_0_12px_-3px_var(--accent-glow)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
}
