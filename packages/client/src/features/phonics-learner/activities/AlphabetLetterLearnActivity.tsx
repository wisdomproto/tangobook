import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import type { Storybook } from '@tangobook/shared';
import { getWordHotspots } from '@tangobook/shared';
import { playUi } from '@/lib/uiSound';
import { LetterWriteModal } from './LetterWriteModal';

interface Props {
  unitId: string;
  /** unit 의 학습 대상 글자 목록 (예: ['A','B','C'] / ['S','T','U','V']). 상단 탭으로 전환. */
  letters: readonly string[];
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 영어 알파벳 글자 학습 (Book 1).
 *
 * 한 unit 의 모든 글자 (예: A·B·C) 를 한 페이지에서 상단 탭으로 전환:
 *   - 큰 일러스트 + 저작도구에서 만든 hotspots
 *   - hotspot 클릭 → 그 단어의 ttsUrl 재생 (multi-hotspot 지원)
 *   - 상단 글자 탭 (Aa / Bb / Cc) — 활성 글자 강조 (coral). 비활성 클릭 → 그 글자로 전환.
 *   - 활성 글자 탭 다시 클릭 → 글자 발음 (blendingSequenceTtsUrl) 재생
 *
 * 진척 마킹 없음. 그냥 누르며 듣는 자유 탐색 (영어 모르는 4-5세 입문자용).
 * onMarkComplete prop 은 호환을 위해 받지만 호출하지 않음.
 */

export function AlphabetLetterLearnActivity({
  unitId,
  letters,
  onMarkComplete: _onMarkComplete,
  onBack,
}: Props) {
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio } = useGameAudio();

  // 활성 글자 인덱스 (letters 배열의 인덱스). storybook.phonicsLesson.blending[i] 와 1:1 매칭.
  const [currentIdx, setCurrentIdx] = useState(0);
  // 써보기 모달 — 활성 글자에 대해서만 노출
  const [writeOpen, setWriteOpen] = useState(false);

  const blending = sb?.phonicsLesson?.blending?.[currentIdx];
  const wordFamily = sb?.phonicsLesson?.wordFamilies?.[currentIdx];

  const illustrationUrl = blending?.illustrationUrl ?? blending?.exampleWordImageUrl;
  const upper = (letters[currentIdx] ?? blending?.vowel ?? '').toUpperCase();
  const lower = upper.toLowerCase();
  const blend = blending?.blend ?? `${upper}${lower}`;
  const words = useMemo(() => wordFamily?.words ?? [], [wordFamily]);
  const activeHasTts = !!blending?.blendingSequenceTtsUrl;

  /**
   * 누를 곳을 **단어 순서대로** 편 목록. 그림에 핫스팟이 여러 개 흩어져 있으면 4~7세는
   * 어디를 눌러야 할지 모른 채 그림만 보다 나간다 → 한 번에 하나만 밝히고 나머지는 덮는다.
   */
  const spots = useMemo(
    () => words.flatMap((w) => getWordHotspots(w).map((h) => ({ h, w }))),
    [words]
  );
  const [tapped, setTapped] = useState(0);
  // 글자를 바꾸면 처음부터 — 핫스팟 목록 자체가 달라진다.
  useEffect(() => setTapped(0), [currentIdx]);
  const allDone = spots.length === 0 || tapped >= spots.length;
  const current = allDone ? null : spots[tapped];

  // 동시 재생 차단용 — 진척 추적 X
  const audioBusyRef = useRef(false);

  // 🔴 TTS 뒤에 무엇을 붙이든 **콜백으로** 잇는다 — setTimeout 으로 길이를 가정하면
  //    "애애애플" 이 끝나기 전에 띵동이 겹친다(이 프로젝트에서 네 번 반복된 버그).
  const say = useCallback(
    (url: string | undefined, onEnded?: () => void) => {
      if (!url || audioBusyRef.current) {
        onEnded?.();
        return;
      }
      audioBusyRef.current = true;
      playAudio(url, () => {
        audioBusyRef.current = false;
        onEnded?.();
      });
    },
    [playAudio]
  );

