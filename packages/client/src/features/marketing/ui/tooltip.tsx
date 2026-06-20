import * as React from 'react';
import { marketingPortalTarget } from './portal-target';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// TooltipProvider (delay configuration context)
// ---------------------------------------------------------------------------

interface TooltipProviderContextValue {
  delay: number;
}

const TooltipProviderContext = React.createContext<TooltipProviderContextValue>({ delay: 700 });

interface TooltipProviderProps {
  delay?: number;
  children?: React.ReactNode;
}

function TooltipProvider({ delay = 700, children }: TooltipProviderProps) {
  return (
    <TooltipProviderContext.Provider value={{ delay }}>{children}</TooltipProviderContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tooltip context
// ---------------------------------------------------------------------------

interface TooltipContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error('Tooltip compound components must be inside <Tooltip>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Tooltip root
// ---------------------------------------------------------------------------

interface TooltipProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: TooltipProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? controlledOpen! : internalOpen;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TooltipTrigger
// ---------------------------------------------------------------------------

interface TooltipTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const { setOpen, triggerRef } = useTooltipContext();
  const { delay } = React.useContext(TooltipProviderContext);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  const extraProps = {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'data-slot': 'tooltip-trigger',
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      extraProps as React.HTMLAttributes<HTMLElement>
    );
  }

  return (
    <button
      type="button"
      data-slot="tooltip-trigger"
      {...(extraProps as React.HTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TooltipContent
// ---------------------------------------------------------------------------

interface TooltipContentProps extends React.ComponentProps<'div'> {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

function TooltipContent({
  className,
  children,
  side = 'top',
  sideOffset = 4,
  ...props
}: TooltipContentProps) {
  const { open, triggerRef } = useTooltipContext();

  if (!open) return null;

  const rect = triggerRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = rect
    ? (() => {
        const base: React.CSSProperties = { position: 'fixed', zIndex: 50 };
        if (side === 'top') {
          return {
            ...base,
            bottom: window.innerHeight - rect.top + sideOffset,
            left: rect.left + rect.width / 2,
          };
        }
        if (side === 'bottom') {
          return { ...base, top: rect.bottom + sideOffset, left: rect.left + rect.width / 2 };
        }
        if (side === 'left') {
          return {
            ...base,
            right: window.innerWidth - rect.left + sideOffset,
            top: rect.top + rect.height / 2,
          };
        }
        // right
        return { ...base, left: rect.right + sideOffset, top: rect.top + rect.height / 2 };
      })()
    : { position: 'fixed', top: 0, left: 0, zIndex: 50 };

  return createPortal(
    <div
      data-slot="tooltip-content"
      style={style}
      className={cn(
        'z-50 inline-flex w-fit max-w-xs items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background',
        className
      )}
      {...props}
    >
      {children}
    </div>,
    marketingPortalTarget()
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
