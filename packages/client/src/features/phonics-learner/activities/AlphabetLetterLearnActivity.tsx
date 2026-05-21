import { useCallback, useRef, type MouseEvent } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import type { Storybook } from '@tangobook/shared';
import { getWordHotspots } from '@tangobook/shared';

interface Props {
  unitId: string;
  /** storybook.phonicsLesson.blending[letterIndex] / wordFamilies[letterIndex] 인덱스 (A=0, B=1, …). */
  letterIndex: number;
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 영어 알파벳 글자 학습 (Book 1).
 *
 * 한 글자 (예: A) 의 학습카드 풀화면 노출.
 *   - 큰 일러스트 + 저작도구에서 만든 hotspots
 *   - hotspot 클릭 → 그 단어의 ttsUrl 재생 (multi-hotspot 지원)
 *   - 상단 대/소문자 뱃지 클릭 → 글자 발음 재생
 *   - ← 돌아가기 = 종료
 *
 * 진척 마킹 없음. 그냥 누르기만 하는 자유 탐색 (영어 모르는 4-5세 입문자용).
 * onMarkComplete prop 은 호환을 위해 받지만 호출하지 않음.
 */

export function AlphabetLetterLearnActivity({
  unitId,
  letterIndex,
  onMarkComplete: _onMarkComplete,
  onBack,
}: Props) {
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio } = useGameAudio();

  const blending = sb?.phonicsLesson?.blending?.[letterIndex];
  const wordFamily = sb?.phonicsLesson?.wordFamilies?.[letterIndex];

  const illustrationUrl = blending?.illustrationUrl ?? blending?.exampleWordImageUrl;
  const upper = (blending?.vowel ?? '').toUpperCase();
  const lower = (blending?.consonant ?? blending?.vowel ?? '').toLowerCase();
  const blend = blending?.blend ?? `${upper}${lower}`;
  const words = wordFamily?.words ?? [];

  // 동시 재생 차단용 — 진척 추적 X
  const audioBusyRef = useRef(false);

  // 핫스팟 클릭 → 해당 단어 ttsUrl
  const handleIllustrationClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (audioBusyRef.current) return;
      if (!words.some((w) => getWordHotspots(w).length > 0)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      for (const w of words) {
        for (const h of getWordHotspots(w)) {
          if (nx >= h.x && nx <= h.x + h.w && ny >= h.y && ny <= h.y + h.h) {
            if (w.ttsUrl) {
              audioBusyRef.current = true;
              playAudio(w.ttsUrl, () => {
                audioBusyRef.current = false;
              });
            }
            return;
          }
        }
      }
    },
    [words, playAudio]
  );

  const handleLetterClick = useCallback(() => {
    const url = blending?.blendingSequenceTtsUrl;
    if (!url || audioBusyRef.current) return;
    audioBusyRef.current = true;
    playAudio(url, () => {
      audioBusyRef.current = false;
    });
  }, [blending?.blendingSequenceTtsUrl, playAudio]);

  // 진입 시 자동 재생 X — 학습자가 직접 핫스팟을 눌러야 소리 남 (4-5세 자율 탐색).
  // ← 돌아가기 = 그냥 종료. 진척 마킹 없음 (자유 탐색).

  if (storybookQuery.isLoading || !sb) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
        <button
          onClick={onBack}
          className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
        >
          ← 돌아가기
        </button>
        <div className="flex-1 flex items-center justify-center text-ink-500 font-bold">
          불러오는 중…
        </div>
      </div>
    );
  }

  if (!blending) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
        <button
          onClick={onBack}
          className="self-start mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
        >
          ← 돌아가기
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="text-6xl">🔤</div>
          <p className="text-xl font-black text-ink-700">학습카드 데이터가 없어요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-3 bg-gradient-to-b from-cream-50 to-peach-100 overflow-y-auto">
      {/* 헤더 — 뒤로 + 글자 뱃지 + 글자 음원 */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold"
        >
          ← 돌아가기
        </button>
        <button
          onClick={handleLetterClick}
          disabled={!blending.blendingSequenceTtsUrl}
          className="inline-flex items-baseline gap-1 px-6 py-2 rounded-full bg-white shadow-pop hover:shadow-card disabled:opacity-50 transition-shadow"
          title="글자 발음 듣기"
        >
          <span className="text-4xl sm:text-5xl font-black text-coral-500 leading-none">
            {upper}
          </span>
          <span className="text-4xl sm:text-5xl font-black text-sky-500 leading-none">{lower}</span>
          {blending.blendingSequenceTtsUrl && <span className="ml-2 text-xl">🔊</span>}
        </button>
        <div className="w-[88px]" /> {/* spacer for visual centering */}
      </div>

      {/* 가운데 큰 이미지 + 핫스팟 */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start gap-4">
        <div className="w-full max-w-[920px] mx-auto">
          <div
            className="relative w-full rounded-[28px] overflow-hidden shadow-card bg-white cursor-pointer ring-4 ring-white"
            style={{ aspectRatio: '16/9' }}
            onClick={handleIllustrationClick}
          >
            {illustrationUrl ? (
              <img
                src={illustrationUrl}
                alt={blend}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-peach-100">
                <div className="text-7xl">🖼️</div>
                <div className="text-base font-black text-ink-500">학습카드 그림이 아직 없어요</div>
              </div>
            )}
            {/* 핫스팟 위 스피커 아이콘 — 모든 hotspot */}
            {illustrationUrl && words.some((w) => getWordHotspots(w).length > 0) && (
              <div className="absolute inset-0 pointer-events-none">
                {words.flatMap((w, i) =>
                  getWordHotspots(w).map((h, hIdx) => (
                    <div
                      key={`spk-${i}-${hIdx}`}
                      className="absolute pointer-events-none flex items-center justify-center"
                      style={{
                        left: `${(h.x + h.w / 2) * 100}%`,
                        top: `${(h.y + h.h / 2) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-soft flex items-center justify-center ring-1 ring-white/80 bg-coral-400/85 animate-pulse">
                        <svg
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white drop-shadow"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 단어 칩·완료 버튼 노출 X — 영어 단어 모르는 입문자(4-5세) 용. 핫스팟 클릭으로만 학습.
            ← 돌아가기 시 자동으로 onMarkComplete 트리거 (handleBack). */}
      </div>
    </div>
  );
}
