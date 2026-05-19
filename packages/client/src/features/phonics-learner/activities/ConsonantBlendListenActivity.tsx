import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const playText = useCallback(
    async (text: string) => {
      const url = await resolveTtsUrl({
        text,
        language: 'korean',
        storybookId: unitId,
        identifierPrefix: 'consonant-blend',
      });
      if (url) playAudio(url);
    },
    [unitId, playAudio]
  );

  const totalCells = rows.length * 3;

  const handleCell = useCallback(
    (r: number, c: number, text: string) => {
      const key = `${r}-${c}`;
      playText(text);
      setPressed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    [playText]
  );

  // 완료 감지
  useEffect(() => {
    if (completed) return;
    if (pressed.size >= totalCells) {
      setCompleted(true);
      setTimeout(() => playCorrectSequence({ language: 'ko', onDone: onComplete }), 600);
    }
  }, [pressed.size, totalCells, completed, playCorrectSequence, onComplete]);

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
                onClick={() => handleCell(r, 0, row.consonant)}
                tone="consonant"
              />
              <span className="text-2xl font-black text-ink-500">+</span>
              <Cell
                label={row.vowel}
                pressed={pressed.has(`${r}-1`)}
                onClick={() => handleCell(r, 1, row.vowel)}
                tone="vowel"
              />
              <span className="text-2xl font-black text-ink-500">→</span>
              <Cell
                label={row.syllable}
                pressed={pressed.has(`${r}-2`)}
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
  onClick,
  tone,
}: {
  label: string;
  pressed: boolean;
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
        'relative w-[clamp(2.5rem,8vw,4rem)] h-[clamp(2.5rem,8vw,4rem)] sm:w-[clamp(3rem,9vw,5rem)] sm:h-[clamp(3rem,9vw,5rem)] rounded-2xl border-[3px] flex items-center justify-center shadow-soft active:scale-[0.95] transition font-black text-coral-700',
        bg,
        pressed ? 'ring-2 ring-success/40' : '',
      ].join(' ')}
    >
      <span className="text-2xl sm:text-3xl">{label}</span>
      {pressed && (
        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-success text-white text-[10px] font-black">
          ✓
        </span>
      )}
    </button>
  );
}
