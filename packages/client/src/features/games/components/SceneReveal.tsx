import { useEffect, useRef, useState } from 'react';

interface SceneRevealProps {
  illustrationUrl: string;
  /** 페이지 본문 (자막) */
  text?: string;
  /** 페이지 나레이션 URL — 있으면 재생 후 다음, 없으면 잠깐 보여주고 다음 */
  ttsUrl?: string;
  /** 자막에서 강조할 맞춘 단어형(ko=한글/en=영어). 본문에 있으면 하이라이트. */
  highlight?: string;
  /** 나레이션 끝(또는 최소 노출 후) or 화면 탭 시 다음 단어로 */
  onDone: () => void;
}

// 나레이션이 짧거나 실패해도 장면을 최소 이만큼은 보여준다(순식간에 사라지지 않게).
const MIN_VISIBLE_MS = 2500;
// 나레이션 자체가 없을 때 장면만 노출하는 시간.
const NO_AUDIO_HOLD_MS = 3000;
// 동화 장면 배경음악 볼륨 (나레이션 아래 은은하게).
const SCENE_BGM_VOLUME = 0.16;

/** 자막 텍스트에서 맞춘 단어를 amber 칩으로 강조. 매칭 없으면 원문 그대로. 대소문자 무시. */
export function renderCaption(text: string, term?: string) {
  if (!term || !term.trim()) return text;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${esc})`, 'gi'));
  if (parts.length <= 1) return text; // 본문에 단어 없음
  const lower = term.toLowerCase();
  return parts.map((part, i) =>
    part && part.toLowerCase() === lower ? (
      <mark
        key={i}
        className="mx-0.5 rounded-md bg-amber-300 px-1.5 py-0.5 font-black text-ink-900"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * 블록 게임 정답 후 "그 단어가 나오는 동화 장면 + 나레이션" 리빌 오버레이.
 * 오디오 생명주기를 자체 소유 — 언마운트(탭 스킵/다음) 시 정지되어 다음 단어와 겹치지 않음.
 */
export function SceneReveal({
  illustrationUrl,
  text,
  ttsUrl,
  highlight,
  onDone,
}: SceneRevealProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [imgLoaded, setImgLoaded] = useState(false);

  // 동화 장면 배경음악 — 마운트 동안 저볼륨 루프. 5곡 중 랜덤 1곡. 언마운트(다음/탭) 시 정지.
  useEffect(() => {
    const n = 1 + Math.floor(Math.random() * 5);
    const bgm = new Audio(`/sounds/bgm/default-${n}.mp3`);
    bgm.loop = true;
    bgm.volume = SCENE_BGM_VOLUME;
    bgm.play().catch(() => {});
    return () => {
      bgm.pause();
      bgm.src = '';
    };
  }, []);

  useEffect(() => {
    let advanced = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    const mountedAt = Date.now();

    const advance = () => {
      if (advanced) return;
      advanced = true;
      onDoneRef.current();
    };
    // 나레이션 끝/실패 시 — 최소 노출 시간은 채우고 다음으로.
    const finishOrHold = () => {
      if (advanced) return;
      const remaining = MIN_VISIBLE_MS - (Date.now() - mountedAt);
      if (remaining <= 0) advance();
      else holdTimer = setTimeout(advance, remaining);
    };

    if (!ttsUrl) {
      holdTimer = setTimeout(advance, NO_AUDIO_HOLD_MS);
      return () => {
        advanced = true;
        clearTimeout(holdTimer);
      };
    }

    const audio = new Audio(ttsUrl);
    audio.addEventListener('ended', finishOrHold);
    audio.addEventListener('error', finishOrHold);
    audio.play().catch(finishOrHold);
    return () => {
      // ⚠️ cleanup 이 advance 를 부르지 않게 — 리스너부터 제거 + 가드.
      // (StrictMode 이중 마운트에서 src='' 가 'error' 를 발생시켜 즉시 다음 단어로 넘어가던 버그 방지)
      advanced = true;
      clearTimeout(holdTimer);
      audio.removeEventListener('ended', finishOrHold);
      audio.removeEventListener('error', finishOrHold);
      audio.pause();
      audio.src = '';
    };
  }, [ttsUrl]);

  return (
    <button
      type="button"
      onClick={() => onDoneRef.current()}
      aria-label="다음으로"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-ink-900/85 backdrop-blur-sm p-4 sm:p-8"
    >
      <div className="relative w-full max-w-3xl aspect-video overflow-hidden rounded-3xl shadow-pop bg-ink-900">
        <img
          src={illustrationUrl}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={
            'w-full h-full object-cover transition-opacity duration-300 ' +
            (imgLoaded ? 'opacity-100' : 'opacity-0')
          }
        />
        {text && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 py-5 sm:px-8 sm:py-7">
            <p className="text-white font-black text-lg sm:text-2xl leading-snug break-keep text-center drop-shadow">
              {renderCaption(text, highlight)}
            </p>
          </div>
        )}
      </div>
      <span className="text-white/70 text-sm font-bold break-keep">화면을 누르면 다음으로 →</span>
    </button>
  );
}
