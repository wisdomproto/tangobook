import { useEffect, useState, lazy, Suspense, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * 🔴 **lottie-web 300KB 를 첫 화면에서 뺀다**(2026-08-04). 이 프리미티브가 앱 전체에서
 * 유일한 lottie 사용처인데 정적 import 라, 호리가 안 나오는 화면까지 전부 지고 있었다
 * (첫 화면이 받던 vendor 1,059KB 중 28%). 애니메이션 JSON 은 어차피 `fetch` 로 늦게 받고
 * png·이모지 폴백도 이미 있으니, 라이브러리도 같이 늦게 받으면 된다.
 */
const Lottie = lazy(() => import('lottie-react'));

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

  const emoji = (
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

  const content = (() => {
    if (stage === 'lottie' && lottieData) {
      // 청크가 오는 동안엔 이모지 — 빈 칸이 생기면 옆 글자가 밀린다.
      return (
        <Suspense fallback={emoji}>
          <Lottie animationData={lottieData} loop={loop} style={sizeStyle} />
        </Suspense>
      );
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
    return emoji;
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
