import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Content, ContentKind } from '../../../types/database';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeleteMutate = vi.fn();
const mockReorderMutate = vi.fn();
const mockSetSelectedContentId = vi.fn();
const mockSetContentKindTab = vi.fn();

// Mutable state for selectedProjectId / selectedContentId so tests can control them
let _selectedProjectId: string | null = 'proj-1';
let _selectedContentId: string | null = null;
let _contentKindTab: ContentKind = 'regular';
let _contents: Content[] = [];

vi.mock('../../../api/use-contents', () => ({
  useContents: () => ({ data: _contents }),
  useDeleteContent: () => ({ mutate: mockDeleteMutate }),
  useReorderContents: () => ({ mutate: mockReorderMutate }),
}));

vi.mock('../../../store/ui-store', () => ({
  useUIStore: () => ({
    selectedProjectId: _selectedProjectId,
    selectedContentId: _selectedContentId,
    setSelectedContentId: mockSetSelectedContentId,
    contentKindTab: _contentKindTab,
    setContentKindTab: mockSetContentKindTab,
  }),
}));

// Stub out CreateContentDialog so it doesn't pull in unrelated app dependencies
vi.mock('../CreateContentDialog', () => ({
  CreateContentDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="새 콘텐츠 dialog">
        <span>새 콘텐츠</span>
        <button onClick={() => onOpenChange(false)}>닫기</button>
      </div>
    ) : null,
}));

// CreateContentDialog internally calls useCreateContent + useUIStore, already mocked.
// But it also renders a Dialog — that needs no extra mocking.

