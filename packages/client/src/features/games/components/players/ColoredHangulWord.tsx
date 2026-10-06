import { decomposeHangul, isHangulSyllable, isVerticalVowel } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { TANGO_CHO_COLOR, TANGO_JUNG_COLOR } from './TangoBoard';

interface ColoredHangulWordProps {
  word: string;
  className?: string;
}

type SyllableLayout = 'side' | 'side-coda' | 'below' | 'below-coda' | 'mixed' | 'mixed-coda';

const MIXED_VOWELS = new Set(['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']);
const WIDE_SIDE_ONSETS = new Set(['ㅎ']);

function getSyllableLayout(vowel: string, hasCoda: boolean): SyllableLayout {
  if (MIXED_VOWELS.has(vowel)) return hasCoda ? 'mixed-coda' : 'mixed';
  if (isVerticalVowel(vowel)) return hasCoda ? 'below-coda' : 'below';
  return hasCoda ? 'side-coda' : 'side';
}

function Jamo({
  kind,
  role,
  className,
  children,
}: {
  kind: 'consonant' | 'vowel';
  role: 'onset' | 'medial' | 'coda';
  className: string;
  children: string;
}) {
  return (
    <span
      data-jamo-kind={kind}
      data-jamo-role={role}
      className={cn(
        'absolute flex items-center justify-center font-display font-black leading-none',
        className
      )}
      style={{
        color: kind === 'vowel' ? TANGO_JUNG_COLOR : TANGO_CHO_COLOR,
        WebkitTextStroke: '0.025em white',
        paintOrder: 'stroke fill',
        filter: 'drop-shadow(0 0.05em 0 rgba(0, 0, 0, 0.09))',
      }}
    >
      {children}
    </span>
  );
}

function SideSyllable({ cho, jung, jong }: { cho: string; jung: string; jong: string | null }) {
  const hasCoda = !!jong;

  return (
    <>
      <Jamo
        kind="consonant"
        role="onset"
        className={cn(
          'left-0 w-[0.5em]',
          hasCoda
            ? 'top-[0.02em] h-[0.66em] text-[0.62em]'
            : 'top-[0.16em] h-[0.84em] text-[0.74em]'
        )}
      >
        {cho}
      </Jamo>
      <Jamo
        kind="vowel"
        role="medial"
        className={cn(
          'w-[0.52em]',
          WIDE_SIDE_ONSETS.has(cho) ? 'left-[0.55em]' : 'left-[0.48em]',
          hasCoda
            ? 'top-[0.02em] h-[0.66em] text-[0.62em]'
            : 'top-[0.16em] h-[0.84em] text-[0.74em]'
        )}
      >
        {jung}
      </Jamo>
      {jong && (
        <Jamo
          kind="consonant"
          role="coda"
          className="left-[0.14em] top-[0.74em] h-[0.38em] w-[0.7em] text-[0.44em]"
        >
          {jong}
        </Jamo>
      )}
    </>
  );
}

function BelowSyllable({ cho, jung, jong }: { cho: string; jung: string; jong: string | null }) {
  const hasCoda = !!jong;

  return (
    <>
      <Jamo
        kind="consonant"
        role="onset"
        className={cn(
          'left-[0.08em] w-[0.7em]',
          hasCoda ? 'top-0 h-[0.48em] text-[0.5em]' : 'top-[0.13em] h-[0.5em] text-[0.6em]'
        )}
      >
        {cho}
      </Jamo>
      <Jamo
        kind="vowel"
        role="medial"
        className={cn(
          'left-[0.04em] w-[0.78em]',
          hasCoda ? 'top-[0.5em] h-[0.34em] text-[0.36em]' : 'top-[0.64em] h-[0.53em] text-[0.58em]'
        )}
      >
        {jung}
      </Jamo>
      {jong && (
        <Jamo
          kind="consonant"
          role="coda"
          className="left-[0.14em] top-[0.86em] h-[0.4em] w-[0.7em] text-[0.44em]"
        >
          {jong}
        </Jamo>
      )}
    </>
  );
}

function MixedSyllable({ cho, jung, jong }: { cho: string; jung: string; jong: string | null }) {
  const hasCoda = !!jong;

  return (
    <>
      <Jamo
        kind="consonant"
        role="onset"
        className={cn(
          'left-[-0.01em] w-[0.51em]',
          hasCoda ? 'top-0 h-[0.5em] text-[0.5em]' : 'top-[0.08em] h-[0.61em] text-[0.6em]'
        )}
      >
        {cho}
      </Jamo>
      <Jamo
        kind="vowel"
        role="medial"
        className={cn(
          'left-[0.3em] w-[0.66em]',
          hasCoda ? 'top-[0.27em] h-[0.46em] text-[0.47em]' : 'top-[0.38em] h-[0.62em] text-[0.6em]'
        )}
      >
        {jung}
      </Jamo>
      {jong && (
        <Jamo
          kind="consonant"
          role="coda"
          className="left-[0.14em] top-[0.75em] h-[0.38em] w-[0.7em] text-[0.42em]"
        >
          {jong}
        </Jamo>
      )}
    </>
  );
}

function ColoredSyllable({ char }: { char: string }) {
  const syllable = decomposeHangul(char);
  const layout = getSyllableLayout(syllable.jung, !!syllable.jong);

  return (
    <span
      data-hangul-syllable={char}
      data-syllable-layout={layout}
      className="relative inline-block h-[1.18em] w-[1.02em] shrink-0 align-middle leading-none"
    >
      {layout.startsWith('side') ? (
        <SideSyllable {...syllable} />
      ) : layout.startsWith('below') ? (
        <BelowSyllable {...syllable} />
      ) : (
        <MixedSyllable {...syllable} />
      )}
    </span>
  );
}

/**
 * 초성·중성·받침을 한 음절 안에서 촘촘히 조립해 블록 색과 자연스러운 글자 비율을 함께 유지한다.
 * 스크린리더에는 시각용 자모 대신 완성된 단어 하나만 전달한다.
 */
export function ColoredHangulWord({ word, className }: ColoredHangulWordProps) {
  return (
    <span className={cn('inline-flex items-center tracking-normal', className)}>
      <span className="sr-only">{word}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-[0.035em]">
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
