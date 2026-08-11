import { useEffect, useRef, useState } from 'react';
import { coverTitleFont } from '@tangobook/shared';
import { cn } from '@/lib/cn';
import { resolveCover, type CoverInput } from './bookCover.util';

// 표지 R2 도메인(pub-*.r2.dev)이 레이트리밋을 걸어, 라이브러리에서 수십 장을 동시에
// 요청하면 일부가 드롭(429/네트워크 실패)되고 <img>는 자동 재시도를 안 해 카드가 계속 빈다.
// → onError 시 지연·재마운트로 재요청. staggered delay + jitter 로 재요청이 몰리지 않게.
const MAX_COVER_RETRIES = 4;

// 🔴 onError 만으로는 부족하다(2026-07-25). 요청이 **에러 없이 그냥 안 오는** 경우가 있다
// (스톨·드롭·lazy 트리거 실패). 그러면 onError 가 안 터져 위 재시도가 영영 안 돌고 카드가
// peach 플레이스홀더인 채 멈춘다 = "한번 안 뜨면 계속 안 뜸"의 남은 절반.
// → 카드가 화면에 들어온 뒤 이 시간 안에 로드가 안 끝나면 강제로 remount 해 재요청한다.
//   (화면에 들어왔을 때만 재기 때문에 lazy 의 이점은 유지된다.)
const COVER_STALL_MS = 2500;

// 🔴 표지 원본은 1536px(~125KB)인데 카드는 160~256px 로 그린다 — 라이브러리 한 화면이
// 표지만 ~11MB. 그래서 512px webp 썸네일(~27KB)을 먼저 쓴다.
// 키 규칙은 결정적(`thumbs/512/<원본 key>`)이라 URL 만으로 유도한다 → 서버·데이터 변경 없음.
// 아직 썸네일이 없는 표지는 404 → onError 에서 원본으로 1회 폴백하므로 안전하다.
// 생성 스크립트: packages/server/scripts/generate-cover-thumbs.mjs
function thumbUrl(src: string): string | null {
  try {
    const u = new URL(src);
    if (u.search || u.pathname.startsWith('/thumbs/')) return null; // 캐시버스트 중이거나 이미 썸네일
    u.pathname = `/thumbs/512${u.pathname}`;
    return u.toString();
  } catch {
    return null; // 상대경로 등 — 원본 그대로
  }
}

export interface BookCoverProps {
  book: CoverInput;
  lang: string;
  style?: string;
  /** true = standalone surface (render glass title pill); false = caption surface. */
  overlayTitle?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  /**
   * 🔴 **첫 화면 표지 한 줌만** true. 프리렌더가 `<img src>` 를 지우는데(표지 105장이 CSS 를
   *    밀어냈던 실측 때문), `fetchpriority="high"` 붙은 것만 남긴다 — 그래야 하이드레이션(5.4초)을
   *    기다리지 않고 HTML 에서 바로 받는다. 실측: 첫 표지 8.1초.
   */
  priority?: boolean;
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
  priority = false,
}: BookCoverProps) {
  const { img, hasClean, title } = resolveCover(book, { style, lang });
  const showOverlay = overlayTitle && hasClean;

  // 이미지 로드 실패 시 재시도 카운터. img 가 바뀌면 리셋.
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // 썸네일이 없는(아직 안 구운) 표지는 404 → 한 번만 원본으로 내려간다.
  const [thumbFailed, setThumbFailed] = useState(false);
  useEffect(() => {
    setRetry(0);
    setLoaded(false);
    setThumbFailed(false);
  }, [img]);

  // 재시도 중엔 캐시버스트가 붙어 썸네일 규칙을 못 쓰므로 원본으로 간다.
  const thumb = img && !thumbFailed && retry === 0 ? thumbUrl(img) : null;
  const base = thumb ?? img;
  // 마지막 재시도부터는 캐시-버스트 쿼리로 부정 캐시/드롭을 확실히 우회.
  const src = base && retry > 0 ? `${base}${base.includes('?') ? '&' : '?'}cb=${retry}` : base;

  // 스톨 감시 — 카드가 화면에 들어오면 타이머를 걸고, 그 안에 로드가 끝나지 않으면 재요청.
  // 이미 캐시된 이미지는 즉시 onLoad 가 떠서 타이머가 곧바로 해제되므로 낭비가 없다.
  const holderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!img || loaded || retry >= MAX_COVER_RETRIES) return;
    const el = holderRef.current;
    if (!el) return;
    let timer: number | undefined;
    const arm = () => {
      if (timer != null) return;
      timer = window.setTimeout(
        () => setRetry((r) => (r >= MAX_COVER_RETRIES ? r : r + 1)),
        COVER_STALL_MS
      );
    };
    // IntersectionObserver 미지원(구형·jsdom)이면 그냥 바로 건다 — 없느니 낫다.
    if (typeof IntersectionObserver === 'undefined') {
      arm();
      return () => window.clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) arm();
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer != null) window.clearTimeout(timer);
    };
  }, [img, loaded, retry]);

  return (
    <div
      ref={holderRef}
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
          // 🔴 재시도 = "화면에 있는데 안 떴다" 는 뜻이므로 lazy 를 풀고 즉시 받는다.
          // lazy 인 채로 다시 그리면 안 터지던 조건이 그대로라 또 안 뜬다(가로 스크롤 행에서 관찰됨).
          loading={retry > 0 || priority ? 'eager' : loading}
          {...(priority ? { fetchPriority: 'high' as const } : null)}
          decoding="async"
          key={`${src}:${retry}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            // 썸네일이 아직 없는 표지 → 재시도가 아니라 원본으로 즉시 폴백(1회).
            if (thumb) {
              setThumbFailed(true);
              return;
            }
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