  /**
   * 그림 클릭.
   *  - 순서 단계: **밝은 칸만** 받는다(다른 데를 눌러도 아무 일 없음 — 틀렸다고 혼내지 않는다).
   *  - 다 누른 뒤: 덮개가 걷히고 아무 핫스팟이나 다시 눌러 들을 수 있다(자유 탐색으로 전환).
   */
  const handleIllustrationClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (audioBusyRef.current || spots.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const hit = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) =>
        nx >= x && nx <= x + w && ny >= y && ny <= y + h;

      if (!allDone) {
        if (!current || !hit(current.h)) return;
        playUi('tap');
        setTapped((t) => t + 1);
        // 단어를 다 읽은 **뒤에** 띵동 — 잘 눌렀다는 신호.
        say(current.w.ttsUrl, () => playAudio('/sounds/game/correct.mp3'));
        return;
      }
      const found = spots.find((s) => hit(s.h));
      if (!found) return;
      playUi('tap');
      say(found.w.ttsUrl, () => playAudio('/sounds/game/correct.mp3'));
    },
    [spots, allDone, current, say, playAudio]
  );

  // 글자 탭 클릭 — 활성이면 발음 재생, 비활성이면 그 글자로 전환 (모달 자동 닫기)
  const handleLetterTabClick = useCallback(
    (idx: number) => {
      if (idx !== currentIdx) {
        setCurrentIdx(idx);
        setWriteOpen(false);
        return;
      }
      // 활성 글자 = 발음 재생
      const url = sb?.phonicsLesson?.blending?.[idx]?.blendingSequenceTtsUrl;
      if (!url || audioBusyRef.current) return;
      audioBusyRef.current = true;
      playAudio(url, () => {
        audioBusyRef.current = false;
      });
    },
    [currentIdx, sb, playAudio]
  );

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
      {/* 헤더 — 뒤로 + 글자 탭들 (가운데) */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold shrink-0"
        >
          ← 돌아가기
        </button>
        {/* 글자 탭 — 활성 글자만 coral background + 큰 크기 (다시 클릭 = 발음). 비활성은 white. */}
        <div className="flex items-center gap-2 sm:gap-3">
          {letters.map((L, i) => {
            const U = L.toUpperCase();
            const l = L.toLowerCase();
            const active = i === currentIdx;
            const hasTts = !!sb.phonicsLesson?.blending?.[i]?.blendingSequenceTtsUrl;
            return (
              <button
                key={i}
                onClick={() => handleLetterTabClick(i)}
                className={`inline-flex items-baseline gap-0.5 sm:gap-1 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-pop transition-all ${
                  active
                    ? 'bg-coral-50 ring-4 ring-coral-300 scale-[1.06]'
                    : 'bg-white hover:bg-peach-50 opacity-70 hover:opacity-100'
                }`}
                title={active ? '글자 발음 듣기' : `${U}${l} 로 전환`}
              >
                <span
                  className={`font-display font-black leading-none ${
                    active ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-3xl'
                  } text-coral-500`}
                >
                  {U}
                </span>
                <span
                  className={`font-display font-black leading-none ${
                    active ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-3xl'
                  } text-sky-500`}
                >
                  {l}
                </span>
                {active && hasTts && <span className="ml-1 text-base sm:text-lg">🔊</span>}
              </button>
            );
          })}
        </div>
        <div className="w-[88px] shrink-0" /> {/* spacer for visual centering */}
      </div>

      {/* 🔴 안내 문구 — 이 화면은 자유 탐색이라 **무엇을 누르면 되는지 글로 말해주지 않으면**
          아이는 그림만 보다 나간다(다른 활동엔 다 있는데 여기만 빠져 있었다).
          누를 것이 실제로 있을 때만 그렇게 쓴다 — 핫스팟이 없는 글자엔 글자 탭을 가리킨다. */}
      <div className="shrink-0 text-center mb-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-ink-900 break-keep">
          {spots.length === 0 ? (
            <>
              🔊 위의{' '}
              <span className="text-coral-500">
                {upper}
                {lower}
              </span>{' '}
              를 눌러 소리를 들어봐!
            </>
          ) : !allDone ? (
            <>
              🔊 반짝이는 곳을 눌러봐!{' '}
              <span className="text-coral-500 tabular-nums">
                {tapped}/{spots.length}
              </span>
            </>
          ) : (
            <>🎉 다 찾았어! 눌러서 또 들어봐</>
          )}
        </h2>
        {spots.length > 0 && allDone && activeHasTts && (
          <p className="mt-1 text-sm sm:text-base font-bold text-ink-500 break-keep">
            위의{' '}
            <span className="text-coral-500 font-black">
              {upper}
              {lower}
            </span>{' '}
            를 누르면 글자 소리가 나요
          </p>
        )}
      </div>

      {/* 가운데 큰 이미지 + 핫스팟 */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start gap-4">
        <div className="w-full max-w-[920px] mx-auto">
          <div
            // 글자 전환 시 React 가 같은 div 재사용 — key 변경으로 강제 리마운트 (이전 글자 hotspot 잔존 방지)
            key={currentIdx}
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
            {/* 🔴 스포트라이트 — 지금 누를 칸만 남기고 나머지를 덮는다.
                구현은 **거대한 box-shadow spread** 하나다(구멍 뚫린 오버레이를 따로 만들지 않는다).
                부모가 `overflow-hidden` 이라 9999px 가 그림 밖으로 새지 않는다. */}
            {illustrationUrl && current && (
              <div
                className="absolute pointer-events-none rounded-2xl ring-4 ring-white transition-all duration-300"
                style={{
                  left: `${current.h.x * 100}%`,
                  top: `${current.h.y * 100}%`,
                  width: `${current.h.w * 100}%`,
                  height: `${current.h.h * 100}%`,
                  boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
                }}
              />
            )}
            {/* 스피커 아이콘 — 순서 단계엔 **지금 칸만**, 다 누른 뒤엔 전부(다시 듣기 안내) */}
            {illustrationUrl && spots.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {(current ? [current] : spots).map((s, i) => (
                  <div
                    key={`spk-${i}`}
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                      left: `${(s.h.x + s.h.w / 2) * 100}%`,
                      top: `${(s.h.y + s.h.h / 2) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className={`rounded-full shadow-soft flex items-center justify-center ring-1 ring-white/80 bg-coral-400/85 animate-pulse ${
                        current ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-6 h-6 sm:w-7 sm:h-7'
                      }`}
                    >
                      <svg
                        className={`text-white drop-shadow ${current ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'}`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 써보기 — 활성 글자 모달 트리거. ABC 써보기 활동 별도 카드 대신 학습 페이지 내 통합.
            🔴 **다 눌러본 뒤에 나온다** — 소리를 듣기도 전에 쓰기 버튼이 있으면 아이가 그리로 먼저 간다.
               (핫스팟이 없는 글자는 `allDone` 이 처음부터 true 라 바로 보인다.) */}
        {allDone && (
          <button
            onClick={() => setWriteOpen(true)}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-coral-400 to-coral-500 text-white shadow-pop hover:-translate-y-0.5 active:translate-y-0.5 transition-transform text-lg sm:text-xl font-black"
          >
            <span className="text-xl sm:text-2xl">✏️</span>
            <span className="inline-flex items-baseline">
              <span>{upper}</span>
              <span>{lower}</span>
            </span>
            <span>써보기</span>
          </button>
        )}
      </div>

      {writeOpen && (
        <LetterWriteModal
          storybook={sb}
          letterIndex={currentIdx}
          activeLetter={letters[currentIdx] ?? upper}
          onClose={() => setWriteOpen(false)}
        />
      )}
    </div>
  );
}
