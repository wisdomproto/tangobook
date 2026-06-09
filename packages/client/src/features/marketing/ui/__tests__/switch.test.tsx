import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch', () => {
  it('renders as a button with role="switch"', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('reflects unchecked state by default', () => {
    render(<Switch aria-label="Toggle" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveAttribute('data-checked', 'false');
  });

  it('reflects checked state when checked=true', () => {
    render(<Switch aria-label="Toggle" checked={true} onCheckedChange={() => {}} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveAttribute('data-checked', 'true');
  });

  it('calls onCheckedChange with toggled value on click', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Switch aria-label="Toggle" checked={false} onCheckedChange={handler} />);
    await user.click(screen.getByRole('switch'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('calls onCheckedChange(false) when currently checked and clicked', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Switch aria-label="Toggle" checked={true} onCheckedChange={handler} />);
    await user.click(screen.getByRole('switch'));
    expect(handler).toHaveBeenCalledWith(false);
  });

  it('has data-slot="switch"', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-slot', 'switch');
  });

  it('default size applies data-size="default"', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'default');
  });

  it('sm size applies data-size="sm"', () => {
    render(<Switch aria-label="Toggle" size="sm" />);
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm');
  });

  it('does not fire handler when disabled', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Switch aria-label="Toggle" disabled onCheckedChange={handler} />);
    await user.click(screen.getByRole('switch'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Switch aria-label="Toggle" className="my-switch" />);
    expect(screen.getByRole('switch').className).toContain('my-switch');
  });

  it('has bg-primary class in className string when checked', () => {
    render(<Switch aria-label="Toggle" checked={true} onCheckedChange={() => {}} />);
    expect(screen.getByRole('switch').className).toContain('bg-primary');
  });
});
