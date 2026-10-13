import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import BookDetailPage from './BookDetailPage';

const state = vi.hoisted(() => ({
  entitled: true,
  hideVocabulary: false,
  session: null as null | object,
}));
vi.mock('@/features/storybook', () => ({
  useStorybook: () => ({
    data: {
      id: 'test',
      title: '테스트 동화',
      type: 'storybook',
      artStyle: 'paper-craft',
      languages: ['ko', 'en'],
      pages: [],
      hideVocabulary: state.hideVocabulary,
      key_objects: state.hideVocabulary ? [] : [{ name: 'cat' }],
    },
  }),
  useStorybooks: () => ({ data: [] }),
}));
vi.mock('@/features/games/hooks/useSceneColoringItems', () => ({ useSceneColoringCount: () => 2 }));
vi.mock('@/features/library/hooks/useBookGroups', () => ({ useBookGroups: () => ({}) }));
vi.mock('@/lib/art-style-genre', () => ({ useStyleGenreLabel: () => (style: string) => style }));
vi.mock('@/lib/useSeo', () => ({ useSeo: () => {} }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ account: null, session: state.session, isConfigured: true }),
}));
vi.mock('@/features/access/config', () => ({ BETA_OPEN: false }));
vi.mock('@/features/access', () => ({
  useAccess: () => ({ isEntitled: state.entitled }),
  PaywallNotice: () => null,
  LockBadge: () => null,
}));

function Destination() {
  return <output>{useLocation().pathname + useLocation().search}</output>;
}
function showBook(search = '') {
  render(
    <MemoryRouter initialEntries={['/library/test' + search]}>
      <Routes>
        <Route path="/library/:id" element={<BookDetailPage />} />
        <Route path="*" element={<Destination />} />
      </Routes>
    </MemoryRouter>
  );
}
describe('book learner choices', () => {
  beforeEach(() => {
    state.entitled = true;
    state.hideVocabulary = false;
    state.session = {};
  });
  it('offers read aloud and vocabulary, without a self-reading or story-game choice', () => {
    showBook();
    expect(screen.getByRole('button', { name: /읽어주기/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /게임/ })).toBeEnabled();
    expect(screen.queryByText('스스로 책읽기')).toBeNull();
    expect(screen.queryByText(/동화 내용 놀이/)).toBeNull();
  });
  it('still offers games for scene-only books that hide vocabulary', () => {
    state.hideVocabulary = true;
    showBook();
    expect(screen.getByRole('button', { name: /게임/ })).toBeEnabled();
  });
  it('starts narration automatically in the selected language and style', async () => {
    showBook();
    await userEvent.click(screen.getByRole('button', { name: '언어 English' }));
    await userEvent.click(screen.getByRole('button', { name: /읽어주기/ }));
    expect(screen.getByRole('status').textContent).toBe(
      '/viewer/test?lang=en&style=paper-craft&autoplay=1'
    );
  });
  it('opens vocabulary directly with the selected language and style', async () => {
    showBook();
    await userEvent.click(screen.getByRole('button', { name: '언어 English' }));
    await userEvent.click(screen.getByRole('button', { name: /게임/ }));
    expect(screen.getByRole('status').textContent).toBe(
      '/vocabulary/book-test?style=paper-craft&lang=en'
    );
  });
  it('restores the language on returning from the vocabulary menu', async () => {
    showBook('?lang=en');
    expect(screen.getByRole('button', { name: '언어 English' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await userEvent.click(screen.getByRole('button', { name: /읽어주기/ }));
    expect(screen.getByRole('status').textContent).toContain('lang=en');
  });
  it.each([false, true])('preserves the activity gate when logged in = %s', async (loggedIn) => {
    state.entitled = false;
    state.session = loggedIn ? {} : null;
    showBook();
    await userEvent.click(screen.getByRole('button', { name: /게임/ }));
    expect(screen.getByRole('status').textContent).toBe(
      loggedIn ? '/subscribe' : '/login?mode=signup'
    );
  });
});
