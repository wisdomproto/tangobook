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
      expect(syllable).toHaveClass('h-[1.18em]', 'w-[1.02em]');
    }
  });

  it('leaves visible breathing room between an onset and its medial', () => {
    const { container } = render(<ColoredHangulWord word="리오하프" />);

    const sideMedial = container.querySelector(
      '[data-hangul-syllable="리"] [data-jamo-role="medial"]'
    );
    const wideSideMedial = container.querySelector(
      '[data-hangul-syllable="하"] [data-jamo-role="medial"]'
    );
    const belowMedial = container.querySelector(
      '[data-hangul-syllable="오"] [data-jamo-role="medial"]'
    );
    expect(sideMedial).toHaveClass('left-[0.48em]');
    expect(wideSideMedial).toHaveClass('left-[0.55em]');
    expect(belowMedial).toHaveClass('top-[0.64em]');
  });

  it('aligns a below-vowel syllable lower than a side-vowel syllable', () => {
    const { container } = render(<ColoredHangulWord word="하프" />);

    const belowOnset = container.querySelector(
      '[data-hangul-syllable="프"] [data-jamo-role="onset"]'
    );
    const belowMedial = container.querySelector(
      '[data-hangul-syllable="프"] [data-jamo-role="medial"]'
    );
    expect(belowOnset).toHaveClass('top-[0.13em]');
    expect(belowMedial).toHaveClass('top-[0.64em]');
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

  it('gives each row of a below-vowel syllable with a coda its own space', () => {
    const { container } = render(<ColoredHangulWord word="불" />);

    const onset = container.querySelector('[data-hangul-syllable="불"] [data-jamo-role="onset"]');
    const medial = container.querySelector('[data-hangul-syllable="불"] [data-jamo-role="medial"]');
    const coda = container.querySelector('[data-hangul-syllable="불"] [data-jamo-role="coda"]');

    expect(onset).toHaveClass('top-0', 'h-[0.48em]', 'text-[0.5em]');
    expect(medial).toHaveClass('top-[0.5em]', 'h-[0.34em]', 'text-[0.36em]');
    expect(coda).toHaveClass('top-[0.86em]', 'h-[0.4em]', 'text-[0.44em]');
  });

  it('keeps a side-vowel syllable with a coda close in scale to its neighbor', () => {
    const { container } = render(<ColoredHangulWord word="침대" />);

    const codaOnset = container.querySelector(
      '[data-hangul-syllable="침"] [data-jamo-role="onset"]'
    );
    const plainOnset = container.querySelector(
      '[data-hangul-syllable="대"] [data-jamo-role="onset"]'
    );
    const coda = container.querySelector('[data-hangul-syllable="침"] [data-jamo-role="coda"]');

    expect(codaOnset).toHaveClass('text-[0.62em]', 'top-[0.02em]');
    expect(plainOnset).toHaveClass('text-[0.74em]', 'top-[0.16em]');
    expect(coda).toHaveClass('top-[0.74em]', 'text-[0.44em]');
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
