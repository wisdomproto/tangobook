import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfilePicker } from './ProfilePicker';
import type { ChildProfile } from '@tangobook/shared';

const mkProfile = (id: string, name: string): ChildProfile => ({
  id,
  accountId: 'acc1',
  name,
  avatarId: 'hori',
  birthDate: null,
  lastActiveAt: null,
  createdAt: '2026-04-23T00:00:00Z',
});

describe('ProfilePicker', () => {
  it('profiles 3명 + `+ 새 아이 추가` 버튼 렌더', () => {
    const profiles = [mkProfile('p1', '지민'), mkProfile('p2', '서연'), mkProfile('p3', '민준')];
    render(<ProfilePicker profiles={profiles} onSelect={vi.fn()} onAddNew={vi.fn()} />);
    expect(screen.getByText('지민')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /새 아이|추가/ })).toBeInTheDocument();
  });

  it('profiles 4명 한도 → `+` 버튼 숨김', () => {
    const profiles = ['p1', 'p2', 'p3', 'p4'].map((id, i) => mkProfile(id, `c${i}`));
    render(<ProfilePicker profiles={profiles} onSelect={vi.fn()} onAddNew={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /새 아이|추가/ })).toBeNull();
  });

  it('카드 탭 → onSelect(profile) 호출', () => {
    const onSelect = vi.fn();
    const profiles = [mkProfile('p1', '지민')];
    render(<ProfilePicker profiles={profiles} onSelect={onSelect} onAddNew={vi.fn()} />);
    fireEvent.click(screen.getByText('지민').closest('button')!);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });
});
