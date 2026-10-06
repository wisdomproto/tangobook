import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhonicsUnitGate } from './PhonicsUnitGate';
const state = vi.hoisted(() => ({ loading: false, error: false, allowed: false }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ session: null, isConfigured: true }),
}));
vi.mock('@/features/storybook', () => ({
  useStorybook: () => ({
    data: { id: 'related-unit' },
    isLoading: state.loading,
    isError: state.error,
  }),
}));
vi.mock('../config', () => ({ BETA_OPEN: false }));
vi.mock('../hooks/useAccess', () => ({ useAccess: () => ({}) }));
vi.mock('@tangobook/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tangobook/shared')>()),
  canReadBook: () => state.allowed,
}));
vi.mock('./EntryGate', () => ({ EntryGate: () => <p>로그인 안내</p> }));
const show = () =>
  render(
    <MemoryRouter>
      <PhonicsUnitGate unitId="related-unit">
        <p>실제 파닉스 활동</p>
      </PhonicsUnitGate>
    </MemoryRouter>
  );
beforeEach(() => {
  state.loading = false;
  state.error = false;
  state.allowed = false;
});
it('does not mount the embedded player when the related unit is locked', () => {
  show();
  expect(screen.getByText('로그인 안내')).toBeInTheDocument();
  expect(screen.queryByText('실제 파닉스 활동')).toBeNull();
});
it('keeps loading and query errors from exposing an unverified unit', () => {
  state.loading = true;
  const { rerender } = show();
  expect(screen.queryByText('실제 파닉스 활동')).toBeNull();
  state.loading = false;
  state.error = true;
  rerender(
    <MemoryRouter>
      <PhonicsUnitGate unitId="related-unit">
        <p>실제 파닉스 활동</p>
      </PhonicsUnitGate>
    </MemoryRouter>
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('실제 파닉스 활동')).toBeNull();
});
it('mounts an accessible unit using the same gate', () => {
  state.allowed = true;
  show();
  expect(screen.getByText('실제 파닉스 활동')).toBeInTheDocument();
});
