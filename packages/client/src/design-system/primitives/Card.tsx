import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, padding = 'md', className, children, onKeyDown, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'storybook-card bg-white rounded-card border border-ink-100 shadow-soft',
        interactive &&
          'transition-shadow hover:shadow-card cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700',
        paddingClass[padding],
        className
      )}
      {...rest}
      role={interactive ? (rest.role ?? 'button') : rest.role}
      tabIndex={interactive ? (rest.tabIndex ?? 0) : rest.tabIndex}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          interactive &&
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      {children}
    </div>
  );
});
