import { useState } from 'react';
import { decomposeHangul, isHangulSyllable, isVerticalVowel } from '@tangobook/shared';
import './toy-hangul.css';

const BASIC = new Set(Array.from('ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ'));
const WHOLE_SYLLABLES = new Set(['가']);
const COMPOUND: Record<string, string[]> = {
  ㄲ: ['ㄱ', 'ㄱ'],
  ㄸ: ['ㄷ', 'ㄷ'],
  ㅃ: ['ㅂ', 'ㅂ'],
  ㅆ: ['ㅅ', 'ㅅ'],
  ㅉ: ['ㅈ', 'ㅈ'],
  ㅐ: ['ㅏ', 'ㅣ'],
  ㅒ: ['ㅑ', 'ㅣ'],
  ㅔ: ['ㅓ', 'ㅣ'],
  ㅖ: ['ㅕ', 'ㅣ'],
  ㅘ: ['ㅗ', 'ㅏ'],
  ㅙ: ['ㅗ', 'ㅐ'],
  ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'],
  ㅞ: ['ㅜ', 'ㅔ'],
  ㅟ: ['ㅜ', 'ㅣ'],
  ㅢ: ['ㅡ', 'ㅣ'],
  ㄳ: ['ㄱ', 'ㅅ'],
  ㄵ: ['ㄴ', 'ㅈ'],
  ㄶ: ['ㄴ', 'ㅎ'],
  ㄺ: ['ㄹ', 'ㄱ'],
  ㄻ: ['ㄹ', 'ㅁ'],
  ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'],
  ㄾ: ['ㄹ', 'ㅌ'],
  ㄿ: ['ㄹ', 'ㅍ'],
  ㅀ: ['ㄹ', 'ㅎ'],
  ㅄ: ['ㅂ', 'ㅅ'],
};
const MIXED_VOWELS = new Set(Array.from('ㅘㅙㅚㅝㅞㅟㅢ'));

function Art({ glyph }: { glyph: string }) {
  const [failed, setFailed] = useState(false);
  if (WHOLE_SYLLABLES.has(glyph) && !failed)
    return (
      <img
        className="toy-hangul-image"
        src={`/images/phonics/jamo-toys-v1/${glyph.codePointAt(0)!.toString(16)}.webp`}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  if (failed && BASIC.has(glyph)) return <span className="toy-hangul-fallback">{glyph}</span>;
  if (BASIC.has(glyph))
    return (
      <img
        className="toy-hangul-image"
        src={`/images/phonics/jamo-toys-v1/${glyph.codePointAt(0)!.toString(16)}.webp`}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  const parts = COMPOUND[glyph];
  if (parts)
    return (
      <span
        className={`toy-hangul-parts ${MIXED_VOWELS.has(glyph) ? 'toy-hangul-parts--mixed' : ''}`}
      >
        {parts.map((part, i) => (
          <span key={i}>
            <Art glyph={part} />
          </span>
        ))}
      </span>
    );
  if (isHangulSyllable(glyph)) {
    const { cho, jung, jong } = decomposeHangul(glyph);
    const vertical = isVerticalVowel(jung),
      mixed = MIXED_VOWELS.has(jung);
    return (
      <span className={`toy-hangul-syllable ${jong ? 'toy-hangul-syllable--coda' : ''}`}>
        <span
          className={`toy-hangul-body ${vertical ? 'toy-hangul-body--vertical' : ''} ${mixed ? 'toy-hangul-body--mixed' : ''}`}
        >
          <span>
            <Art glyph={cho} />
          </span>
          <span>
            <Art glyph={jung} />
          </span>
        </span>
        {jong && (
          <span className="toy-hangul-coda">
            <Art glyph={jong} />
          </span>
        )}
      </span>
    );
  }
  return <span className="toy-hangul-fallback">{glyph}</span>;
}

/** 그림 익히기 전용. 쓰기 캔버스/마스크에는 적용하지 않는다. */
export function ToyHangul({
  text,
  className = '',
  decorative = false,
}: {
  text: string;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <span
      className={`toy-hangul ${className}`}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : text}
      aria-hidden={decorative || undefined}
    >
      {!decorative && <span className="sr-only">{text}</span>}
      <span className="toy-hangul-art" aria-hidden="true">
        {Array.from(text).map((glyph, i) => (
          <span className="toy-hangul-cell" key={`${glyph}-${i}`}>
            <Art glyph={glyph} />
          </span>
        ))}
      </span>
    </span>
  );
}
