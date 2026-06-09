import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('renders with role="checkbox"', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reflects checked state when checked=true', () => {
    render(<Checkbox aria-label="Accept" checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('has data-slot="checkbox"', () => {
    const { container } = render(<Checkbox aria-label="Accept" />);
    expect(container.querySelector('[data-slot="checkbox"]')).toBeInTheDocument();
  });

  it('has data-checked="false" when unchecked', () => {
    const { container } = render(
      <Checkbox aria-label="Accept" checked={false} onChange={() => {}} />
    );
    expect(container.querySelector('[data-slot="checkbox"]')).toHaveAttribute(
      'data-checked',
      'false'
    );
  });

  it('has data-checked="true" when checked', () => {
    const { container } = render(<Checkbox aria-label="Accept" checked onChange={() => {}} />);
    expect(container.querySelector('[data-slot="checkbox"]')).toHaveAttribute(
      'data-checked',
      'true'
    );
  });

  it('fires onChange when toggled', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Checkbox aria-label="Accept" onChange={handler} />);
    await user.click(screen.getByRole('checkbox'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fires onCheckedChange with new boolean on toggle', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(
      <Checkbox aria-label="Accept" checked={false} onChange={() => {}} onCheckedChange={handler} />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('does not fire handlers when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox aria-label="Accept" disabled onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Checkbox aria-label="Accept" className="my-cb" />);
    expect(container.querySelector('[data-slot="checkbox"]')?.className).toContain('my-cb');
  });

  it('has border-primary class in className when checked', () => {
    const { container } = render(<Checkbox aria-label="Accept" checked onChange={() => {}} />);
    expect(container.querySelector('[data-checked="true"]')?.className).toContain('border-primary');
  });
});
