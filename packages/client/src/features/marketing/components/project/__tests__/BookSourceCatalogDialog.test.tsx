import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Content, ContentSource } from '../../../types/database';

const mockMutate = vi.fn();
const mockSetSelectedContentId = vi.fn();

const source: ContentSource = {
  id: 'source-1',
  project_id: 'project-1',
  user_id: 'user-1',
  source_type: 'storybook',
  source_id: '1772107608499',
  source_state: 'approved',
  title: '신데렐라',
  category: '세계 명작',
  cover_image_url: null,
  languages: ['ko', 'en'],
  source_snapshot: { pageCount: 15 },
  source_updated_at: '2026-09-22T00:00:00Z',
  last_synced_at: '2026-09-22T00:00:00Z',
  created_at: '2026-09-22T00:00:00Z',
  updated_at: '2026-09-22T00:00:00Z',
};

vi.mock('../../../api/use-content-sources', () => ({
  useContentSources: () => ({ data: [source], isLoading: false, error: null }),
  useCreateContentFromSource: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('../../../store/ui-store', () => ({
  useUIStore: (
    selector: (state: { setSelectedContentId: typeof mockSetSelectedContentId }) => unknown
  ) => selector({ setSelectedContentId: mockSetSelectedContentId }),
}));

import { BookSourceCatalogDialog } from '../BookSourceCatalogDialog';

describe('BookSourceCatalogDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a synced book as unplanned and creates a named marketing plan', async () => {
    const user = userEvent.setup();
    render(
      <BookSourceCatalogDialog open onOpenChange={vi.fn()} projectId="project-1" contents={[]} />
    );

    expect(screen.getByText('신데렐라')).toBeInTheDocument();
    expect(screen.getByText(/기획 0개/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '첫 기획' }));
    const input = screen.getByLabelText('신데렐라의 마케팅 기획 이름');
    await user.clear(input);
    await user.type(input, '자정과 유리 구두 쇼츠');
    await user.click(screen.getByRole('button', { name: '기획 생성' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-1',
        source,
        sortOrder: 0,
        title: '자정과 유리 구두 쇼츠',
      }),
      expect.any(Object)
    );
  });

  it('counts existing plans through the explicit source relation', () => {
    const existing = { content_source_id: source.id } as Content;
    render(
      <BookSourceCatalogDialog
        open
        onOpenChange={vi.fn()}
        projectId="project-1"
        contents={[existing]}
      />
    );
    expect(screen.getByText(/기획 1개/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기획 추가' })).toBeInTheDocument();
  });
});
