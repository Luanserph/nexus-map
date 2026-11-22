import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function GlassInput({
  leftIcon,
  rightSlot,
  containerClassName = '',
  className = '',
  inputRef,
  ...rest
}: GlassInputProps) {
  return (
    <div
      className={[
        'group relative flex items-center rounded-lg',
        'bg-[rgba(7,9,13,0.68)] backdrop-blur-md',
        'border border-[var(--glass-border)]',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]',
        'transition-all duration-200',
        'hover:border-[var(--glass-border-strong)]',
        'focus-within:border-[color-mix(in_srgb,var(--accent-primary)_65%,transparent)]',
        'focus-within:shadow-[inset_0_1px_2px_rgba(0,0,0,0.45),0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_35%,transparent),0_0_20px_-4px_var(--accent-glow)]',
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {leftIcon && (
        <span className="pointer-events-none flex shrink-0 items-center pl-3 text-[var(--text-muted)] transition-colors duration-200 group-focus-within:text-[var(--accent-primary)]">
          {leftIcon}
        </span>
      )}

      <input
        ref={inputRef}
        className={[
          'h-10 w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none',
          leftIcon ? 'pl-2.5' : 'pl-3.5',
          rightSlot ? 'pr-2.5' : 'pr-3.5',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />

      {rightSlot && (
        <div className="flex shrink-0 items-center pr-2.5">{rightSlot}</div>
      )}
    </div>
  );
}
