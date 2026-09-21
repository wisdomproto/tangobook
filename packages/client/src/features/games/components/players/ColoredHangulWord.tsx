import { decomposeHangul, isHangulSyllable, isVerticalVowel } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

interface ColoredHangulWordProps {
  word: string;
  className?: string;
}

function Jamo({
  kind,
  size,
  children,
}: {
  kind: 'consonant' | 'vowel';
  size: string;
  children: string;
}) {
  return (
    <span
      data-jamo-kind={kind}
      className="flex items-center justify-center font-display font-black leading-none"
      style={{ color: kind === 'vowel' ? TANGO_JUNG_COLOR : TANGO_CHO_COLOR, fontSize: size }}
    >
      {children}
    </span>
  );
}

function ColoredSyllable({ char }: { char: string }) {
  const syllable = decomposeHangul(char);
  const vowelBelow = isVerticalVowel(syllable.jung);
  const hasCoda = !!syllable.jong;
  const jamoSize = vowelBelow ? (hasCoda ? '0.36em' : '0.5em') : hasCoda ? '0.52em' : '0.72em';

  return (
    <span
      data-hangul-syllable={char}
      className={cn(
        'inline-grid h-[0.96em] shrink-0 place-items-center align-middle tracking-normal',
        vowelBelow ? 'w-[0.92em] grid-cols-1' : 'w-[1.2em] grid-cols-2'
      )}
      style={{
        gridTemplateRows: vowelBelow
          ? hasCoda
            ? 'repeat(3, minmax(0, 1fr))'
            : 'repeat(2, minmax(0, 1fr))'
          : hasCoda
            ? 'minmax(0, 2fr) minmax(0, 1fr)'
            : 'minmax(0, 1fr)',
      }}
    >
      <Jamo kind="consonant" size={jamoSize}>
        {syllable.cho}
      </Jamo>
      <Jamo kind="vowel" size={jamoSize}>
        {syllable.jung}
      </Jamo>
      {syllable.jong && (
        <span className={vowelBelow ? undefined : 'col-span-2'}>
          <Jamo kind="consonant" size={jamoSize}>
            {syllable.jong}
          </Jamo>
        </span>
      )}
    </span>
  );
}

/**
 * 완성형 한글 글리프를 자모 블록처럼 다시 조립해 보여 준다.
 * 초성·받침은 주황, 모음은 녹색이며 음절 자체는 스크린리더에 한 단어로 전달한다.
 */
export function ColoredHangulWord({ word, className }: ColoredHangulWordProps) {
  return (
    <span className={cn('inline-flex items-center gap-[0.08em] tracking-normal', className)}>
      <span className="sr-only">{word}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-[0.08em]">
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
