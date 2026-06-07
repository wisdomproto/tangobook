import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockMutate = vi.fn();
const mockSetSelectedProjectId = vi.fn();

vi.mock('../../../api/use-projects', () => ({
  useCreateProject: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock('../../../store/ui-store', () => ({
  useUIStore: () => ({
    setSelectedProjectId: mockSetSelectedProjectId,
  }),
}));

import { CreateProjectDialog } from '../CreateProjectDialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDialog(open = true, onOpenChange = vi.fn()) {
  return render(<CreateProjectDialog open={open} onOpenChange={onOpenChange} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateProjectDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open=true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('새 프로젝트')).toBeInTheDocument();
  });

  it('does NOT render when open=false', () => {
    renderDialog(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submit button is disabled when name is empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  it('calls mutate with name on submit button click', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    // Simulate onSuccess being called when mutate is invoked
    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (p: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'new-proj-id' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/프로젝트 이름/i), '탱고북 프로젝트');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: '탱고북 프로젝트' }),
      expect.any(Object)
    );
  });

  it('calls onOpenChange(false) and setSelectedProjectId on success', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (p: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'new-proj-id' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/프로젝트 이름/i), '탱고북');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockSetSelectedProjectId).toHaveBeenCalledWith('new-proj-id');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits on Enter key in name field', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (p: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'new-proj-id' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/프로젝트 이름/i), '키보드 테스트{Enter}');

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: '키보드 테스트' }),
      expect.any(Object)
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when 취소 is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does NOT include description when left blank', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    mockMutate.mockImplementation(
      (_data: unknown, callbacks: { onSuccess: (p: { id: string }) => void }) => {
        callbacks.onSuccess({ id: 'x' });
      }
    );

    renderDialog(true, onOpenChange);

    await user.type(screen.getByLabelText(/프로젝트 이름/i), '이름만');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ description: undefined }),
      expect.any(Object)
    );
  });
});
