import { useEffect, useState } from 'react';
import { coverTitleFont } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { resolveCover, type CoverInput } from './bookCover.util';

// 표지 R2 도메인(pub-*.r2.dev)이 레이트리밋을 걸어, 라이브러리에서 수십 장을 동시에
// 요청하면 일부가 드롭(429/네트워크 실패)되고 <img>는 자동 재시도를 안 해 카드가 계속 빈다.
// → onError 시 지연·재마운트로 재요청. staggered delay + jitter 로 재요청이 몰리지 않게.
const MAX_COVER_RETRIES = 4;

export interface BookCoverProps {
  book: CoverInput;
  lang: string;
  style?: string;
  /** true = standalone surface (render glass title pill); false = caption surface. */
  overlayTitle?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}

/** 표지 단일 진입점 — 클린 표지 + (옵션) 글래스 제목 오버레이. 클린 없으면 레거시 표지(오버레이 X). */
export function BookCover({
  book,
  lang,
  style,
  overlayTitle = false,
  className,
  imgClassName,
  loading = 'lazy',
}: BookCoverProps) {
  const { img, hasClean, title } = resolveCover(book, { style, lang });
  const showOverlay = overlayTitle && hasClean;

  // 이미지 로드 실패 시 재시도 카운터. img 가 바뀌면 리셋.
  const [retry, setRetry] = useState(0);
  useEffect(() => setRetry(0), [img]);
  // 마지막 재시도부터는 캐시-버스트 쿼리로 부정 캐시/드롭을 확실히 우회.
  const src = img && retry > 0 ? `${img}${img.includes('?') ? '&' : '?'}cb=${retry}` : img;

  return (
    <div
      className={cn(
        // 로딩 중(이미지 미도착)엔 뒷배경 peach 플레이스홀더가 비쳐 "빈 카드"가 아닌 "로딩 중"으로 보임.
        // 이미지가 도착하면 object-cover 가 위를 덮어 가림.
        'relative w-full h-full overflow-hidden bg-gradient-to-br from-peach-100 to-peach-200/70',
        className
      )}
      style={{ containerType: 'inline-size' }}
    >
      {img ? (
        <img
          src={src}
          alt={title}
          className={cn('w-full h-full object-cover', imgClassName)}
          loading={loading}
          decoding="async"
          key={`${img}:${retry}`}
          onError={() => {
            // key 가 retry 를 포함 → 실패할 때마다 img 가 remount 되어 이 클로저의 retry 는 항상 최신.
            if (retry >= MAX_COVER_RETRIES) return;
            // 400ms·800ms·1.2s·1.6s + jitter — 재요청이 동시에 몰리지 않게 분산.
            const delay = 400 * (retry + 1) + Math.random() * 350;
            window.setTimeout(() => setRetry(retry + 1), delay);
          }}
        />
      ) : (
        <div
          role="img"
          aria-label={title}
          className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-200 to-peach-300 text-5xl"
        >
          📖
        </div>
      )}
      {showOverlay && (
        <div
          aria-hidden="true"
          className="absolute top-[6%] left-1/2 -translate-x-1/2 w-max max-w-[88%] z-[3]"
        >
          <div
            className="rounded-[22px] px-6 py-2 border border-white/30 backdrop-blur-md"
            style={{
              background: 'rgba(22,16,11,0.46)',
              boxShadow: '0 6px 18px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.28)',
            }}
          >
            <span
              className="block text-center text-white leading-[1.12] break-keep"
              style={{
                fontFamily: `"${coverTitleFont(lang).family}", "Baloo 2", sans-serif`,
                textShadow: '0 2px 6px rgba(0,0,0,.35)',
                fontSize: 'clamp(13px, 4.2cqw, 34px)',
              }}
            >
              {title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
