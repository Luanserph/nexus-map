import { Check, ChevronDown, Search, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getGenreLabel, useI18n } from '../../core/i18n';

export interface GenreFilterDropdownProps {
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  genreCounts?: Record<string, number>;
}

export function GenreFilterDropdown({
  selectedGenre,
  onGenreChange,
  availableGenres,
  genreCounts,
}: GenreFilterDropdownProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isFiltered = selectedGenre !== 'all';
  const activeLabel = isFiltered
    ? getGenreLabel(selectedGenre, locale)
    : t('hub.statusAll');

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 20);

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredGenres = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!q) return availableGenres;

    return availableGenres.filter((genreKey) => {
      const label = getGenreLabel(genreKey, locale)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return label.includes(q) || genreKey.includes(q);
    });
  }, [availableGenres, locale, query]);

  function handleSelect(genreKey: string) {
    onGenreChange(genreKey);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative flex shrink-0 items-center gap-2">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
          isFiltered || open
            ? 'border-[color-mix(in_srgb,var(--accent-primary)_55%,rgba(255,255,255,0.16))] bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(11,16,27,0.9))] text-[var(--text-primary)] shadow-[0_0_16px_-6px_var(--accent-glow)]'
            : 'border-white/[0.1] bg-white/[0.04] text-[var(--text-secondary)] hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-[var(--text-primary)]'
        }`}
      >
        <Tag
          className={`h-3.5 w-3.5 shrink-0 ${
            isFiltered ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
          }`}
        />
        <span className="whitespace-nowrap text-[var(--text-muted)]">
          {t('hub.genre')}:
        </span>
        <span
          className={`max-w-[150px] truncate font-semibold ${
            isFiltered ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {activeLabel}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
            open ? 'rotate-180 text-[var(--accent-primary)]' : ''
          }`}
        />
      </button>

      {/* Quick Clear Pill when a genre is active */}
      {isFiltered && (
        <button
          type="button"
          onClick={() => handleSelect('all')}
          className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-white/20 hover:bg-white/[0.09] hover:text-[var(--text-primary)]"
        >
          <X className="h-3 w-3" />
          <span>{t('hub.clearFilter')}</span>
        </button>
      )}

      {/* Popover Panel */}
      {open && (
        <div
          role="listbox"
          aria-label={t('hub.genre')}
          className="absolute right-0 top-full z-30 mt-2 w-[min(90vw,390px)] rounded-xl border border-white/[0.12] bg-[#0b101b]/95 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          {/* Internal Search */}
          <div className="relative mb-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('hub.searchGenrePlaceholder')}
              className="w-full rounded-lg border border-white/[0.1] bg-black/40 py-1.5 pl-8 pr-7 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]/60 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar busca de gênero"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* All Genres Option */}
          {!query && (
            <button
              type="button"
              role="option"
              aria-selected={selectedGenre === 'all'}
              onClick={() => handleSelect('all')}
              className={`mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                selectedGenre === 'all'
                  ? 'bg-[var(--accent-primary)]/16 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{t('hub.statusAll')}</span>
              {selectedGenre === 'all' && <Check className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Organized 2-Column Grid */}
          <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto pr-0.5">
            {filteredGenres.map((genreKey) => {
              const active = selectedGenre === genreKey;
              const count = genreCounts?.[genreKey];
              return (
                <button
                  key={genreKey}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(genreKey)}
                  className={`flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    active
                      ? 'bg-[var(--accent-primary)]/16 font-semibold text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40'
                      : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="truncate">{getGenreLabel(genreKey, locale)}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`shrink-0 font-mono text-[10px] ${
                        active ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredGenres.length === 0 && (
              <div className="col-span-2 py-4 text-center text-xs text-[var(--text-muted)]">
                {t('hub.emptyTitle')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
