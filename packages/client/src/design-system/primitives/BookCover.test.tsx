import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookCover } from './BookCover';
const book = {
  title: '개구리 왕자',
  titleTranslations: { en: 'The Frog Prince' },
  coverImage: 'legacy.webp',
  cleanCoverImage: 'clean.webp',
} as any;
describe('BookCover', () => {
  it('uses clean art instead of baked lettering and overlays the localized title', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('clean.webp');
    expect(img.alt).toBe('The Frog Prince');
    expect(screen.getByText('The Frog Prince')).toBeInTheDocument();
  });
  it('overlays title only when falling back to the clean base (no real cover)', () => {
    const cleanOnly = { ...book, coverImage: undefined };
    render(<BookCover book={cleanOnly} lang="en" overlayTitle />);
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('clean.webp');
    expect(screen.getByText('The Frog Prince')).toBeInTheDocument();
  });
  it('does not render overlay text when overlayTitle=false (caption surfaces)', () => {
    render(<BookCover book={book} lang="ko" overlayTitle={false} />);
    expect(screen.queryByText('개구리 왕자')).not.toBeInTheDocument();
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('legacy.webp');
  });
  it('does not double-title a legacy cover before clean artwork is available', () => {
    render(<BookCover book={{ ...book, cleanCoverImage: undefined }} lang="en" overlayTitle />);
    expect(screen.queryByText('The Frog Prince')).not.toBeInTheDocument();
  });
  it('resolves regional language tags to the translated title', () => {
    render(<BookCover book={book} lang="en-US" overlayTitle />);
    expect(screen.getByText('The Frog Prince')).toBeInTheDocument();
  });
  it.each([
    ['반쪽이', '半边儿'],
    ['15. 편지 배달 왔어요', '15. 来送信啦'],
    ['20. 내일 또 만나요', '20. 明天再见'],
  ])('supplies missing Chinese library titles for %s', (title, translated) => {
    render(
      <BookCover
        book={{ ...book, title, titleTranslations: undefined }}
        lang="zh-CN"
        overlayTitle
      />
    );
    expect(screen.getByText(translated)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('alt', translated);
  });
  it('keeps an editor-provided translation ahead of the legacy title catalog', () => {
    render(
      <BookCover
        book={{ ...book, title: '반쪽이', titleTranslations: { zh: '编辑的书名' } }}
        lang="zh"
        overlayTitle
      />
    );
    expect(screen.getByText('编辑的书名')).toBeInTheDocument();
  });
  it('renders placeholder with accessible name when no cover at all', () => {
    const noCover = { title: '개구리 왕자' } as any;
    render(<BookCover book={noCover} lang="ko" overlayTitle />);
    expect(screen.getByRole('img', { name: '개구리 왕자' })).toBeInTheDocument();
  });
});
