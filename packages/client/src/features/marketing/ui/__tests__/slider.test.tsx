import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from '../slider';

describe('Slider', () => {
  it('renders a range input', () => {
    render(<Slider aria-label="Volume" value={50} onValueChange={() => {}} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('has data-slot="slider"', () => {
    const { container } = render(
      <Slider aria-label="Volume" value={50} onValueChange={() => {}} />
    );
    expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument();
  });

  it('renders with the given value', () => {
    render(<Slider aria-label="Volume" value={42} onValueChange={() => {}} />);
    const input = screen.getByRole('slider') as HTMLInputElement;
    expect(Number(input.value)).toBe(42);
  });

  it('default min is 0 and max is 100', () => {
    render(<Slider aria-label="Volume" value={50} onValueChange={() => {}} />);
    const input = screen.getByRole('slider') as HTMLInputElement;
    expect(Number(input.min)).toBe(0);
    expect(Number(input.max)).toBe(100);
  });

  it('respects custom min and max', () => {
    render(<Slider aria-label="Volume" value={5} min={1} max={10} onValueChange={() => {}} />);
    const input = screen.getByRole('slider') as HTMLInputElement;
    expect(Number(input.min)).toBe(1);
    expect(Number(input.max)).toBe(10);
  });

  it('calls onValueChange with new numeric value on change', () => {
    const handler = vi.fn();
    render(<Slider aria-label="Volume" value={50} onValueChange={handler} />);
    const input = screen.getByRole('slider');
    fireEvent.change(input, { target: { value: '75' } });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(75);
  });

  it('applies custom className', () => {
    const { container } = render(
      <Slider aria-label="Volume" value={50} className="my-slider" onValueChange={() => {}} />
    );
    expect(container.querySelector('[data-slot="slider"]')?.className).toContain('my-slider');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Slider aria-label="Volume" value={50} disabled onValueChange={() => {}} />);
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('does not call onValueChange when disabled', () => {
    const handler = vi.fn();
    render(<Slider aria-label="Volume" value={50} disabled onValueChange={handler} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
    expect(handler).not.toHaveBeenCalled();
  });
});
