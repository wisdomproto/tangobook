import * as React from 'react';
import { cn } from '../lib/utils';

export interface SliderProps extends Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const next = Number(e.target.value);
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    };

    return (
      <div
        data-slot="slider"
        className={cn('relative flex w-full touch-none items-center select-none', className)}
      >
        {/* Track background */}
        <div
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted h-1 w-full"
        >
          {/* Filled range indicator */}
          <div
            data-slot="slider-range"
            className="bg-primary h-full"
            style={{
              width: `${((currentValue - min) / (max - min)) * 100}%`,
            }}
          />
        </div>

        {/* Native range input — positioned over track for interaction */}
        <input
          ref={ref}
          type="range"
          role="slider"
          min={min}
          max={max}
          step={step}
          value={isControlled ? currentValue : undefined}
          defaultValue={!isControlled ? internalValue : undefined}
          disabled={disabled}
          onChange={handleChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none"
          {...props}
        />

        {/* Visible thumb */}
        <div
          data-slot="slider-thumb"
          className="pointer-events-none absolute block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow]"
          style={{
            left: `calc(${((currentValue - min) / (max - min)) * 100}% - 6px)`,
          }}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
