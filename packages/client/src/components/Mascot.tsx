import { useEffect, useState, type CSSProperties } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/cn';

export type MascotState =
  | 'idle'
  | 'waving'
  | 'thinking'
  | 'reading'
  | 'pointing'
  | 'cheering'
  | 'celebrating'
  | 'dancing'
  | 'sleeping'
  | 'sad';

export type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

export const MASCOT_EMOJI_FALLBACK: Record<MascotState, string> = {
  idle: '🐯',
  waving: '👋',
  thinking: '🤔',
  reading: '📖',
  pointing: '👉',
  cheering: '👏',
  celebrating: '🎉',
  dancing: '💃',
  sleeping: '😴',
  sad: '😿',
};

const LOTTIE_STATES = new Set<MascotState>([
  'idle',
  'waving',
  'cheering',
  'celebrating',
  'dancing',
]);
const SIZE_PX: Record<MascotSize, number> = { sm: 48, md: 80, lg: 120, xl: 200 };

interface MascotProps {
  state: MascotState;
  size?: MascotSize;
  message?: string;
  loop?: boolean;
  onClick?: () => void;
  className?: string;
  character?: 'hori';
}

type Stage = 'lottie' | 'png' | 'emoji';

export function Mascot({
  state,
  size = 'md',
  message,
  loop = true,
  onClick,
  className,
  character = 'hori',
}: MascotProps) {
  const [stage, setStage] = useState<Stage>(LOTTIE_STATES.has(state) ? 'lottie' : 'png');
  const [lottieData, setLottieData] = useState<object | null>(null);

  const px = SIZE_PX[size];
  // URL v 쿼리 = 에셋 버전 (clean 배경 이후). 브라우저 캐시된 이전 버전 무효화.
  const ASSET_VERSION = 3;
  const basePath = `/mascot/${character}`;
  const bust = `?v=${ASSET_VERSION}`;

  // Lottie 로드 — useEffect로 이동 (render 중 fetch 방지, StrictMode 안전)
  useEffect(() => {
    if (stage !== 'lottie' || lottieData) return;
    let cancelled = false;
    fetch(`${basePath}/${state}.json${bust}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('lottie 404'))))
      .then((data) => {
        if (!cancelled) setLottieData(data);
      })
      .catch(() => {
        if (!cancelled) setStage('png');
      });
    return () => {
      cancelled = true;
    };
  }, [stage, state, lottieData, basePath]);

  // state 바뀌면 stage 재평가 + lottie 데이터 초기화
  useEffect(() => {
    setStage(LOTTIE_STATES.has(state) ? 'lottie' : 'png');
    setLottieData(null);
  }, [state]);

  const sizeStyle: CSSProperties = { width: px, height: px };

  const content = (() => {
    if (stage === 'lottie' && lottieData) {
      return <Lottie animationData={lottieData} loop={loop} style={sizeStyle} />;
    }
    if (stage === 'png') {
      return (
        <img
          src={`${basePath}/${state}.webp${bust}`}
          alt=""
          aria-hidden="true"
          style={sizeStyle}
          onError={() => setStage('emoji')}
        />
      );
    }
    // stage === 'emoji' or lottie still loading
    return (
      <span
        role="img"
        aria-hidden="true"
        style={{
          ...sizeStyle,
          fontSize: px * 0.85,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {MASCOT_EMOJI_FALLBACK[state]}
      </span>
    );
  })();

  return (
    <div
      className={cn('inline-flex items-center gap-3', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {content}
      {message && (
        <div className="relative bg-white px-4 py-2 rounded-lg rounded-bl-sm shadow-soft text-ink-900 font-bold text-sm max-w-xs">
          {message}
        </div>
      )}
    </div>
  );
}
