import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AnalyticsControl } from './AnalyticsControl';
import type { AuthContextValue } from '@/features/auth/context/AuthContext';

const mockAuth: Partial<AuthContextValue> = {};
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function setAccount(createdAt: string, email = 'parent@example.com') {
  mockAuth.account = {
    id: 'acc-1',
    email,
    hasPin: false,
    pinSetAt: null,
    createdAt,
  };
  mockAuth.loading = false;
}

describe('AnalyticsControl — 가입 전환 이벤트', () => {
  beforeEach(() => {
    localStorage.clear();
    window.fbq = vi.fn();
    window.gtag = vi.fn();
    window.__tbNoTrack = undefined;
    window.__tbInternal = undefined;
  });

  it('신선한 계정(1시간 이내)이면 CompleteRegistration 을 1회만 발화한다', () => {
    setAccount(new Date().toISOString());
    const { rerender } = render(<AnalyticsControl />);
    rerender(<AnalyticsControl />);
    const calls = (window.fbq as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[1] === 'CompleteRegistration'
    );
    expect(calls).toHaveLength(1);
    expect(localStorage.getItem('tb_fbq_reg:acc-1')).toBe('1');
  });

  it('가드 키가 있으면(다른 세션에서 이미 발화) 다시 발화하지 않는다', () => {
    localStorage.setItem('tb_fbq_reg:acc-1', '1');
    setAccount(new Date().toISOString());
    render(<AnalyticsControl />);
    expect(window.fbq).not.toHaveBeenCalledWith('track', 'CompleteRegistration');
  });

  it('1시간 지난 계정(기존 회원 로그인)은 발화하지 않는다', () => {
    setAccount(new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
    render(<AnalyticsControl />);
    expect(window.fbq).not.toHaveBeenCalledWith('track', 'CompleteRegistration');
  });

  it('내부 계정(__tbNoTrack)은 발화하지 않는다', () => {
    setAccount(new Date().toISOString(), 'kil210@gmail.com');
    render(<AnalyticsControl />);
    expect(window.fbq).not.toHaveBeenCalledWith('track', 'CompleteRegistration');
  });
});
