/** BookMultiSelectGrid — renders public storybooks, tap toggles selection order badge. */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/features/storybook', () => ({
  useStorybooks: () => ({
    data: [
      { id: 'b1', title: '토끼', isPublic: true, type: 'storybook', coverImage: '' },
      { id: 'b2', title: '거북이', isPublic: true, type: 'storybook', coverImage: '' },
      { id: 'p1', title: '파닉스', isPublic: true, type: 'phonics', coverImage: '' },
      { id: 'b3', title: '숨김책', isPublic: false, type: 'storybook', coverImage: '' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

import { BookMultiSelectGrid } from './BookMultiSelectGrid';

describe('BookMultiSelectGrid', () => {
  it('renders only public storybooks (no phonics, no private)', () => {
    render(<BookMultiSelectGrid selectedIds={[]} onToggle={() => {}} />);
    expect(screen.getByText('토끼')).toBeInTheDocument();
    expect(screen.getByText('거북이')).toBeInTheDocument();
    expect(screen.queryByText('파닉스')).not.toBeInTheDocument();
    expect(screen.queryByText('숨김책')).not.toBeInTheDocument();
  });

  it('calls onToggle with the tapped book id', () => {
    const onToggle = vi.fn();
    render(<BookMultiSelectGrid selectedIds={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('토끼'));
    expect(onToggle).toHaveBeenCalledWith('b1');
  });

  it('shows selection order badge for selected books', () => {
    render(<BookMultiSelectGrid selectedIds={['b2', 'b1']} onToggle={() => {}} />);
    // 거북이 first (order 1), 토끼 second (order 2)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
