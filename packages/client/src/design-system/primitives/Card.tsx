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
  { interactive, padding = 'md', className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-soft',
        interactive &&
          'transition-all hover:-translate-y-0.5 hover:shadow-card cursor-pointer active:translate-y-0',
        paddingClass[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
