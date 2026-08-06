import { useCallback, useEffect, useRef, useState } from 'react';
import { WordFillCanvas } from '@/features/phonics/components/WordFillCanvas';
import { resolveTtsUrl } from '@/features/tts';
import { useActivitySound } from '../hooks/useActivitySound';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import type { ReviewCardSource } from '../hooks/useReviewCardSources';
import { ActivityShell } from '../components/ActivityShell';

/**
 * 쓰기 칸에 넣을 낱말은 `word`, 소리는 `soundWord`/`soundUrl` 로 **분리**할 수 있다.
 * 🔴 영어 Book 1 은 **글자(C)를 쓰지만 소리는 낱말("c c cat")** 이라 둘이 다르다. 없으면 word 를 읽는다.
 */
type WriteSource = ReviewCardSource & {
  soundWord?: string;
  soundUrl?: string;
  /**
   * 🔴 다 쓴 뒤 보여줄 **낱말 전체**(영어 Book 1: 글자 `a` 를 쓰지만 완성하면 `apple` 을 보여준다 —
   *    "한 글자 쓰면 나머지 단어가 다 나와야" 한다는 사용자 요청). 없으면 쓴 글자(`word`)를 그대로 보여준다.
   */
  revealWord?: string;
  /** 🔴 쓰는 순서(패턴 먼저) — 익히기·게임과 통일. 없으면 좌→우(한글 등). */
  order?: number[];
};

