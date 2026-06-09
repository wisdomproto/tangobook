import * as React from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps extends Omit<React.ComponentProps<'button'>, 'onClick' | 'role'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'default';
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      size = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    // Controlled or uncontrolled
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isChecked = isControlled ? checked : internalChecked;

    const handleClick = () => {
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        data-slot="switch"
        data-size={size}
        data-checked={String(isChecked)}
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          // Base layout
          'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none',
          // Focus
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          // Invalid
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          // Sizes
          'data-[size=default]:h-[18.4px] data-[size=default]:w-[32px]',
          'data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]',
          // State colors
          'data-[checked=true]:bg-primary data-[checked=false]:bg-input',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {/* Thumb */}
        <span
          data-slot="switch-thumb"
          className={cn(
            'pointer-events-none block rounded-full bg-background ring-0 transition-transform',
            // Default size thumb
            size === 'default' && 'size-4',
            size === 'sm' && 'size-3',
            // Translate based on checked state
            isChecked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
          )}
        />
      </button>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
