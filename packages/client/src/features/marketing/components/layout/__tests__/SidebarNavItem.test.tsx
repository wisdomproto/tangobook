import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarNavItem } from '../SidebarNavItem';

function renderItem(to: string, initialPath: string = '/other') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SidebarNavItem to={to} icon="📝" label="콘텐츠 생성" />
    </MemoryRouter>
  );
}

describe('SidebarNavItem', () => {
  it('renders icon and label', () => {
    renderItem('/marketing/content');
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('콘텐츠 생성')).toBeInTheDocument();
  });

  it('renders as an anchor element', () => {
    renderItem('/marketing/content');
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('applies active classes when route matches current path', () => {
    renderItem('/marketing/content', '/marketing/content');
    const link = screen.getByRole('link');
    expect(link.className).toContain('bg-accent');
    expect(link.className).toContain('text-accent-foreground');
  });

  it('applies inactive classes when route does not match', () => {
    renderItem('/marketing/content', '/marketing/ideas');
    const link = screen.getByRole('link');
    expect(link.className).toContain('text-muted-foreground');
    expect(link.className).not.toContain('bg-accent text-accent-foreground');
  });

  it('shows badge when badge > 0', () => {
    render(
      <MemoryRouter initialEntries={['/other']}>
        <SidebarNavItem to="/marketing/monitoring" icon="💬" label="모니터링" badge={5} />
      </MemoryRouter>
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show badge when badge is 0', () => {
    render(
      <MemoryRouter initialEntries={['/other']}>
        <SidebarNavItem to="/marketing/monitoring" icon="💬" label="모니터링" badge={0} />
      </MemoryRouter>
    );
    expect(screen.queryByText('0')).toBeNull();
  });

  it('does not show badge when badge is undefined', () => {
    renderItem('/marketing/content');
    // No badge element in the DOM
    const link = screen.getByRole('link');
    expect(link.querySelectorAll('span').length).toBe(2); // icon + label only
  });
});
