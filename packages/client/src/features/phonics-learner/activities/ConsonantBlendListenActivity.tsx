import { useCallback, useMemo, useState } from 'react';
import { composeHangul } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';

interface Props {
  unitId: string;
  consonant: string; // 'ㄱ'
  blendVowels: ReadonlyArray<string>; // ['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ']
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 자음+모음 음절 구성 액티비티 (unit 2 활동 2, 3).
 *
 * 행마다 3개 셀: [자음] [모음] [음절]. 클릭마다 해당 소리 발음.
 * 모든 셀 모두 한 번 이상 클릭 → 칭찬 + onComplete.
 */
export function ConsonantBlendListenActivity({
  unitId,
  consonant,
  blendVowels,
  onComplete,
  onBack,
}: Props) {
  const rows = useMemo(
    () =>
      blendVowels.map((v) => ({
        consonant,
        vowel: v,
        syllable: composeHangul(consonant, v, null) || `${consonant}${v}`,
      })),
    [blendVowels, consonant]
  );

  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  // 클릭 기록 — `${row}-${col}` 으로 키
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);

  const totalCells = rows.length * 3;

  // 다음에 눌러야 할 셀 (row-major, 첫 미클릭) — 하이라이트 안내용. 모두 누르면 null.
  const nextKey = useMemo(() => {
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < 3; c++) {
        const key = `${r}-${c}`;
        if (!pressed.has(key)) return key;
      }
    }
    return null;
  }, [rows.length, pressed]);

  const handleCell = useCallback(
    async (r: number, c: number, text: string) => {
      if (completed) return;
      const key = `${r}-${c}`;
      const url = await resolveTtsUrl({
        text,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-blend',
      });

      // 이 클릭으로 (a) 행 3 셀 모두 채워지면 → 띵동, (b) 18 셀 모두 채워지면 → 띵동 → 칭찬.
      let willCompleteAll = false;
      let willCompleteRow = false;
      setPressed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        if (next.size >= totalCells) willCompleteAll = true;
        // 이 행의 3셀 모두 next 에 포함되면 row complete
        if (
          next.has(`${r}-0`) &&
          next.has(`${r}-1`) &&
          next.has(`${r}-2`) &&
          // 이전엔 미완료 상태였어야 (방금 클릭한 셀로 완성됐어야)
          !(prev.has(`${r}-0`) && prev.has(`${r}-1`) && prev.has(`${r}-2`))
        ) {
          willCompleteRow = true;
        }
        return next;
      });

      if (willCompleteAll) setCompleted(true);

      // TTS ended chain:
      // - 전체 완료: TTS → 띵동 → 칭찬
      // - 행 완료: TTS → 띵동
      // - 그 외: TTS 만
      const afterTts = () => {
        if (willCompleteAll) {
          playAudio('/sounds/game/correct.mp3', () =>
            playCorrectSequence({ language: 'ko', onDone: onComplete })
          );
        } else if (willCompleteRow) {
          playAudio('/sounds/game/correct.mp3');
        }
      };

      if (url) {
        playAudio(url, afterTts);
      } else {
        afterTts();
      }
    },
    [completed, totalCells, unitId, playAudio, playCorrectSequence, onComplete]
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <button
        onClick={onBack}
        className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
      >
        ← 돌아가기
      </button>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-ink-900 text-center">
          <span className="text-coral-600">{consonant}</span> 을 모음과 만나게 해봐!
        </h2>

        <div className="flex flex-col gap-2 sm:gap-2.5 w-full max-w-xl">
          {rows.map((row, r) => (
            <div key={r} className="flex items-center justify-center gap-2 sm:gap-3">
              <Cell
                label={row.consonant}
                pressed={pressed.has(`${r}-0`)}
                isNext={nextKey === `${r}-0`}
                onClick={() => handleCell(r, 0, row.consonant)}
                tone="consonant"
              />
              <span className="text-2xl font-black text-ink-500">+</span>
              <Cell
                label={row.vowel}
                pressed={pressed.has(`${r}-1`)}
                isNext={nextKey === `${r}-1`}
                onClick={() => handleCell(r, 1, row.vowel)}
                tone="vowel"
              />
              <span className="text-2xl font-black text-ink-500">→</span>
              <Cell
                label={row.syllable}
                pressed={pressed.has(`${r}-2`)}
                isNext={nextKey === `${r}-2`}
                onClick={() => handleCell(r, 2, row.syllable)}
                tone="syllable"
              />
            </div>
          ))}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}

function Cell({
  label,
  pressed,
  isNext,
  onClick,
  tone,
}: {
  label: string;
  pressed: boolean;
  isNext: boolean;
  onClick: () => void;
  tone: 'consonant' | 'vowel' | 'syllable';
}) {
  const bg =
    tone === 'syllable'
      ? 'bg-coral-100 border-coral-400'
      : tone === 'consonant'
        ? 'bg-amber-100 border-amber-400'
        : 'bg-mint-100 border-mint-400';
  return (
    <button
      onClick={onClick}
      className={[
        'relative w-[clamp(2.5rem,8vw,4rem)] h-[clamp(2.5rem,8vw,4rem)] sm:w-[clamp(3rem,9vw,5rem)] sm:h-[clamp(3rem,9vw,5rem)] rounded-2xl border-[3px] flex items-center justify-center shadow-soft active:scale-[0.95] transition-all font-black text-coral-700',
        bg,
        pressed
          ? 'ring-2 ring-success/40'
          : isNext
            ? 'ring-4 ring-coral-500 scale-110 shadow-pop animate-pulse'
            : '',
      ].join(' ')}
    >
      <span className="text-2xl sm:text-3xl">{label}</span>
      {pressed && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-success text-white text-[10px] font-black">
          ✓
        </span>
      )}
      {isNext && !pressed && (
        <span
          aria-hidden
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-xl text-coral-600 animate-bounce"
        >
          👆
        </span>
      )}
    </button>
  );
}
