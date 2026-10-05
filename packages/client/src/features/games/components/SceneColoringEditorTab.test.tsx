import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import { EditorLangProvider } from '@/contexts/EditorLangContext';
import { SceneColoringEditorTab } from './SceneColoringEditorTab';

vi.mock('./players/ColoringPlayer', () => ({
  ColoringPlayer: ({
    items,
    onBack,
  }: {
    items: Array<{ scene: { pageNumber: number; text: string } }>;
    onBack: () => void;
  }) => (
    <div>
      <p>
        {items[0].scene.pageNumber}쪽 플레이: {items[0].scene.text}
      </p>
      <button onClick={onBack}>돌아가기</button>
    </div>
  ),
}));
afterEach(cleanup);
const book = {
  id: '1773711154702',
  title: '강아지',
  pages: [
    { pageNumber: 11, text: '11쪽 한국어', translations: { en: { text: 'Page eleven' } } },
    { pageNumber: 13, text: '13쪽 한국어', translations: { en: { text: 'Page thirteen' } } },
  ],
} as unknown as Storybook;
function mount(target = book, lang = 'ko') {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={query}>
      <EditorLangProvider lang={lang}>
        <SceneColoringEditorTab storybook={target} />
      </EditorLangProvider>
    </QueryClientProvider>
  );
}
describe('장면 색칠 탭 미리보기', () => {
  it('선택한 쪽을 열고 Escape로 플레이어를 제거하여 목록으로 돌아간다', async () => {
    mount();
    await screen.findByText('13쪽 장면');
    fireEvent.click(screen.getAllByRole('button', { name: '게임 미리보기' })[1]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('13쪽 플레이: 13쪽 한국어')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(screen.getByText('13쪽 장면')).toBeTruthy();
  });
  it('선택 언어의 본문으로 실행하고 돌아가기로 닫는다', async () => {
    mount(book, 'en');
    await screen.findByText('11쪽 장면');
    fireEvent.click(screen.getAllByRole('button', { name: '게임 미리보기' })[0]);
    expect(screen.getByText('11쪽 플레이: Page eleven')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('제작 대상이 아닌 책에서 다른 책 도안을 노출하지 않는다', async () => {
    mount({ ...book, id: 'unmade-book' });
    await screen.findByText('이 책에는 아직 만든 장면 색칠 도안이 없습니다.');
    expect(screen.queryByRole('button', { name: '게임 미리보기' })).toBeNull();
  });
});
