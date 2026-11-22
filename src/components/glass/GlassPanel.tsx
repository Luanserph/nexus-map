import type { HTMLAttributes, ReactNode } from 'react';

export type GlassPanelVariant = 'default' | 'elevated' | 'subtle';
export type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg';

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: GlassPanelVariant;
  padding?: GlassPanelPadding;
  /** Enables subtle architectural corner crosshairs for tactical HUD panels. */
  cornerMarks?: boolean;
  /** Activates contained neon border & ambient glow using --accent-primary / --accent-glow. */
  accentActive?: boolean;
}

const variantClasses: Record<GlassPanelVariant, string> = {
  default: 'glass-surface',
  elevated: 'glass-surface-elevated',
  subtle: 'glass-surface-subtle',
};

const paddingClasses: Record<GlassPanelPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function GlassPanel({
  children,
  variant = 'default',
  padding = 'md',
  cornerMarks = false,
  accentActive = false,
  className = '',
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl transition-colors duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        accentActive ? 'neon-active-glow' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {/* Micro-noise grain for tactile glass materiality */}
      <span
        aria-hidden="true"
        className="nexus-noise-layer pointer-events-none absolute inset-0 opacity-[0.025]"
      />

      {cornerMarks && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 left-1.5 h-2 w-2 border-t border-l border-white/25"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 right-1.5 h-2 w-2 border-t border-r border-white/25"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1.5 left-1.5 h-2 w-2 border-b border-l border-white/25"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-1.5 bottom-1.5 h-2 w-2 border-r border-b border-white/25"
          />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
