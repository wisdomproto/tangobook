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
  it('renders placeholder with accessible name when no cover at all', () => {
    const noCover = { title: '개구리 왕자' } as any;
    render(<BookCover book={noCover} lang="ko" overlayTitle />);
    expect(screen.getByRole('img', { name: '개구리 왕자' })).toBeInTheDocument();
  });
});
