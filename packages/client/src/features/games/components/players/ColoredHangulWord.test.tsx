import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ColoredHangulWord } from './ColoredHangulWord';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

describe('ColoredHangulWord', () => {
  it('colors onset and coda orange and the vowel green', () => {
    const { container } = render(<ColoredHangulWord word="강" />);

    expect(container.querySelector('.sr-only')).toHaveTextContent('강');
    const consonants = container.querySelectorAll('[data-jamo-kind="consonant"]');
    const vowels = container.querySelectorAll('[data-jamo-kind="vowel"]');
    expect(consonants).toHaveLength(2);
    expect(vowels).toHaveLength(1);
    expect(consonants[0]).toHaveStyle({ color: TANGO_CHO_COLOR });
    expect(consonants[1]).toHaveStyle({ color: TANGO_CHO_COLOR });
    expect(vowels[0]).toHaveStyle({ color: TANGO_JUNG_COLOR });
    expect(
      Array.from(container.querySelectorAll('[data-jamo-role]')).map((node) => node.textContent)
    ).toEqual(['ㄱ', 'ㅏ', 'ㅇ']);
  });

  it('keeps side and below vowel syllables in their matching layouts', () => {
    const { container } = render(<ColoredHangulWord word="가고" />);
    const sideVowel = container.querySelector('[data-hangul-syllable="가"]');
    const belowVowel = container.querySelector('[data-hangul-syllable="고"]');

    expect(sideVowel).toHaveAttribute('data-syllable-layout', 'side');
    expect(belowVowel).toHaveAttribute('data-syllable-layout', 'below');
  });

  it('keeps every syllable on the same compact outside measure', () => {
    const { container } = render(<ColoredHangulWord word="나무강공" />);
    const syllables = container.querySelectorAll('[data-hangul-syllable]');

    expect(syllables).toHaveLength(4);
    for (const syllable of syllables) {
      expect(syllable).toHaveClass('h-[0.98em]', 'w-[0.94em]');
    }
  });

  it('leaves visible breathing room between an onset and its medial', () => {
    const { container } = render(<ColoredHangulWord word="리오" />);

    const sideMedial = container.querySelector(
      '[data-hangul-syllable="리"] [data-jamo-role="medial"]'
    );
    const belowMedial = container.querySelector(
      '[data-hangul-syllable="오"] [data-jamo-role="medial"]'
    );
    expect(sideMedial).toHaveClass('left-[0.41em]');
    expect(belowMedial).toHaveClass('top-[0.39em]');
  });

  it('keeps codas as their own orange jamo', () => {
    const { container } = render(<ColoredHangulWord word="강공" />);

    expect(container.querySelector('[data-hangul-syllable="강"]')).toHaveAttribute(
      'data-syllable-layout',
      'side-coda'
    );
    expect(container.querySelector('[data-hangul-syllable="공"]')).toHaveAttribute(
      'data-syllable-layout',
      'below-coda'
    );
  });

  it('keeps a compound vowel as one green medial', () => {
    const { container } = render(<ColoredHangulWord word="과" />);

    expect(container.querySelector('[data-hangul-syllable="과"]')).toHaveAttribute(
      'data-syllable-layout',
      'mixed'
    );
    const vowel = container.querySelector('[data-jamo-role="medial"]');
    expect(vowel).toHaveTextContent('ㅘ');
    expect(vowel).toHaveStyle({ color: TANGO_JUNG_COLOR });
  });
});