interface Props {
  unitId: string;
  sources: ReadonlyArray<WriteSource>;
  language?: 'korean' | 'english';
  /**
   * 🔴 그림을 **다 쓴 뒤에 보여준다**(2026-08-02 사용자: "그림한번 보여줘야지 정답 맞추면").
   *    켜면 쓰는 동안엔 ❓ 이고, 낱말을 완성하면 그림이 열린다. 이때 **문제 소리를 자동재생하지 않는다**
   *    ("아직 쓰지도 않았는데 c c cat 이지랄" — 글자는 캔버스가 보여주므로 소리 프롬프트가 필요 없다).
   *    끄면(한글 등) 예전대로 그림을 상시 노출하고 소리가 문제다.
   */
  revealImageOnComplete?: boolean;
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
  revealImageOnComplete = false,
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
  } = useActivitySound({
    unitId,
    language,
    prefix: 'review-write',
  });
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  /** 다 쓴 카드들 — 캔버스를 잠그고(다시 못 씀) reveal 모드면 그림을 연다. */
  const [writtenIdx, setWrittenIdx] = useState<ReadonlySet<number>>(() => new Set());

  usePhonicsTtsWarm(
    unitId,
    sources.map((s) => s.word),
    'review-write',
    language
  );

  const current = sources[idx];
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  // 지금까지 쓴 칸(인덱스) — 시각 순서로 이어읽기용. 카드 바뀌면 리셋(handleWordDone).
  const writtenRef = useRef<number[]>([]);

  // 🔴 쓰는 글자(`word`)와 읽는 소리가 다를 수 있다 — Book 1 은 C 를 쓰고 "c c cat" 을 듣는다.
  const say = useCallback(
    (card: WriteSource) => void speak(card.soundWord ?? card.word, undefined, card.soundUrl),
    [speak]
  );

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
  // 🔴 reveal 모드는 문제 소리를 자동재생하지 않는다 — 캔버스 글자가 곧 문제다(사용자: 쓰기 전 "c c cat" 금지).
  const wordKey = current && !current.imageUrl && !revealImageOnComplete ? current.word : '';
  useEffect(() => {
    // 그림 없는 카드(한글 등)는 소리가 곧 문제라 카드가 바뀌면 한 번 들려준다.
    if (done || !wordKey) return;
    const card = sourcesRef.current[idx];
    if (card) sayRef.current(card);
  }, [idx, wordKey, done]);

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
      if (!current) return;
      // 🔴 지금까지 쓴 칸을 **시각 순서로** 이어읽는다 — 좌→우면 고→고기, 패턴 먼저면 a→ak→ake.
      //    낱말을 완성하는 마지막 칸은 WordFillCanvas 가 생략(handleWordDone 이 낱말을 읽음).
      if (!writtenRef.current.includes(index)) writtenRef.current.push(index);
      const blend = [...writtenRef.current]
        .sort((a, b) => a - b)
        .map((i) => current.word[i])
        .join('');
      void (async () => {
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
    // 🔴 다 쓰는 **즉시 이 카드를 잠근다** — 캔버스를 완성 글자로 바꿔 소리 나는 동안 **다시 못 쓰게**
    //    한다(사용자: "멘트 읽어주는 동안 그 글자 다시 쓰게 돼있어. 그냥 정답처리 해야지"). reveal 모드면 그림도 연다.
    setWrittenIdx((prev) => new Set(prev).add(idx));
    // [낱말 → 쉼 → 띵동 → 쉼 → 다음] · 마지막이면 띵동 대신 칭찬.
    // 🔴 완성 소리도 "c c cat"(soundWord/soundUrl) — 쓴 글자(C)가 아니라 낱말을 들려준다.
    void sayThenChime(current.soundWord ?? current.word, {
      praise: isLast,
      onDone: isLast
        ? onComplete
        : () => {
            writtenRef.current = []; // 다음 카드는 처음부터 이어읽기
            setIdx((i) => i + 1);
          },
      ...(current.soundUrl ? { directUrl: current.soundUrl } : {}),
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
          {/* 문제 칸 — ①reveal 모드: 다 쓰기 전엔 ❓, 완성하면 그림(정답 그림 보상).
              ②그림 상시(한글): 그림. ③그림 없음(영어 Book2~5): 🔊 소리가 문제. */}
          <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-3xl bg-white border-[6px] border-white shadow-pop overflow-hidden shrink-0">
            {current.imageUrl && (!revealImageOnComplete || writtenIdx.has(idx)) ? (
              <img
                src={current.imageUrl}
                alt={current.word}
                className="w-full h-full object-cover"
              />
            ) : revealImageOnComplete ? (
              // 🔴 쓰는 동안엔 ❓ — 소리 프롬프트 없이 캔버스 글자를 보고 쓴다. 다 쓰면 그림이 열린다.
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-100 to-cream-50 text-6xl sm:text-7xl">
                ❓
              </div>
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
            {writtenIdx.has(idx) ? (
              // 🔴 다 썼으면 캔버스를 **완성 글자(민트)로 잠근다** — 소리 나는 동안 다시 못 쓴다(정답처리).
              <div className="flex items-center justify-center gap-2 rounded-[28px] border-[6px] border-mint-400 bg-mint-100 py-8 sm:py-10 shadow-pop">
                {/* 🔴 다 쓰면 낱말 전체를 보여준다 — 쓴 글자는 코랄, 나머지는 민트(Book 1: `a` 쓰면 `apple`). */}
                <span className="font-display font-black leading-none text-[clamp(4rem,18vh,10rem)]">
                  {current.revealWord && current.revealWord !== current.word ? (
                    <>
                      <span className="text-coral-500">
                        {current.revealWord.slice(0, current.word.length)}
                      </span>
                      <span className="text-mint-600">
                        {current.revealWord.slice(current.word.length)}
                      </span>
                    </>
                  ) : (
                    <span className="text-mint-600">{current.word}</span>
                  )}
                </span>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-mint-500 text-white text-2xl font-black shadow-pop ring-4 ring-white">
                  ✓
                </span>
              </div>
            ) : (
              <WordFillCanvas
                key={`review-write-${idx}`}
                word={current.word}
                syllables={[...current.word]}
                order={current.order}
                onSyllableDone={handleSyllableDone}
                onComplete={handleWordDone}
              />
            )}
          </div>
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
