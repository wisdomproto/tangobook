import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { Storybook, BookVideoLibrary } from '@tangobook/shared';
const api = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), register: vi.fn(), upload: vi.fn() }));
vi.mock('../api/book-video.api', () => ({ bookVideoApi: api }));
import { BookVideoTab } from './BookVideoTab';
const initial = (): BookVideoLibrary => ({
  bookId: 'book-1',
  revision: 1,
  versions: [
    {
      id: 'v1',
      number: 1,
      createdAt: '2026-10-02',
      productions: {
        long: {
          languages: {
            ko: {
              subtitleSrt: '',
              narrationText: '한국어',
              video: {
                key: 'one',
                url: 'https://assets.test/one.mp4',
                name: 'one.mp4',
                bytes: 20,
                contentType: 'video/mp4',
              },
            },
            en: { subtitleSrt: '', narrationText: 'English' },
          },
        },
        short: { languages: {} },
      },
    },
  ],
});
beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue(initial());
  api.save.mockImplementation(async (_id, revision, productions) => ({
    bookId: 'book-1',
    revision: revision + 1,
    versions: [
      ...initial().versions,
      { id: 'v2', number: 2, createdAt: '2026-10-02', productions },
    ],
  }));
  api.register.mockResolvedValue({
    contentId: 'content',
    projectId: 'project',
    versionId: 'v2',
    reused: false,
  });
});
function mount() {
  return render(
    <MemoryRouter>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <BookVideoTab
          storybook={{ id: 'book-1', title: '신데렐라', languages: ['ko', 'en'] } as Storybook}
        />
      </QueryClientProvider>
    </MemoryRouter>
  );
}
describe('video language editing', () => {
  it('keeps shortform independent and recovers explicitly from a stale revision', async () => {
    mount();
    const input = await screen.findByLabelText('영상용 나레이션 대본');
    fireEvent.click(screen.getByRole('button', { name: '숏폼 · 9:16' }));
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: '숏폼 대본' } });
    fireEvent.click(screen.getByRole('button', { name: '롱폼 · 16:9' }));
    expect(input).toHaveValue('한국어');
    fireEvent.click(screen.getByRole('button', { name: '숏폼 · 9:16' }));
    expect(input).toHaveValue('숏폼 대본');
    api.save.mockRejectedValueOnce(
      new Error('다른 창에서 영상을 변경했습니다. 다시 불러온 뒤 저장해 주세요.')
    );
    fireEvent.click(screen.getByRole('button', { name: '영상 자료 저장' }));
    await screen.findByRole('alert');
    expect(input).toHaveValue('숏폼 대본');
    fireEvent.click(
      screen.getByRole('button', { name: '현재 변경을 버리고 최신 영상 자료 불러오기' })
    );
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByRole('button', { name: '영상 자료 저장' })).toBeDisabled();
  });
  it('preserves separate language drafts and requires saving before registration', async () => {
    mount();
    const input = await screen.findByLabelText('영상용 나레이션 대본');
    fireEvent.change(input, { target: { value: '새 한국어' } });
    expect(screen.getByRole('button', { name: '마케팅 콘텐츠로 등록' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '영어' }));
    expect(input).toHaveValue('English');
    fireEvent.change(input, { target: { value: 'New English' } });
    fireEvent.click(screen.getByRole('button', { name: '한국어' }));
    expect(input).toHaveValue('새 한국어');
    fireEvent.click(screen.getByRole('button', { name: '영상 자료 저장' }));
    await waitFor(() => expect(api.save).toHaveBeenCalled());
    const saved = api.save.mock.calls[0][2];
    expect(saved.long.languages.ko.narrationText).toBe('새 한국어');
    expect(saved.long.languages.en.narrationText).toBe('New English');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '마케팅 콘텐츠로 등록' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: '마케팅 콘텐츠로 등록' }));
    await screen.findByRole('link', { name: '마케팅에서 보기' });
    expect(api.register).toHaveBeenCalledWith('book-1', 'v2');
  });
  it('rejects invalid subtitle timing before saving', async () => {
    mount();
    const input = await screen.findByLabelText('영상용 SRT 자막');
    fireEvent.change(input, { target: { value: '1\n00:00:04,000 --> 00:00:02,000\n잘못된 시간' } });
    fireEvent.click(screen.getByRole('button', { name: '영상 자료 저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('자막 시간');
    expect(api.save).not.toHaveBeenCalled();
  });
});
