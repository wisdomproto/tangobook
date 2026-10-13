import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-coral-700 text-white shadow-soft hover:bg-coral-800 active:bg-coral-900',
  secondary: 'bg-white text-ink-900 shadow-soft hover:bg-cream-50 active:bg-peach-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-peach-100 active:bg-peach-200',
  danger: 'bg-danger/10 text-ink-900 border border-danger shadow-soft hover:bg-danger/20',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-md min-h-[44px]',
  md: 'px-5 py-3 text-base rounded-lg min-h-[48px]',
  lg: 'px-7 py-4 text-lg rounded-lg min-h-[56px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    leftIcon,
    rightIcon,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      data-storybook-button={variant}
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'storybook-button inline-flex items-center justify-center gap-2 font-bold font-display transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="animate-spin" aria-hidden>
          ⟳
        </span>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
});
