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
  // 접근 B: 실제 표지가 있으면 그걸 그대로(오버레이 X) — 클린은 굽기 베이스라 노출 안 함.
  it('renders the real cover (not the clean base) with localized alt, no overlay', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('legacy.webp');
    expect(img.alt).toBe('The Frog Prince');
    expect(screen.queryByText('The Frog Prince')).not.toBeInTheDocument();
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
  });
  it('renders placeholder with accessible name when no cover at all', () => {
    const noCover = { title: '개구리 왕자' } as any;
    render(<BookCover book={noCover} lang="ko" overlayTitle />);
    expect(screen.getByRole('img', { name: '개구리 왕자' })).toBeInTheDocument();
  });
});
