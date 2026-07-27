import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { resolveTtsUrl } from '@/features/tts';
import type { Storybook } from '@tangobook/shared';
import { getWordHotspots } from '@tangobook/shared';
import { playUi } from '@/lib/uiSound';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { LetterWriteModal } from './LetterWriteModal';

/** 소리 사이 쉼 — 콜백으로 끝난 걸 확인한 뒤 넣는다(길이 가정 아님). */
const REST_MS = 420;
/** 진입 안내 음성. 화면이 통째로 무음이면 글 못 읽는 아이는 그림만 보다 나간다. */
const GUIDE_VOICE = '/sounds/voice/tap-sparkle-ko.mp3';

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
 *   - 글자 소리는 그림 아래 **큰 [Aa 🔊] 버튼**(상시) — 탭 재클릭도 같은 소리를 낸다
 *
 * 누르며 듣는 자유 탐색 (영어 모르는 4-5세 입문자용) — 정답·오답이 없다.
 * 🔴 그래도 **한 글자를 다 눌러보면 완료로 친다**(`onMarkComplete`). 예전엔 prop 을 받아놓고
 *    호출하지 않아서, 8단원 26글자를 다 만져도 부모 화면엔 아무 기록이 안 남았다.
 */

export function AlphabetLetterLearnActivity({ unitId, letters, onMarkComplete, onBack }: Props) {
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();

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
   * 이 글자의 소리(a → /애/). 이 단원의 학습 목표라 화면 어디서든 한 번에 닿아야 한다.
   *
   * 🔴 **`blendingSequenceTtsUrl` 에 의존하지 않는다** — Book 1 26글자에 그 음원이 **하나도 없어서**
   *    「탭을 한 번 더 누르면 글자 소리」가 처음부터 무음이었다. 파닉스 라이브러리(`mod_phonics`)에
   *    낱글자 음원이 이미 있고, Book 2 의 `a`·`n` 칸이 쓰는 것과 같은 경로다. 저작 음원이 생기면
   *    그게 우선.
   */
  const sayLetter = useCallback(async () => {
    if (audioBusyRef.current) return;
    const url =
      blending?.blendingSequenceTtsUrl ??
      (await resolveTtsUrl({
        text: lower,
        language: 'english',
        storybookId: unitId,
        identifierPrefix: 'en-letter',
      }));
    if (!url) return;
    audioBusyRef.current = true;
    playAudio(url, () => {
      audioBusyRef.current = false;
    });
  }, [blending, lower, unitId, playAudio]);

  /**
   * 🔴 **진입하면 글자 소리를 한 번 들려준다** — 예전엔 이미 선택된 글자 탭을 *한 번 더* 눌러야
   *    났고, 그 안내는 핫스팟을 다 누른 뒤에야 떴다. 그래서 아이가 A 소리를 한 번도 못 듣고
   *    나갈 수 있었다(이 단원의 목표가 글자인데).
   * 🔴 첫 진입에만 **안내 음성 → 쉼 → 글자 소리**. 글자를 바꿀 땐 글자 소리만.
   */
  const guidedRef = useRef(false);
  useEffect(() => {
    if (!blending) return;
    if (guidedRef.current) {
      sayLetter();
      return;
    }
    guidedRef.current = true;
    playAudio(GUIDE_VOICE, () => scheduleTimer(sayLetter, REST_MS));
    // 의존성은 **글자**만 — sayLetter/playAudio 를 넣으면 sb 갱신마다 소리가 다시 난다.
  }, [currentIdx, blending]);

  /**
   * 한 글자를 다 눌러보면 완료. 🔴 핫스팟이 없는 글자는 세지 않는다 —
   * 들어오자마자 `allDone` 이라 스쳐 지나간 것도 완료가 된다.
   */
  const markedRef = useRef(false);
  const markDone = useCallback(() => {
    if (markedRef.current) return;
    markedRef.current = true;
    onMarkComplete();
  }, [onMarkComplete]);
  useEffect(() => {
    if (allDone && spots.length > 0) markDone();
  }, [allDone, spots.length, markDone]);

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
        const isLast = tapped + 1 >= spots.length;
        setTapped((t) => t + 1);
        // 단어를 다 읽은 **뒤에** 띵동 — 잘 눌렀다는 신호. 마지막 칸이면 칭찬까지 이어진다.
        say(current.w.ttsUrl, () =>
          playAudio('/sounds/game/correct.mp3', () => {
            if (isLast) scheduleTimer(() => playCorrectSequence({ language: 'en' }), REST_MS);
          })
        );
        return;
      }
      const found = spots.find((s) => hit(s.h));
      if (!found) return;
      playUi('tap');
      say(found.w.ttsUrl, () => playAudio('/sounds/game/correct.mp3'));
    },
    [spots, allDone, current, tapped, say, playAudio, playCorrectSequence, scheduleTimer]
  );

  // 글자 탭 클릭 — 활성이면 발음 재생, 비활성이면 그 글자로 전환 (모달 자동 닫기)
  const handleLetterTabClick = useCallback(
    (idx: number) => {
      if (idx !== currentIdx) {
        setCurrentIdx(idx);
        setWriteOpen(false);
        return;
      }
      // 활성 글자 재클릭 = 글자 소리 (아래 큰 버튼과 같은 경로 — 예전엔 저작 음원이 없어 무음이었다)
      void sayLetter();
    },
    [currentIdx, sayLetter]
  );

  // 단어는 자동 재생하지 않는다 — 눌러서 듣는 탐색이 이 화면의 성격이다.
  // 자동으로 나는 건 진입 안내와 **글자 소리**뿐(위 effect).

  if (storybookQuery.isLoading || !sb) {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-cream-50 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/images/phonics/study-bg.webp')" }}
      >
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
      <div
        className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-4 bg-cream-50 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/images/phonics/study-bg.webp')" }}
      >
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
    // 🔴 배경은 한글 활동들과 같은 풀밭 — 이 화면만 밋밋한 그라데이션이라 다른 제품처럼 보였다.
    <div
      className="fixed inset-0 z-[60] flex flex-col px-4 sm:px-6 py-3 bg-cream-50 bg-cover bg-center overflow-y-auto"
      style={{ backgroundImage: "url('/images/phonics/study-bg.webp')" }}
    >
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
            <>🔊 반짝이는 곳을 눌러봐!</>
          ) : (
            <>🎉 다 찾았어! 눌러서 또 들어봐</>
          )}
        </h2>
        {/* 🔴 진행은 숫자(0/2)가 아니라 점 — 다른 활동들과 같다. 4~7세는 분수를 못 읽는다. */}
        {spots.length > 0 && (
          <div className="mt-1.5 flex items-center justify-center gap-2" aria-hidden>
            {spots.map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  i < tapped
                    ? 'w-3.5 h-3.5 bg-coral-500'
                    : i === tapped
                      ? 'w-3.5 h-3.5 bg-coral-300 animate-pulse'
                      : 'w-3 h-3 bg-white/80 ring-2 ring-coral-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 가운데 큰 이미지 + 핫스팟 — 🔴 `justify-center`: 16:9 그림은 폭으로 크기가 정해져서
          큰 화면에선 아래가 통째로 빈다. 위에 붙여두면 화면 절반이 빈 크림색으로 남는다. */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
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
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* 🔴 글자 소리 = 이 단원의 목표. **처음부터 끝까지** 큰 버튼으로 열어둔다 —
              탭을 한 번 더 누르는 숨은 조작에만 맡겨두면 아이는 영영 못 듣는다. */}
          {blending && (
            <button
              // 🔴 핫스팟이 없는 글자(Book 1 에 많다)는 이게 유일한 상호작용이라, 여기서도 완료로 친다.
              onClick={() => {
                void sayLetter();
                markDone();
              }}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white ring-4 ring-coral-300 shadow-pop hover:-translate-y-0.5 active:translate-y-0.5 transition-transform"
            >
              <span className="font-display font-black leading-none text-3xl sm:text-4xl text-coral-500">
                {upper}
              </span>
              <span className="font-display font-black leading-none text-3xl sm:text-4xl text-sky-500">
                {lower}
              </span>
              <span className="text-2xl sm:text-3xl">🔊</span>
            </button>
          )}
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
          {/* 다 찾은 뒤 갈 곳 — 없으면 아이가 상단 탭을 스스로 발견해야 한다. */}
          {allDone && currentIdx < letters.length - 1 && (
            <button
              onClick={() => handleLetterTabClick(currentIdx + 1)}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-mint-400 text-white shadow-pop hover:-translate-y-0.5 active:translate-y-0.5 transition-transform text-lg sm:text-xl font-black"
            >
              <span className="inline-flex items-baseline">
                <span>{(letters[currentIdx + 1] ?? '').toUpperCase()}</span>
                <span>{(letters[currentIdx + 1] ?? '').toLowerCase()}</span>
              </span>
              <span>▶</span>
            </button>
          )}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />

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
