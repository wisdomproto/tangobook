import * as React from 'react';
import { cn } from '../lib/utils';

// Inline check icon — avoids lucide-react dependency in this feature module
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type' | 'size'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, disabled, onChange, onCheckedChange, ...props }, ref) => {
    // Determine if controlled
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
    const isChecked = isControlled ? Boolean(checked) : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const next = e.target.checked;
      if (!isControlled) setInternalChecked(next);
      onChange?.(e);
      onCheckedChange?.(next);
    };

    return (
      <span
        data-slot="checkbox"
        data-checked={String(isChecked)}
        className={cn(
          'peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          // Checked state via data attr (used by CSS)
          'data-[checked=true]:border-primary data-[checked=true]:bg-primary data-[checked=true]:text-primary-foreground',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        {/* Visually hidden native input for a11y */}
        <input
          ref={ref}
          type="checkbox"
          checked={isControlled ? isChecked : undefined}
          defaultChecked={!isControlled ? internalChecked : undefined}
          disabled={disabled}
          onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        {/* Check indicator */}
        {isChecked && (
          <span
            data-slot="checkbox-indicator"
            className="pointer-events-none grid place-content-center text-current [&>svg]:size-3.5"
          >
            <CheckIcon />
          </span>
        )}
      </span>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
