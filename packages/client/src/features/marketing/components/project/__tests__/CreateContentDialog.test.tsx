import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockMutate = vi.fn();
const mockSetSelectedContentId = vi.fn();

vi.mock('../../../api/use-contents', () => ({
  useCreateContent: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock('../../../store/ui-store', () => ({
  useUIStore: () => ({
    setSelectedContentId: mockSetSelectedContentId,
  }),
}));

import { CreateContentDialog } from '../CreateContentDialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ID = 'project-abc';

function renderDialog(open = true, onOpenChange = vi.fn()) {
  return render(
    <CreateContentDialog open={open} onOpenChange={onOpenChange} projectId={PROJECT_ID} />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateContentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('새 콘텐츠')).toBeInTheDocument();
  });

  it('does NOT render when open=false', () => {
    renderDialog(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submit button is disabled when title is empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  it('calls mutate with title and projectId on submit', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (c: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'new-content-id' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/콘텐츠 제목/i), '장 건강 가이드');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '장 건강 가이드',
        project_id: PROJECT_ID,
      }),
      expect.any(Object)
    );
  });

  it('calls setSelectedContentId and onOpenChange(false) on success', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (c: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'new-content-id' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/콘텐츠 제목/i), '테스트 콘텐츠');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockSetSelectedContentId).toHaveBeenCalledWith('new-content-id');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits on Enter in title field', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (c: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'x' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/콘텐츠 제목/i), '엔터 테스트{Enter}');

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ title: '엔터 테스트' }),
      expect.any(Object)
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('parses comma-separated tags', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (c: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'x' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/콘텐츠 제목/i), '제목');
    await user.type(screen.getByLabelText(/태그/i), '건강, 운동, 다이어트');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['건강', '운동', '다이어트'] }),
      expect.any(Object)
    );
  });

  it('calls onOpenChange(false) when 취소 is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
