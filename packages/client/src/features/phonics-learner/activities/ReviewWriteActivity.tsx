import { useCallback, useEffect, useRef, useState } from 'react';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  sources: ReadonlyArray<ReviewCardSource>;
  language?: 'korean' | 'english';
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 복습 — 그림을 보고 **낱말 전체** 쓰기.
 *
 * 카드 하나당 [그림] + [낱말 쓰기 캔버스]. 한 글자씩 순서대로 칠하고, 낱말을 다 쓰면
 * 그 낱말 소리 → 띵동 → 다음 그림. 마지막까지 쓰면 칭찬 + onComplete.
 *
 * 🔴 **음소 한 글자(ㄱ)가 아니라 낱말(고기)** 을 쓴다(2026-07-27). 그림은 `고기` 인데 쓰는 건 `ㄱ`
 *    하나라 그림과 손이 따로 놀았다. 낱말쓰기와 같은 `WordFillCanvas` 를 쓰므로 **한 번에 한 글자만**
 *    밝고, 끝낸 글자는 칠한 색이 남는다.
 */

export function ReviewWriteActivity({
  unitId,
  sources,
  language = 'korean',
  onComplete,
  onBack,
}: Props) {
  // 🔴 소리 순서는 훅이 소유한다 — 예전엔 여기서 손으로 이어 붙여 **쉼이 통째로 빠져** 있었다.
  const {
    say: speak,
    chime,
    rest,
    sayThenChime,
    praiseVisible,
    playAudio,
  } = useActivitySound({
    unitId,
    language,
    prefix: 'review-write',
  });
  // 진입 안내 — 이 화면은 그림 없는 카드(영어)면 소리가 곧 문제라, 안내가 끝난 뒤에 문제를 낸다.
  const guiding = useEntryGuide(ENTRY_GUIDE.write, playAudio);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  usePhonicsTtsWarm(
    unitId,
    sources.map((s) => s.word),
    'review-write',
    language
  );

  const current = sources[idx];
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  const say = useCallback((card: ReviewCardSource) => void speak(card.word), [speak]);

  /**
   * 그림이 없는 복습(영어)은 소리가 곧 문제다 — 카드가 바뀌면 자동으로 **한 번** 들려준다.
   *
   * 🔴 deps 에 `current`(부모가 렌더마다 새로 만드는 배열에서 파생)와 `say`(함수 신원)를 걸면
   *    부모가 리렌더될 때마다 다시 울린다. 실측: 진입 직후 같은 소리가 **다섯 번** 겹쳤다
   *    (StrictMode 의 이중 실행 2회로는 설명되지 않는 수). 채널이 하나라 아이 귀엔 한 조각만 남는다.
   *    같은 사고를 `WordListenChooseActivity` 에서도 냈다 — **카드가 실제로 바뀐 때만** 울려야 한다.
   */
  const sayRef = useRef(say);
  sayRef.current = say;
  const wordKey = current && !current.imageUrl ? current.word : '';
  useEffect(() => {
    // 🔴 안내가 끝난 뒤에 문제를 낸다 — 예전엔 진입 104ms 에 **정답 글자부터** 읽고 안내는 없었다.
    if (done || guiding || !wordKey) return;
    const card = sourcesRef.current[idx];
    if (card) sayRef.current(card);
  }, [idx, wordKey, done, guiding]);

  /**
   * 한 글자를 다 쓰면 — 띵동 → **거기까지 이어읽기**(고 → 고기).
   *
   * 🔴 예전엔 이 콜백을 아예 안 넘겨서 **글자를 다 써도 아무 소리가 안 났다**. 낱말쓰기 게임
   *    (`KoreanWordWritingPlayer`)에는 있는 배선인데 이 활동만 빠져 있었다 — 같은 `WordFillCanvas`
   *    를 쓰면서 콜백 하나를 안 넘긴 것이라 화면만 봐선 안 보이고 **소리로만 드러나는** 종류의 구멍이다.
   * 🔴 낱말을 **완성하는** 마지막 글자는 여기서 내지 않는다 — 바로 뒤 `handleWordDone` 이
   *    [낱말 → 띵동 → 다음] 을 소유하므로, 여기서도 내면 한 채널에서 앞소리가 잘린다.
   */
  const handleSyllableDone = useCallback(
    (syllable: string, index: number) => {
      if (!current || index + 1 >= current.word.length) return;
      void (async () => {
        const blend = current.word.slice(0, index + 1);
        const url =
          (await resolveTtsUrl({
            text: blend,
            language,
            storybookId: unitId,
            identifierPrefix: 'review-write',
          })) ??
          (await resolveTtsUrl({
            text: syllable,
            language,
            storybookId: unitId,
            identifierPrefix: 'review-write',
          }));
        // 🔴 띵동 **먼저**, 쉬고, 읽기 — 한 채널이라 붙여 내면 앞소리가 잘리고 한 덩어리로 들린다.
        chime(() => rest(() => void speak(blend, undefined, url)));
      })();
    },
    [current, language, unitId, chime, rest, speak]
  );

  /** 낱말을 다 쓰면 — 그 낱말을 읽어주고 띵동, 다음 그림으로. */
  const handleWordDone = useCallback(() => {
    if (done || !current) return;
    const isLast = idx + 1 >= sources.length;
    if (isLast) setDone(true);
    // [낱말 → 쉼 → 띵동 → 쉼 → 다음] · 마지막이면 띵동 대신 칭찬.
    void sayThenChime(current.word, {
      praise: isLast,
      onDone: isLast ? onComplete : () => setIdx((i) => i + 1),
    });
  }, [done, current, idx, sources.length, sayThenChime, onComplete]);

  if (!current) return null;

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        {/* 진행 dots — 몇 장 남았는지 그림으로 */}
        <div className="flex gap-2 sm:gap-3">
          {sources.map((s, i) => (
            // 🔴 key 는 unitId 만으로 부족하다 — 영어는 한 단원이 글자를 3~4개 내서 같은 unitId 가 반복된다.
            <span
              key={`${s.unitId}-${s.letter}`}
              className={[
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm sm:text-base shadow-soft transition',
                i < idx
                  ? 'bg-mint-500 text-white'
                  : i === idx
                    ? 'bg-coral-500 text-white ring-4 ring-coral-200 animate-pulse'
                    : 'bg-white text-ink-400',
              ].join(' ')}
            >
              {i < idx ? '✓' : i + 1}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {/* 문제 — 그림이 있으면 그림, 없으면 소리.
              🔴 영어 단원은 아직 단어 그림이 0장이라 소리로 낸다. 자산 때문에 택한 형태지만
                 "소리를 듣고 글자를 쓴다"는 파닉스로는 오히려 정공법이라 그대로 둔다. */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-3xl bg-white border-[6px] border-white shadow-pop overflow-hidden shrink-0">
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.word}
                className="w-full h-full object-cover"
              />
            ) : (
              <button
                onClick={() => say(current)}
                aria-label="다시 듣기"
                className="w-full h-full flex items-center justify-center bg-coral-500 text-white text-6xl sm:text-7xl active:scale-[0.97] transition"
              >
                🔊
              </button>
            )}
          </div>

          <div className="w-full max-w-2xl">
            <WordFillCanvas
              key={`review-write-${idx}`}
              word={current.word}
              syllables={[...current.word]}
              onSyllableDone={handleSyllableDone}
              onComplete={handleWordDone}
            />
          </div>
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
