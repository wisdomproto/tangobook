import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const fetchLibrary = vi.hoisted(() => vi.fn());
vi.mock('@/features/settings/api/settings.api', () => ({
  settingsApi: { getPhonicsLibrary: fetchLibrary },
}));
import { usePhonicsMap } from './usePhonicsMap';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('loads/caches the needed map immediately, but postpones background downloads until core is ready', async () => {
  localStorage.clear();
  vi.useFakeTimers();
  const download = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', download);
  fetchLibrary.mockResolvedValue({
    mod_korean: [],
    mod_english: [],
    mod_phonics: [
      { sound: 'a', url: '/a.mp3' },
      { sound: 'b', url: '/b.mp3' },
    ],
  });
  const view = renderHook(
    ({ ready }) => usePhonicsMap(['mod_phonics', 'mod_english'], true, ready),
    { initialProps: { ready: false } }
  );
  await act(async () => {});
  expect(view.result.current.loading).toBe(false);
  expect(view.result.current.mapRef.current.get('a')).toBe('/a.mp3');
  expect(localStorage.getItem('tangobook-phonics-library-v3')).toContain('/a.mp3');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500);
  });
  expect(download).not.toHaveBeenCalled();
  view.rerender({ ready: true });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1499);
  });
  expect(download).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(download).toHaveBeenCalledTimes(2);
  expect(download).toHaveBeenCalledWith('/a.mp3', { cache: 'force-cache', mode: 'no-cors' });
  expect(fetchLibrary).toHaveBeenCalledTimes(1);
  view.rerender({ ready: false });
  view.rerender({ ready: true });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(download).toHaveBeenCalledTimes(2);
  expect(fetchLibrary).toHaveBeenCalledTimes(1);
  view.unmount();
});
