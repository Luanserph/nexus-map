import type { GamePlatform } from '../../types/schema';

export interface PlatformIconsProps {
  platforms?: GamePlatform[];
}

const PLATFORM_TITLES: Record<GamePlatform, string> = {
  pc: 'PC (Windows)',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  switch: 'Nintendo Switch',
};

function PlatformSvg({ platform }: { platform: GamePlatform }) {
  if (platform === 'pc') {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M1.5 2.75 7.2 2v5.3H1.5V2.75Zm6.6-.88L14.5 1v6.3H8.1V1.87ZM1.5 8.5h5.7v5.3l-5.7-.75V8.5Zm6.6 0h6.4V15l-6.4-.87V8.5Z" />
      </svg>
    );
  }

  if (platform === 'playstation') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4v15" />
        <path d="M12 5.5c3.8 1 5.5 2.4 5.5 4.4 0 2.1-1.9 3.2-4 2.5" />
        <path d="M4.5 15.8c-1.8.8-2 2.4.2 2.8 1.9.3 4.3-.3 6.3-1.1" />
        <path d="M19.5 15.8c1.8.8 1.8 2.4-.5 2.8-1.9.3-4.1-.2-6-1" />
      </svg>
    );
  }

  if (platform === 'xbox') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M7.2 6.8C9.8 8.4 13.6 12.2 16.8 17.2" />
        <path d="M16.8 6.8C14.2 8.4 10.4 12.2 7.2 17.2" />
      </svg>
    );
  }

  // Nintendo Switch
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9.5 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2.5V4Z" />
      <path d="M14.5 4H17a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2.5V4Z" />
      <circle cx="6.8" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.2" cy="14.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlatformIcons({ platforms }: PlatformIconsProps) {
  if (!platforms || platforms.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1.5 text-[var(--text-muted)]"
      aria-label="Plataformas"
    >
      {platforms.map((platform) => (
        <span
          key={platform}
          title={PLATFORM_TITLES[platform]}
          className="inline-flex h-5 w-5 items-center justify-center rounded border border-white/[0.06] bg-white/[0.03] transition-colors duration-200 group-hover/card:text-[var(--text-secondary)]"
        >
          <PlatformSvg platform={platform} />
        </span>
      ))}
    </div>
  );
}
