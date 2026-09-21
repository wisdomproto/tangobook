import { decomposeHangul, isHangulSyllable, isVerticalVowel } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

interface ColoredHangulWordProps {
  word: string;
  className?: string;
}

type SyllableLayout = 'side' | 'side-coda' | 'below' | 'below-coda' | 'mixed' | 'mixed-coda';

const MIXED_VOWELS = new Set(['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']);

const VOWEL_CLIPS: Record<SyllableLayout, string[]> = {
  side: ['inset(0 0 0 48%)'],
  'side-coda': ['polygon(48% 0, 100% 0, 100% 68%, 48% 68%)'],
  below: ['inset(48% 0 0 0)'],
  'below-coda': ['polygon(0 34%, 100% 34%, 100% 69%, 0 69%)'],
  mixed: ['inset(45% 0 0 0)', 'inset(0 0 0 62%)'],
  'mixed-coda': [
    'polygon(0 34%, 100% 34%, 100% 69%, 0 69%)',
    'polygon(62% 0, 100% 0, 100% 69%, 62% 69%)',
  ],
};

function getSyllableLayout(vowel: string, hasCoda: boolean): SyllableLayout {
  if (MIXED_VOWELS.has(vowel)) return hasCoda ? 'mixed-coda' : 'mixed';
  if (isVerticalVowel(vowel)) return hasCoda ? 'below-coda' : 'below';
  return hasCoda ? 'side-coda' : 'side';
}

function ColoredSyllable({ char }: { char: string }) {
  const syllable = decomposeHangul(char);
  const layout = getSyllableLayout(syllable.jung, !!syllable.jong);

  return (
    <span
      data-hangul-syllable={char}
      data-syllable-layout={layout}
      className="relative inline-block h-[0.94em] w-[0.9em] shrink-0 align-middle leading-none"
    >
      {/* 완성형 글리프를 유지해 자모의 크기와 간격은 폰트 본래 비율을 따른다. */}
      <span
        data-color-layer="consonant"
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-display font-black leading-none"
        style={{
          color: TANGO_CHO_COLOR,
          WebkitTextStroke: '0.035em white',
          paintOrder: 'stroke fill',
          filter: 'drop-shadow(0 0.055em 0 rgba(0, 0, 0, 0.09))',
        }}
      >
        {char}
      </span>
      {VOWEL_CLIPS[layout].map((clipPath, index) => (
        <span
          key={clipPath}
          data-color-layer="vowel"
          data-color-layer-part={index + 1}
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display font-black leading-none"
          style={{ color: TANGO_JUNG_COLOR, clipPath }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

/**
 * 완성형 한글 글리프의 자연스러운 비율은 그대로 두고 자음·모음 영역에 탱고 블록 색을 입힌다.
 * 초성·받침은 주황, 모음은 녹색이며 스크린리더에는 완성된 단어 하나로 전달한다.
 */
export function ColoredHangulWord({ word, className }: ColoredHangulWordProps) {
  return (
    <span className={cn('inline-flex items-center tracking-normal', className)}>
      <span className="sr-only">{word}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-[0.025em]">
        {Array.from(word).map((char, index) =>
          isHangulSyllable(char) ? (
            <ColoredSyllable key={`${char}-${index}`} char={char} />
          ) : (
            <span key={`${char}-${index}`} className="text-ink-900">
              {char}
            </span>
          )
        )}
      </span>
    </span>
  );
}
