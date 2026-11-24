import { SlidersHorizontal } from 'lucide-react';
import { useI18n } from '../../core/i18n';
import type { TranslationKey } from '../../core/i18n';
import type { ExplorationStatus } from '../../types/schema';
import { NeonButton } from '../glass';
import { GenreFilterDropdown } from './GenreFilterDropdown';

export interface HubFilterBarProps {
  selectedStatus: ExplorationStatus;
  onStatusChange: (status: ExplorationStatus) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  availableGenres: string[];
  genreCounts?: Record<string, number>;
}

const STATUS_OPTIONS: { value: ExplorationStatus; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'hub.statusAll' },
  { value: 'in-progress', labelKey: 'hub.statusInProgress' },
  { value: 'completed', labelKey: 'hub.statusCompleted' },
  { value: 'not-started', labelKey: 'hub.statusNotStarted' },
];

export function HubFilterBar({
  selectedStatus,
  onStatusChange,
  selectedGenre,
  onGenreChange,
  availableGenres,
  genreCounts,
}: HubFilterBarProps) {
  const { t } = useI18n();

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#090d16]/75 px-3.5 py-2.5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      {/* Status Filter — always horizontal, never wraps into vertical columns */}
      <div
        className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={t('hub.status')}
      >
        <span className="mr-1 inline-flex shrink-0 items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
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

      {/* Genre Dropdown / Popover */}
      <div className="flex items-center justify-end border-t border-white/[0.06] pt-2.5 md:border-t-0 md:pt-0">
        <GenreFilterDropdown
          selectedGenre={selectedGenre}
          onGenreChange={onGenreChange}
          availableGenres={availableGenres}
          genreCounts={genreCounts}
        />
      </div>
    </div>
  );
}
