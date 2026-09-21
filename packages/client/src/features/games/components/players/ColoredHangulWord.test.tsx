import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ColoredHangulWord } from './ColoredHangulWord';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

describe('ColoredHangulWord', () => {
  it('colors onset and coda orange and the vowel green', () => {
    const { container } = render(<ColoredHangulWord word="강" />);

    expect(container.querySelector('.sr-only')).toHaveTextContent('강');
    const consonantLayer = container.querySelector('[data-color-layer="consonant"]');
    const vowelLayer = container.querySelector('[data-color-layer="vowel"]');
    expect(consonantLayer).toHaveStyle({ color: TANGO_CHO_COLOR });
    expect(vowelLayer).toHaveStyle({ color: TANGO_JUNG_COLOR });
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
      expect(syllable).toHaveClass('h-[0.94em]', 'w-[0.9em]');
    }
  });

  it('keeps codas orange by limiting the vowel color to the medial area', () => {
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

  it('colors both parts of a compound vowel without changing the syllable measure', () => {
    const { container } = render(<ColoredHangulWord word="과" />);

    expect(container.querySelector('[data-hangul-syllable="과"]')).toHaveAttribute(
      'data-syllable-layout',
      'mixed'
    );
    expect(container.querySelectorAll('[data-color-layer="vowel"]')).toHaveLength(2);
  });
});
