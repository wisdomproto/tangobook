import * as React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// ScrollArea — thin native overflow wrapper with styled scrollbar classes
// ---------------------------------------------------------------------------

interface ScrollAreaProps extends React.ComponentProps<'div'> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = 'vertical', children, ...props }, ref) => {
    return (
      <div ref={ref} data-slot="scroll-area" className={cn('relative', className)} {...props}>
        <div
          data-slot="scroll-area-viewport"
          className={cn(
            'size-full rounded-[inherit]',
            orientation === 'vertical' && 'overflow-x-hidden overflow-y-auto',
            orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
            orientation === 'both' && 'overflow-auto',
            // Thin styled scrollbar via Tailwind
            '[scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]'
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

// ---------------------------------------------------------------------------
// ScrollBar — decorative companion (native scrollbar hidden via CSS classes above)
// ---------------------------------------------------------------------------

interface ScrollBarProps extends React.ComponentProps<'div'> {
  orientation?: 'vertical' | 'horizontal';
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="scroll-area-scrollbar"
        data-orientation={orientation}
        className={cn(
          'flex touch-none select-none p-px transition-colors',
          orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
          orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
          className
        )}
        {...props}
      >
        <div data-slot="scroll-area-thumb" className="relative flex-1 rounded-full bg-border" />
      </div>
    );
  }
);
ScrollBar.displayName = 'ScrollBar';

export { ScrollArea, ScrollBar };
