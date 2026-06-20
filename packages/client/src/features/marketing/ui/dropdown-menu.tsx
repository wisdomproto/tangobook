import * as React from 'react';
import { marketingPortalTarget } from './portal-target';
import { createPortal } from 'react-dom';
import { ChevronRight, Check } from 'lucide-react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(): DropdownMenuContextValue {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu compound components must be inside <DropdownMenu>');
  return ctx;
}

// ---------------------------------------------------------------------------
// DropdownMenu root
// ---------------------------------------------------------------------------

interface DropdownMenuProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DropdownMenuProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? controlledOpen! : internalOpen;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuTrigger
// ---------------------------------------------------------------------------

interface DropdownMenuTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      {
        ref: triggerRef,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        onClick: (e: React.MouseEvent) => {
          (children.props as React.HTMLAttributes<HTMLElement>).onClick?.(
            e as React.MouseEvent<HTMLElement>
          );
          handleClick(e);
        },
      } as React.HTMLAttributes<HTMLElement>
    );
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      data-slot="dropdown-menu-trigger"
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuPortal
// ---------------------------------------------------------------------------

interface DropdownMenuPortalProps {
  children?: React.ReactNode;
}

function DropdownMenuPortal({ children }: DropdownMenuPortalProps) {
  return createPortal(children, marketingPortalTarget());
}

// ---------------------------------------------------------------------------
// DropdownMenuContent
// ---------------------------------------------------------------------------

interface DropdownMenuContentProps extends React.ComponentProps<'div'> {
  align?: 'start' | 'end' | 'center';
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  children,
  align = 'start',
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const insideContent = contentRef.current?.contains(target);
      const insideTrigger = triggerRef.current?.contains(target);
      if (!insideContent && !insideTrigger) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  // Simple bottom-start anchor positioning via inline styles based on trigger rect
  // We render into a portal and use absolute positioning relative to viewport
  const getStyle = (): React.CSSProperties => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return { position: 'fixed', top: 0, left: 0 };

    let left = rect.left;
    if (align === 'end') left = rect.right;
    if (align === 'center') left = rect.left + rect.width / 2;

    return {
      position: 'fixed',
      top: rect.bottom + sideOffset,
      left,
      zIndex: 50,
    };
  };

  return (
    <DropdownMenuPortal>
      <div
        ref={contentRef}
        data-slot="dropdown-menu-content"
        role="menu"
        style={getStyle()}
        className={cn(
          'min-w-32 overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuPortal>
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuItem
// ---------------------------------------------------------------------------

interface DropdownMenuItemProps extends React.ComponentProps<'div'> {
  inset?: boolean;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect?: () => void;
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  disabled,
  onSelect,
  onClick,
  children,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    onClick?.(e);
    onSelect?.();
    setOpen(false);
  };

  return (
    <div
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={cn(
        'relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        inset && 'pl-7',
        variant === 'destructive' && 'text-destructive hover:bg-destructive/10',
        disabled && 'pointer-events-none opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuSeparator
// ---------------------------------------------------------------------------

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuLabel
// ---------------------------------------------------------------------------

interface DropdownMenuLabelProps extends React.ComponentProps<'div'> {
  inset?: boolean;
}

function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <div
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'px-1.5 py-1 text-xs font-medium text-muted-foreground',
        inset && 'pl-7',
        className
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuGroup
// ---------------------------------------------------------------------------

function DropdownMenuGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dropdown-menu-group" className={cn(className)} {...props} />;
}

// ---------------------------------------------------------------------------
// DropdownMenuShortcut
// ---------------------------------------------------------------------------

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuCheckboxItem
// ---------------------------------------------------------------------------

interface DropdownMenuCheckboxItemProps extends React.ComponentProps<'div'> {
  checked?: boolean;
  inset?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSelect?: () => void;
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  onCheckedChange,
  onSelect,
  ...props
}: DropdownMenuCheckboxItemProps) {
  const { setOpen } = useDropdownMenuContext();

  return (
    <div
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      role="menuitemcheckbox"
      aria-checked={checked}
      className={cn(
        'relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        inset && 'pl-7',
        className
      )}
      onClick={() => {
        onCheckedChange?.(!checked);
        onSelect?.();
        setOpen(false);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        {checked && <Check className="size-4" />}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DropdownMenuRadioGroup / DropdownMenuRadioItem
// ---------------------------------------------------------------------------

interface DropdownMenuRadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}
const DropdownMenuRadioGroupContext =
  React.createContext<DropdownMenuRadioGroupContextValue | null>(null);

interface DropdownMenuRadioGroupProps extends React.ComponentProps<'div'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

function DropdownMenuRadioGroup({ value, onValueChange, ...props }: DropdownMenuRadioGroupProps) {
  return (
    <DropdownMenuRadioGroupContext.Provider value={{ value, onValueChange }}>
      <div data-slot="dropdown-menu-radio-group" role="group" {...props} />
    </DropdownMenuRadioGroupContext.Provider>
  );
}

interface DropdownMenuRadioItemProps extends React.ComponentProps<'div'> {
  value: string;
  inset?: boolean;
  onSelect?: () => void;
}

function DropdownMenuRadioItem({
  className,
  children,
  value,
  inset,
  onSelect,
  ...props
}: DropdownMenuRadioItemProps) {
  const { setOpen } = useDropdownMenuContext();
  const radioCtx = React.useContext(DropdownMenuRadioGroupContext);
  const checked = radioCtx?.value === value;

  return (
    <div
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      role="menuitemradio"
      aria-checked={checked}
      className={cn(
        'relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        inset && 'pl-7',
        className
      )}
      onClick={() => {
        radioCtx?.onValueChange?.(value);
        onSelect?.();
        setOpen(false);
      }}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex items-center justify-center">
        {checked && <Check className="size-4" />}
      </span>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-menu (simplified — triggers sub-panel inline, not nested portal)
// ---------------------------------------------------------------------------

interface DropdownMenuSubContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const DropdownMenuSubContext = React.createContext<DropdownMenuSubContextValue | null>(null);

interface DropdownMenuSubProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

function DropdownMenuSub({ children, open: controlledOpen, onOpenChange }: DropdownMenuSubProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  return (
    <DropdownMenuSubContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuSubContext.Provider>
  );
}

interface DropdownMenuSubTriggerProps extends React.ComponentProps<'div'> {
  inset?: boolean;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  const subCtx = React.useContext(DropdownMenuSubContext);

  return (
    <div
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        'flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground',
        inset && 'pl-7',
        subCtx?.open && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={() => subCtx?.setOpen(!subCtx.open)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-4" />
    </div>
  );
}

function DropdownMenuSubContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  const subCtx = React.useContext(DropdownMenuSubContext);
  if (!subCtx?.open) return null;
  return (
    <div
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'ml-1 min-w-24 rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
