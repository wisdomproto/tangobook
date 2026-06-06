import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('default variant has bg-primary class', () => {
    render(<Button variant="default">Default</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary');
  });

  it('outline variant has border class', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border');
  });

  it('secondary variant has bg-secondary class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-secondary');
  });

  it('ghost variant does not have bg-primary', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).not.toContain('bg-primary');
  });

  it('destructive variant has text-destructive class', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-destructive');
  });

  it('link variant has text-primary class', () => {
    render(<Button variant="link">Link</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-primary');
  });

  it('forwards onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled prop', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('renders as a native button element', () => {
    render(<Button>Native</Button>);
    expect(screen.getByRole('button').tagName).toBe('BUTTON');
  });

  it('size xs applies h-6 class', () => {
    render(<Button size="xs">XS</Button>);
    expect(screen.getByRole('button').className).toContain('h-6');
  });

  it('size lg applies h-9 class', () => {
    render(<Button size="lg">LG</Button>);
    expect(screen.getByRole('button').className).toContain('h-9');
  });
});
