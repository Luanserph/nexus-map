import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

export type NeonButtonVariant = 'primary' | 'glass' | 'ghost';
export type NeonButtonSize = 'sm' | 'md' | 'lg';

export interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: NeonButtonVariant;
  size?: NeonButtonSize;
  active?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const sizeClasses: Record<NeonButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export function NeonButton({
  children,
  variant = 'glass',
  size = 'md',
  active = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ref,
  ...rest
}: NeonButtonProps) {
  const baseClasses =
    'neon-focus-ring inline-flex items-center justify-center font-medium whitespace-nowrap select-none cursor-pointer transition-all duration-200 disabled:pointer-events-none disabled:opacity-45';

  const variantClasses: Record<NeonButtonVariant, string> = {
    primary: [
      'border text-[var(--surface-base)] font-semibold',
      'bg-[var(--accent-primary)] border-[var(--accent-primary)]',
      'hover:brightness-110 hover:shadow-[0_0_20px_-2px_var(--accent-glow)]',
      'active:scale-[0.98]',
    ].join(' '),
    glass: active
      ? [
          'bg-[color-mix(in_srgb,var(--accent-primary)_14%,rgba(13,17,24,0.82))]',
          'text-[var(--text-primary)]',
          'border border-[color-mix(in_srgb,var(--accent-primary)_62%,transparent)]',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_0_18px_-4px_var(--accent-glow)]',
        ].join(' ')
      : [
          'bg-[rgba(13,17,24,0.62)] backdrop-blur-md text-[var(--text-secondary)]',
          'border border-[var(--glass-border)]',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]',
          'hover:text-[var(--text-primary)]',
          'hover:border-[color-mix(in_srgb,var(--accent-primary)_48%,rgba(255,255,255,0.14))]',
          'hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_16px_-4px_var(--accent-glow)]',
        ].join(' '),
    ghost: active
      ? [
          'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)]',
          'text-[var(--accent-primary)]',
          'border border-[color-mix(in_srgb,var(--accent-primary)_40%,transparent)]',
          'shadow-[0_0_14px_-4px_var(--accent-glow)]',
        ].join(' ')
      : [
          'bg-transparent text-[var(--text-secondary)] border border-transparent',
          'hover:bg-white/[0.04] hover:text-[var(--text-primary)]',
          'hover:border-[var(--glass-border)]',
        ].join(' '),
  };

  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active || undefined}
      className={[baseClasses, sizeClasses[size], variantClasses[variant], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {leftIcon && <span className="shrink-0 opacity-90">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0 opacity-90">{rightIcon}</span>}
    </button>
  );
}
