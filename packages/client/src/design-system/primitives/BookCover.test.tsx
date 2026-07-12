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
  it('renders clean cover img with localized alt', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('clean.webp');
    expect(img.alt).toBe('The Frog Prince');
  });
  it('shows overlay title text when overlayTitle + clean cover present', () => {
    render(<BookCover book={book} lang="en" overlayTitle />);
    expect(screen.getByText('The Frog Prince')).toBeInTheDocument();
  });
  it('suppresses overlay on legacy fallback (no clean cover)', () => {
    const legacyOnly = { ...book, cleanCoverImage: undefined };
    render(<BookCover book={legacyOnly} lang="en" overlayTitle />);
    expect(screen.queryByText('The Frog Prince')).not.toBeInTheDocument();
    expect((screen.getByRole('img') as HTMLImageElement).src).toContain('legacy.webp');
  });
  it('does not render overlay text when overlayTitle=false (caption surfaces)', () => {
    render(<BookCover book={book} lang="ko" overlayTitle={false} />);
    expect(screen.queryByText('개구리 왕자')).not.toBeInTheDocument();
  });
});
