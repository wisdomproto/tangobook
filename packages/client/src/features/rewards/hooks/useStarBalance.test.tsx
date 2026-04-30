import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useStarBalance } from './useStarBalance';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../api/rewards.api', () => ({
  rewardsApi: { getBalance: vi.fn(), getLedger: vi.fn() },
}));

import { useAuth } from '@/features/auth/context/AuthContext';
import { rewardsApi } from '../api/rewards.api';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useStarBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('활성 프로필 있으면 잔고 반환', async () => {
    (useAuth as any).mockReturnValue({ activeProfile: { id: 'p1' } });
    (rewardsApi.getBalance as any).mockResolvedValue({
      profile_id: 'p1',
      stars_total: 42,
      streak_days: 3,
      last_active_date: '2026-04-30',
    });

    const { result } = renderHook(() => useStarBalance(), { wrapper });
    await waitFor(() => expect(result.current.data?.stars_total).toBe(42));
    expect(result.current.data?.streak_days).toBe(3);
    expect(rewardsApi.getBalance).toHaveBeenCalledWith('p1');
  });

  it('활성 프로필 없으면 query disabled', () => {
    (useAuth as any).mockReturnValue({ activeProfile: null });

    const { result } = renderHook(() => useStarBalance(), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(rewardsApi.getBalance).not.toHaveBeenCalled();
  });
});
