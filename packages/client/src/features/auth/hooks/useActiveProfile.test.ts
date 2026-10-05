import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { ChildProfile } from '@tangobook/shared';
import { useActiveProfile } from './useActiveProfile';
vi.mock('../api/profiles.api', () => ({
  profilesApi: { touchActive: vi.fn().mockResolvedValue(undefined) },
}));
const profile = (id: string): ChildProfile => ({
  id,
  accountId: 'qa',
  name: id,
  avatarId: 'hori',
  birthDate: null,
  lastActiveAt: null,
  createdAt: '2026-10-05',
});
beforeEach(() => localStorage.clear());
it('keeps the selected child through initial empty loading and restores it after reload', () => {
  localStorage.setItem('tangobook:activeProfileId', 'second');
  const { result, rerender } = renderHook(
    ({ profiles, ready }) => useActiveProfile(profiles, ready),
    { initialProps: { profiles: [] as ChildProfile[], ready: false } }
  );
  expect(localStorage.getItem('tangobook:activeProfileId')).toBe('second');
  expect(result.current.activeProfile).toBeNull();
  rerender({ profiles: [profile('first'), profile('second')], ready: true });
  expect(result.current.activeProfile?.id).toBe('second');
});
it('clears a stale child only after the new account profile list has loaded', async () => {
  localStorage.setItem('tangobook:activeProfileId', 'other-account-child');
  const { result, rerender } = renderHook(
    ({ ready }) => useActiveProfile([profile('first'), profile('second')], ready),
    { initialProps: { ready: false } }
  );
  expect(result.current.activeProfile).toBeNull();
  expect(localStorage.getItem('tangobook:activeProfileId')).toBe('other-account-child');
  rerender({ ready: true });
  await waitFor(() => expect(localStorage.getItem('tangobook:activeProfileId')).toBeNull());
});
it('does not auto-select a child from an unfinished account request', () => {
  const { result, rerender } = renderHook(
    ({ ready }) => useActiveProfile([profile('only')], ready),
    { initialProps: { ready: false } }
  );
  expect(result.current.activeProfile).toBeNull();
  expect(localStorage.getItem('tangobook:activeProfileId')).toBeNull();
  rerender({ ready: true });
  expect(result.current.activeProfile?.id).toBe('only');
});
