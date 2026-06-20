import * as React from 'react';
import { marketingPortalTarget } from './portal-target';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  // label registry: item value → display text (populated by SelectItem on render)
  labelRegistry: React.MutableRefObject<Map<string, string>>;
  // display label resolved from registry
  displayLabel: string;
  setDisplayLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(): SelectContextValue {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select compound components must be inside <Select>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Helper: extract value→label pairs from React children tree
// ---------------------------------------------------------------------------

function extractItemLabels(children: React.ReactNode): Map<string, string> {
  const map = new Map<string, string>();
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const el = child as React.ReactElement<{ value?: string; children?: React.ReactNode }>;
    // SelectItem has a value prop
    if (el.props.value !== undefined) {
      const label = typeof el.props.children === 'string' ? el.props.children : '';
      if (label) map.set(el.props.value, label);
    }
    // Recurse into containers (SelectGroup, SelectContent, etc.)
    if (el.props.children) {
      const nested = extractItemLabels(el.props.children);
      nested.forEach((v, k) => map.set(k, v));
    }
  });
  return map;
}

// ---------------------------------------------------------------------------
// Select root
// ---------------------------------------------------------------------------

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children?: React.ReactNode;
}

function Select({
  value: controlledValue,
  onValueChange,
  defaultValue = '',
  children,
}: SelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = isControlled ? controlledValue! : internalValue;

  const [open, setOpen] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Pre-populate label registry from children at render time (covers controlled value on mount)
  const labelRegistry = React.useRef<Map<string, string>>(new Map());
  const extracted = extractItemLabels(children);
  extracted.forEach((v, k) => labelRegistry.current.set(k, v));

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        triggerRef,
        labelRegistry,
        displayLabel,
        setDisplayLabel,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SelectTrigger
// ---------------------------------------------------------------------------

interface SelectTriggerProps extends React.ComponentProps<'button'> {
  size?: 'sm' | 'default';
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, size = 'default', children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSelectContext();

    // Merge refs
    const setRef = (el: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    };

    return (
      <button
        ref={setRef}
        data-slot="select-trigger"
        data-size={size}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          size === 'default' ? 'h-8' : 'h-7 rounded-[min(var(--radius-md),10px)]',
          '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="pointer-events-none size-4 text-muted-foreground" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// ---------------------------------------------------------------------------
// SelectValue
// ---------------------------------------------------------------------------

interface SelectValueProps extends React.ComponentProps<'span'> {
  placeholder?: string;
}

function SelectValue({ className, placeholder, ...props }: SelectValueProps) {
  const { value, labelRegistry, displayLabel } = useSelectContext();
  // Prefer displayLabel (set after user interaction), then registry (set by item mounts), then raw value
  const shown = displayLabel || (value ? (labelRegistry.current.get(value) ?? value) : '');

  return (
    <span
      data-slot="select-value"
      className={cn('flex flex-1 text-left', !shown && 'text-muted-foreground', className)}
      {...props}
    >
      {shown || placeholder}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SelectContent (portal + listbox)
// ---------------------------------------------------------------------------

interface SelectContentProps extends React.ComponentProps<'div'> {
  side?: 'top' | 'bottom';
  sideOffset?: number;
  align?: 'start' | 'end' | 'center';
}

function SelectContent({
  className,
  children,
  side = 'bottom',
  sideOffset = 4,
  ...props
}: SelectContentProps) {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Esc + outside click
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
      if (!insideContent && !insideTrigger) setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open, setOpen, triggerRef]);

  const rect = triggerRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = rect
    ? {
        position: 'fixed',
        top: side === 'bottom' ? rect.bottom + sideOffset : rect.top - sideOffset,
        left: rect.left,
        minWidth: rect.width,
        zIndex: 50,
      }
    : { position: 'fixed', top: 0, left: 0, zIndex: 50 };

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      data-slot="select-content"
      role="listbox"
      style={style}
      className={cn(
        'overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>,
    marketingPortalTarget()
  );
}

// ---------------------------------------------------------------------------
// SelectItem
// ---------------------------------------------------------------------------

interface SelectItemProps extends React.ComponentProps<'div'> {
  value: string;
  disabled?: boolean;
}

function SelectItem({
  className,
  value: itemValue,
  disabled,
  children,
  ...props
}: SelectItemProps) {
  const {
    value: selectedValue,
    onValueChange,
    setOpen,
    setDisplayLabel,
    labelRegistry,
  } = useSelectContext();
  const isSelected = selectedValue === itemValue;

  // Register text label into registry on every render so it can be shown in trigger
  const itemRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (itemRef.current) {
      // Read only the first text span (not the check icon span)
      const textSpan = itemRef.current.querySelector('[data-slot="select-item-text"]');
      const text = (textSpan?.textContent ?? itemRef.current.textContent ?? '').trim();
      if (text) {
        labelRegistry.current.set(itemValue, text);
        // If this item is selected, update displayLabel state too
        if (isSelected) setDisplayLabel(text);
      }
    }
  });

  return (
    <div
      ref={itemRef}
      data-slot="select-item"
      data-selected={isSelected}
      data-disabled={disabled}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={() => {
        if (disabled) return;
        const label = labelRegistry.current.get(itemValue) ?? itemValue;
        setDisplayLabel(label);
        onValueChange(itemValue);
        setOpen(false);
      }}
      {...props}
    >
      <span data-slot="select-item-text" className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </span>
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        {isSelected && <Check className="pointer-events-none size-4" />}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SelectGroup / SelectLabel / SelectSeparator
// ---------------------------------------------------------------------------

function SelectGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="select-group" className={cn('scroll-my-1 p-1', className)} {...props} />;
}

function SelectLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-label"
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="select-separator"
      className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};
