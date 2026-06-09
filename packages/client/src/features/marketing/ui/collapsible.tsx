import * as React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Collapsible context
// ---------------------------------------------------------------------------

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) throw new Error('Collapsible compound components must be inside <Collapsible>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Collapsible root
// ---------------------------------------------------------------------------

interface CollapsibleProps extends React.ComponentProps<'div'> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    { open: controlledOpen, onOpenChange, defaultOpen = false, children, className, ...props },
    ref
  ) => {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
    const open = isControlled ? controlledOpen! : internalOpen;

    const handleOpenChange = (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    };

    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
        <div
          ref={ref}
          data-slot="collapsible"
          data-state={open ? 'open' : 'closed'}
          className={cn(className)}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = 'Collapsible';

// ---------------------------------------------------------------------------
// CollapsibleTrigger
// ---------------------------------------------------------------------------

type CollapsibleTriggerProps = React.ComponentProps<'button'>;

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { open, onOpenChange } = useCollapsibleContext();

    return (
      <button
        ref={ref}
        data-slot="collapsible-trigger"
        type="button"
        aria-expanded={open}
        className={cn(className)}
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(!open);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

// ---------------------------------------------------------------------------
// CollapsibleContent
// ---------------------------------------------------------------------------

type CollapsibleContentProps = React.ComponentProps<'div'>;

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useCollapsibleContext();

    if (!open) return null;

    return (
      <div ref={ref} data-slot="collapsible-content" className={cn(className)} {...props}>
        {children}
      </div>
    );
  }
);
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
