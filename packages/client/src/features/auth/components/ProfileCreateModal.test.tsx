import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCreateModal } from './ProfileCreateModal';

describe('ProfileCreateModal', () => {
  it('이름이 비어있으면 저장 버튼 disabled', () => {
    render(<ProfileCreateModal open mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const submit = screen.getByRole('button', { name: /저장|만들기|완료/ });
    expect(submit).toBeDisabled();
  });

  it('이름 11자 입력 시도해도 maxLength=10으로 막힘', () => {
    render(<ProfileCreateModal open mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText('이름') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '가나다라마바사아자차카' } });
    expect(input.value.length).toBeLessThanOrEqual(10);
  });

  it('정상 제출 → onSubmit({ name, avatarId, birthDate }) 호출', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileCreateModal open mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />);
    const input = screen.getByPlaceholderText('이름');
    fireEvent.change(input, { target: { value: '지민' } });
    const hori = screen.getByRole('button', { name: /아바타 hori/ });
    fireEvent.click(hori);
    const submit = screen.getByRole('button', { name: /저장|만들기|완료/ });
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({
      name: '지민',
      avatarId: 'hori',
      birthDate: null,
    });
  });
});
