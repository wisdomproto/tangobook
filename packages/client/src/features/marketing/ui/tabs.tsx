import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  activeValue: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used inside <Tabs>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Tabs root (controlled OR uncontrolled via defaultValue)
// ---------------------------------------------------------------------------

interface TabsProps extends React.ComponentProps<'div'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      value,
      defaultValue = '',
      onValueChange,
      orientation = 'horizontal',
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const activeValue = isControlled ? value! : internalValue;

    const handleValueChange = React.useCallback(
      (next: string) => {
        if (!isControlled) setInternalValue(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider value={{ activeValue, onValueChange: handleValueChange }}>
        <div
          ref={ref}
          data-slot="tabs"
          data-orientation={orientation}
          className={cn(
            'group/tabs flex gap-2',
            orientation === 'horizontal' ? 'flex-col' : 'flex-row',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

// ---------------------------------------------------------------------------
// TabsList
// ---------------------------------------------------------------------------

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TabsListProps
  extends React.ComponentProps<'div'>, VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="tabs-list"
        data-variant={variant}
        role="tablist"
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

// ---------------------------------------------------------------------------
// TabsTrigger
// ---------------------------------------------------------------------------

interface TabsTriggerProps extends React.ComponentProps<'button'> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, children, ...props }, ref) => {
    const { activeValue, onValueChange } = useTabsContext();
    const isActive = activeValue === value;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onValueChange(value);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        data-slot="tabs-trigger"
        aria-selected={isActive}
        // data-active present (no value) when active, absent when not
        {...(isActive ? { 'data-active': '' } : {})}
        onClick={handleClick}
        className={cn(
          'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all',
          'hover:text-foreground',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
          // active state
          isActive && 'bg-background text-foreground shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

// ---------------------------------------------------------------------------
// TabsContent
// ---------------------------------------------------------------------------

interface TabsContentProps extends React.ComponentProps<'div'> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeValue } = useTabsContext();
    const isActive = activeValue === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        data-slot="tabs-content"
        role="tabpanel"
        className={cn('flex-1 text-sm outline-none', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
