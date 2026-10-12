import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToyHangul } from './ToyHangul';

describe('picture letters for exploration', () => {
  it.each([
    ['거', ['ㄱ', 'ㅓ']],
    ['고', ['ㄱ', 'ㅗ']],
    ['과', ['ㄱ', 'ㅗ', 'ㅏ']],
    ['강', ['ㄱ', 'ㅏ', 'ㅇ']],
    ['까', ['ㄱ', 'ㄱ', 'ㅏ']],
    ['ㅊ', ['ㅊ']],
    ['ㅐ', ['ㅏ', 'ㅣ']],
  ])('keeps %s accessible and composes its actual constituent artwork', (text, glyphs) => {
    const { container } = render(<ToyHangul text={text} />);
    expect(screen.getByRole('img', { name: text })).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    ).toEqual(
      glyphs.map(
        (glyph) => `/images/phonics/jamo-toys-v1/${glyph.codePointAt(0)!.toString(16)}.webp`
      )
    );
    if (text === '고') expect(container.querySelector('.toy-hangul-body--vertical')).not.toBeNull();
    if (text === '과') expect(container.querySelector('.toy-hangul-body--mixed')).not.toBeNull();
    if (text === '강') expect(container.querySelector('.toy-hangul-coda')).not.toBeNull();
  });
  it('retains a readable letter when its picture fails to load', () => {
    const { container } = render(<ToyHangul text="ㅊ" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('.toy-hangul-fallback')).toHaveTextContent('ㅊ');
  });
  it('uses coherent whole-syllable artwork and falls back to its jamo if it fails', () => {
    const { container } = render(<ToyHangul text="가" />);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/images/phonics/jamo-toys-v1/ac00.webp'
    );
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByRole('img', { name: '가' })).toBeInTheDocument();
    expect(
      Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
    ).toEqual(['/images/phonics/jamo-toys-v1/3131.webp', '/images/phonics/jamo-toys-v1/314f.webp']);
  });
});
