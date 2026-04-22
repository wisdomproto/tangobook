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
  primary:
    'bg-gradient-to-br from-coral-400 to-coral-500 text-white shadow-pop hover:brightness-105 active:brightness-95',
  secondary: 'bg-white text-ink-900 shadow-soft hover:bg-cream-50 active:bg-peach-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-peach-100 active:bg-peach-200',
  danger: 'bg-danger text-white shadow-soft hover:brightness-105',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-md min-h-[40px]',
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
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold font-display transition-all disabled:opacity-50 disabled:cursor-not-allowed',
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
