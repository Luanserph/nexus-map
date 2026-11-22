import type { HTMLAttributes, ReactNode } from 'react';
import type { BadgeStyle } from '../../types/schema';

export type GlassBadgeVariant = 'neutral' | 'accent' | 'success' | 'muted';
export type GlassBadgeSize = 'sm' | 'md';

export interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: GlassBadgeVariant;
  size?: GlassBadgeSize;
  badgeStyle?: BadgeStyle;
  dot?: boolean;
  icon?: ReactNode;
}

const sizeClasses: Record<GlassBadgeSize, string> = {
  sm: 'h-5 px-2 text-[11px] gap-1.5',
  md: 'h-6 px-2.5 text-xs gap-1.5',
};

const variantClasses: Record<GlassBadgeVariant, string> = {
  neutral:
    'bg-[rgba(13,17,24,0.72)] text-[var(--text-secondary)] border-[var(--glass-border)]',
  accent:
    'bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(13,17,24,0.78))] text-[var(--accent-primary)] border-[color-mix(in_srgb,var(--accent-primary)_45%,transparent)] shadow-[0_0_12px_-4px_var(--accent-glow)]',
  success:
    'bg-[rgba(16,185,129,0.12)] text-emerald-300 border-emerald-400/35 shadow-[0_0_12px_-4px_rgba(16,185,129,0.35)]',
  muted:
    'bg-white/[0.04] text-[var(--text-muted)] border-white/[0.07]',
};

const shapeClasses: Record<BadgeStyle, string> = {
  minimal: 'rounded-md',
  ornate: 'rounded-sm tracking-wide',
  chamfered: 'clip-chamfer-sm rounded-none',
};

export function GlassBadge({
  children,
  variant = 'neutral',
  size = 'sm',
  badgeStyle = 'minimal',
  dot = false,
  icon,
  className = '',
  ...rest
}: GlassBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center border font-medium backdrop-blur-md select-none',
        sizeClasses[size],
        variantClasses[variant],
        shapeClasses[badgeStyle],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={[
            'h-1.5 w-1.5 rounded-full',
            variant === 'accent'
              ? 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'
              : variant === 'success'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-[var(--text-secondary)]',
          ].join(' ')}
        />
      )}
      {icon && <span className="shrink-0 opacity-90">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
