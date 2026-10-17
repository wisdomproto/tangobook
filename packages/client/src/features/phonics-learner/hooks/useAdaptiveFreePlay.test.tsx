import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  profile: { id: '' },
  navigate: vi.fn(),
  fetch: vi.fn(),
  choose: vi.fn(),
  local: [] as { profile_id: string; id: string }[],
  guest: [] as { profile_id: string; id: string }[],
}));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ activeProfile: mocks.profile.id ? mocks.profile : null }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/lib/query-client', () => ({ queryClient: { fetchQuery: mocks.fetch } }));
vi.mock('@/features/learning/lib/event-outbox', () => ({
  readLocalReportEvents: () => mocks.local,
}));
vi.mock('@/features/learning/lib/guest-events', () => ({ readGuestEvents: () => mocks.guest }));
vi.mock('../lib/adaptive-free-play', () => ({ chooseAdaptiveFreePlay: mocks.choose }));
import { useAdaptiveFreePlay } from './useAdaptiveFreePlay';
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.profile.id = '';
  mocks.local = [];
  mocks.guest = [];
  mocks.choose.mockReturnValue({ href: '/chosen' });
});
it('guest play uses only unassigned guest history and starts immediately without a remote read', () => {
  mocks.guest = [
    { id: 'guest', profile_id: '' },
    { id: 'assigned', profile_id: 'other' },
  ];
  const { result } = renderHook(() => useAdaptiveFreePlay('korean'));
  act(() => {
    result.current.start('block');
    result.current.start('block');
  });
  expect(mocks.choose).toHaveBeenCalledTimes(1);
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.navigate).toHaveBeenCalledWith('/chosen');
  expect(mocks.choose.mock.calls[0][2]).toEqual([{ id: 'guest', profile_id: '' }]);
});
it('joins this child remote and pending records, excludes siblings and blocks duplicate starts', async () => {
  mocks.profile.id = 'a';
  mocks.local = [
    { id: 'pending', profile_id: 'a' },
    { id: 'sibling', profile_id: 'b' },
  ];
  let finish!: (value: unknown) => void;
  mocks.fetch.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const { result } = renderHook(() => useAdaptiveFreePlay('english'));
  act(() => {
    result.current.start('block');
    result.current.start('block');
  });
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(result.current.busy).toBe(true);
  await act(async () =>
    finish({
      events: [
        { id: 'remote', profile_id: 'a' },
        { id: 'wrong', profile_id: 'b' },
      ],
    })
  );
  expect(mocks.choose.mock.calls[0][2]).toEqual([
    { id: 'pending', profile_id: 'a' },
    { id: 'remote', profile_id: 'a' },
  ]);
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
});
it('a late request cannot launch the old child or language after switching', async () => {
  mocks.profile.id = 'a';
  let finish!: (value: unknown) => void;
  mocks.fetch.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const view = renderHook(({ lang }: { lang: 'korean' | 'english' }) => useAdaptiveFreePlay(lang), {
    initialProps: { lang: 'korean' },
  });
  act(() => view.result.current.start('block'));
  mocks.profile.id = 'b';
  view.rerender({ lang: 'english' });
  await act(async () => finish({ events: [] }));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.choose).not.toHaveBeenCalled();
});
it('history fetch failure uses only scoped local evidence, not guest or sibling records', async () => {
  mocks.profile.id = 'a';
  mocks.local = [
    { id: 'pending', profile_id: 'a' },
    { id: 'sibling', profile_id: 'b' },
  ];
  mocks.fetch.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useAdaptiveFreePlay('korean'));
  act(() => result.current.start('wordWrite'));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/chosen'));
  expect(mocks.choose.mock.calls[0][2]).toEqual([{ id: 'pending', profile_id: 'a' }]);
});
