import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ColoredHangulWord } from './ColoredHangulWord';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

describe('ColoredHangulWord', () => {
  it('colors onset and coda orange and the vowel green', () => {
    const { container } = render(<ColoredHangulWord word="강" />);

    expect(screen.getByText('강')).toHaveClass('sr-only');
    const consonants = container.querySelectorAll('[data-jamo-kind="consonant"]');
    const vowels = container.querySelectorAll('[data-jamo-kind="vowel"]');
    expect(consonants).toHaveLength(2);
    expect(vowels).toHaveLength(1);
    expect(consonants[0]).toHaveStyle({ color: TANGO_CHO_COLOR });
    expect(consonants[1]).toHaveStyle({ color: TANGO_CHO_COLOR });
    expect(vowels[0]).toHaveStyle({ color: TANGO_JUNG_COLOR });
  });

  it('keeps side and below vowel syllables in their matching layouts', () => {
    const { container } = render(<ColoredHangulWord word="가고" />);
    const sideVowel = container.querySelector('[data-hangul-syllable="가"]');
    const belowVowel = container.querySelector('[data-hangul-syllable="고"]');

    expect(sideVowel).toHaveClass('grid-cols-2');
    expect(belowVowel).toHaveClass('grid-cols-1');
  });
});
