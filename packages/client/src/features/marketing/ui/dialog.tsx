import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(): DialogContextValue {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('Dialog compound components must be used inside <Dialog>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Dialog root (controlled OR uncontrolled)
// ---------------------------------------------------------------------------

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

function Dialog({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}: DialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isControlled ? controlledOpen! : internalOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// DialogTrigger
// ---------------------------------------------------------------------------

interface DialogTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext();
  const handleClick = () => onOpenChange(true);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        (children.props as React.HTMLAttributes<HTMLElement>).onClick?.(
          e as React.MouseEvent<HTMLElement>
        );
        handleClick();
      },
    });
  }

  return (
    <button data-slot="dialog-trigger" type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DialogPortal (thin wrapper for portal rendering)
// ---------------------------------------------------------------------------

interface DialogPortalProps {
  children?: React.ReactNode;
}

function DialogPortal({ children }: DialogPortalProps) {
  return createPortal(children, document.body);
}

// ---------------------------------------------------------------------------
// DialogOverlay (backdrop)
// ---------------------------------------------------------------------------

interface DialogOverlayProps extends React.ComponentProps<'div'> {
  onClose?: () => void;
}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, onClose, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="dialog-overlay"
        className={cn('fixed inset-0 isolate z-50 bg-black/10 backdrop-blur-[2px]', className)}
        onClick={(e) => {
          onClick?.(e);
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = 'DialogOverlay';

// ---------------------------------------------------------------------------
// DialogContent
// ---------------------------------------------------------------------------

interface DialogContentProps extends React.ComponentProps<'div'> {
  showCloseButton?: boolean;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Esc to close — listen at document level when open
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogPortal>
      <DialogOverlay onClose={() => onOpenChange(false)}>
        <div
          ref={contentRef}
          data-slot="dialog-content"
          role="dialog"
          aria-modal="true"
          className={cn(
            'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-4 text-sm ring-1 ring-foreground/10 outline-none sm:max-w-sm',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          {showCloseButton && (
            <Button
              data-slot="dialog-close"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </DialogOverlay>
    </DialogPortal>
  );
}

// ---------------------------------------------------------------------------
// DialogClose
// ---------------------------------------------------------------------------

interface DialogCloseProps {
  children: React.ReactElement;
  asChild?: boolean;
}

function DialogClose({ children, asChild }: DialogCloseProps) {
  const { onOpenChange } = useDialogContext();
  const handleClick = () => onOpenChange(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        (children.props as React.HTMLAttributes<HTMLElement>).onClick?.(
          e as React.MouseEvent<HTMLElement>
        );
        handleClick();
      },
    });
  }

  return (
    <button data-slot="dialog-close" type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Structural sub-components
// ---------------------------------------------------------------------------

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
  );
}

function DialogFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn('text-base leading-none font-medium', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
