import type { ReactNode } from 'react';
import '../storybook-theme.css';

export function StorybookTitle({
  children,
  as: Heading = 'h1',
  compact = false,
  className = '',
}: {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'div';
  compact?: boolean;
  className?: string;
}) {
  return (
    <Heading className={`storybook-title ${compact ? 'is-compact' : ''} ${className}`}>
      <span>{children}</span>
    </Heading>
  );
}