import { ContentListPanel } from '../ContentListPanel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContent(
  id: string,
  title: string,
  category: string | null = null,
  sortOrder = 0,
  kind: ContentKind = 'regular'
): Content {
  return {
    id,
    project_id: 'proj-1',
    user_id: 'u1',
    title,
    category,
    tags: null,
    memo: null,
    topic: null,
    content_kind: kind,
    status: 'draft',
    ai_model_settings: null,
    confirmed: false,
    sort_order: sortOrder,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContentListPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _selectedProjectId = 'proj-1';
    _selectedContentId = null;
    _contentKindTab = 'regular';
    _contents = [];
  });

  it('shows "프로젝트를 선택하세요" when no project is selected', () => {
    _selectedProjectId = null;
    render(<ContentListPanel />);
    expect(screen.getByText('프로젝트를 선택하세요')).toBeInTheDocument();
  });

  it('shows empty-state message when project has no contents', () => {
    _contents = [];
    render(<ContentListPanel />);
    expect(screen.getByText('콘텐츠가 없습니다')).toBeInTheDocument();
  });

  it('renders content titles for the selected project', () => {
    _contents = [
      makeContent('c1', '장 건강 가이드', null, 0),
      makeContent('c2', '프로바이오틱스 완전 분석', null, 1),
    ];
    render(<ContentListPanel />);
    expect(screen.getByTitle('장 건강 가이드')).toBeInTheDocument();
    expect(screen.getByTitle('프로바이오틱스 완전 분석')).toBeInTheDocument();
  });

  it('highlights the selected content', () => {
    _contents = [makeContent('c1', '선택된 콘텐츠')];
    _selectedContentId = 'c1';
    render(<ContentListPanel />);
    // The select button for c1 should have the active style class
    const item = screen.getByTitle('선택된 콘텐츠').closest('button');
    expect(item?.className).toMatch(/bg-primary/);
  });

  it('calls setSelectedContentId when a content item is clicked', async () => {
    const user = userEvent.setup();
    _contents = [makeContent('c1', '클릭 테스트')];
    render(<ContentListPanel />);

    const btn = screen.getByTitle('클릭 테스트').closest('button')!;
    await user.click(btn);
    expect(mockSetSelectedContentId).toHaveBeenCalledWith('c1');
  });

  it('calls useDeleteContent.mutate when delete menu item is clicked', async () => {
    const user = userEvent.setup();
    _contents = [makeContent('c1', '삭제할 콘텐츠')];
    render(<ContentListPanel />);

    // opacity-0 by CSS, but in jsdom the element is present and clickable
    const optionsBtn = screen.getByRole('button', { name: '콘텐츠 옵션' });
    await user.click(optionsBtn);

    const deleteItem = screen.getByText('삭제').closest('[role="menuitem"]')!;
    await user.click(deleteItem);

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1', projectId: 'proj-1' })
    );
  });

  it('shows category filter chips when contents have categories', () => {
    _contents = [
      makeContent('c1', '블로그 A', 'A카테고리', 0),
      makeContent('c2', '블로그 B', 'B카테고리', 1),
    ];
    render(<ContentListPanel />);
    // Category chips show first letter; there may be multiple elements with the same title
    // (chip button + the badge span inside the item), so we just check at least one exists
    expect(screen.getAllByTitle('A카테고리').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('B카테고리').length).toBeGreaterThan(0);
  });

  it('filters contents by category letter when chip is clicked', async () => {
    const user = userEvent.setup();
    _contents = [
      makeContent('c1', '블로그 A', 'A카테고리', 0),
      makeContent('c2', '블로그 B', 'B카테고리', 1),
    ];
    render(<ContentListPanel />);

    // The filter area chip buttons are the ones without data-testid="content-item" ancestry
    const filterChips = screen.getAllByTitle('A카테고리');
    // Click the one that is a <button> (the filter chip, not the badge span)
    const chipBtn = filterChips.find((el) => el.tagName === 'BUTTON')!;
    await user.click(chipBtn);

    expect(screen.getByTitle('블로그 A')).toBeInTheDocument();
    expect(screen.queryByTitle('블로그 B')).not.toBeInTheDocument();
  });

  it('shows "전체" filter chip and restores all items when clicked', async () => {
    const user = userEvent.setup();
    _contents = [
      makeContent('c1', '블로그 A', 'A카테고리', 0),
      makeContent('c2', '블로그 B', 'B카테고리', 1),
    ];
    render(<ContentListPanel />);

    // Filter to A
    const filterChips = screen.getAllByTitle('A카테고리');
    const chipBtn = filterChips.find((el) => el.tagName === 'BUTTON')!;
    await user.click(chipBtn);
    expect(screen.queryByTitle('블로그 B')).not.toBeInTheDocument();

    // Click 전체 to restore
    await user.click(screen.getByText('전체'));
    expect(screen.getByTitle('블로그 B')).toBeInTheDocument();
  });

  it('shows count in header', () => {
    _contents = [makeContent('c1', '콘텐츠 1'), makeContent('c2', '콘텐츠 2')];
    render(<ContentListPanel />);
    // (2) appears in both the header and the 정규 콘텐츠 tab badge
    expect(screen.getAllByText('(2)').length).toBeGreaterThan(0);
  });

  it('renders 정규 / 광고 tabs and only shows contents of the active kind', () => {
    _contents = [
      makeContent('c1', '정규 글', null, 0, 'regular'),
      makeContent('c2', '광고 릴스', null, 1, 'ad'),
    ];
    render(<ContentListPanel />);
    // Regular tab active by default → only regular content visible
    expect(screen.getByText('정규 콘텐츠', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('광고 콘텐츠', { exact: false })).toBeInTheDocument();
    expect(screen.getByTitle('정규 글')).toBeInTheDocument();
    expect(screen.queryByTitle('광고 릴스')).not.toBeInTheDocument();
  });

  it('shows ad contents when 광고 tab is the active kind', () => {
    _contentKindTab = 'ad';
    _contents = [
      makeContent('c1', '정규 글', null, 0, 'regular'),
      makeContent('c2', '광고 릴스', null, 1, 'ad'),
    ];
    render(<ContentListPanel />);
    expect(screen.getByTitle('광고 릴스')).toBeInTheDocument();
    expect(screen.queryByTitle('정규 글')).not.toBeInTheDocument();
  });

  it('opens CreateContentDialog when + button is clicked', async () => {
    const user = userEvent.setup();
    _contents = [];
    render(<ContentListPanel />);

    await user.click(screen.getByRole('button', { name: '새 콘텐츠' }));
    // Dialog should be visible (CreateContentDialog renders when open=true)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('새 콘텐츠')).toBeInTheDocument();
  });
});
