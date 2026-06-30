import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialAuthButtons } from './SocialAuthButtons';
import { authApi } from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  authApi: {
    signInWithKakao: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('SocialAuthButtons', () => {
  beforeEach(() => vi.clearAllMocks());

  it('카카오 + 구글 버튼 2개 렌더 (signin 라벨)', () => {
    render(<SocialAuthButtons mode="signin" />);
    expect(screen.getByRole('button', { name: /카카오로 로그인/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument();
  });

  it('signup 모드는 "시작하기" 라벨', () => {
    render(<SocialAuthButtons mode="signup" />);
    expect(screen.getByRole('button', { name: /카카오로 시작하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google로 시작하기/ })).toBeInTheDocument();
  });

  it('카카오 버튼 클릭 → signInWithKakao 호출', () => {
    render(<SocialAuthButtons mode="signin" />);
    fireEvent.click(screen.getByRole('button', { name: /카카오/ }));
    expect(authApi.signInWithKakao).toHaveBeenCalledTimes(1);
  });

  it('구글 버튼 클릭 → signInWithGoogle 호출', () => {
    render(<SocialAuthButtons mode="signin" />);
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    expect(authApi.signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});
