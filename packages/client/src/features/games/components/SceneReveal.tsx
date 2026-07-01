import { useEffect, useRef, useState } from 'react';

interface SceneRevealProps {
  illustrationUrl: string;
  /** 페이지 본문 (자막) */
  text?: string;
  /** 페이지 나레이션 URL — 있으면 재생 후 onDone, 없으면 잠깐 보여주고 onDone */
  ttsUrl?: string;
  /** 나레이션 끝 or 화면 탭 시 다음 단어로 */
  onDone: () => void;
}

const NO_AUDIO_HOLD_MS = 2600; // 나레이션 없을 때 장면만 잠깐 노출

/**
 * 블록 게임 정답 후 "그 단어가 나오는 동화 장면 + 나레이션" 리빌 오버레이.
 * 오디오 생명주기를 자체 소유 — 언마운트(탭 스킵/다음) 시 정지되어 다음 단어와 겹치지 않음.
 */
export function SceneReveal({ illustrationUrl, text, ttsUrl, onDone }: SceneRevealProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onDoneRef.current();
    };
    if (!ttsUrl) {
      const t = setTimeout(finish, NO_AUDIO_HOLD_MS);
      return () => clearTimeout(t);
    }
    const audio = new Audio(ttsUrl);
    audio.addEventListener('ended', finish);
    audio.addEventListener('error', finish);
    audio.play().catch(finish);
    return () => {
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
              {text}
            </p>
          </div>
        )}
      </div>
      <span className="text-white/70 text-sm font-bold break-keep">화면을 누르면 다음으로 →</span>
    </button>
  );
}
