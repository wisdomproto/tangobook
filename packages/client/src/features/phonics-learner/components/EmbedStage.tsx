import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * 뷰포트 폭으로 그려진 학습 화면을 **상자 폭에 맞춰 축소해** 담는 무대.
 *
 * 🔴 왜 필요한가 — 학습 활동·게임은 칸 크기를 `min(Nvw, Mvh)` 로 잡는다(전체화면 활동의
 *    전사 규칙). `vw` 는 상자가 아니라 **뷰포트**를 재므로, 좁은 상자 안에 그냥 넣으면
 *    1280 기준으로 그려진 격자가 잘린다. 그래서 예전엔 상자를 `100vw` 로 흘려보냈는데,
 *    이번엔 **그 전폭 상자만 페이지보다 넓어 가로폭이 제각각**으로 보였다(사용자 지적).
 * 🔴 해법 = 안쪽은 여전히 **뷰포트 폭 그대로 그리고**, 바깥에서 `scale` 로 줄인다.
 *    활동 13개와 게임 플레이어는 동화책 게임과 공유하는 코드라 한 줄도 못 건드린다.
 * 🔴 높이도 같은 비율로 줄여야 흰 여백이 안 남는다 — CSS `calc(<높이> * var(--s))` 로
 *    문자열 높이(`100dvh`·`min(500px, 88dvh)`)를 그대로 곱한다.
 * 🔴 `transform` 은 그 아래 `fixed`(게임 게이트·플레이어)의 컨테이닝 블록이 되어
 *    **랜딩 전체를 덮는 걸 막는 역할**도 겸한다 — 예전 `translateZ(0)` 자리다.
 *
 * ⚠️ 축소하면 터치·캔버스 좌표가 어긋나지 않는다 — 브라우저가 변환된 좌표로 히트 테스트를
 *    하고, `LetterFillCanvas` 류는 `getBoundingClientRect()` 대비 비율로 환산하기 때문이다.
 */
export function EmbedStage({ height, children }: { height: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  /**
   * 🔴 **화면 근처에 올 때까지 안 마운트한다**(2026-08-11 사용자: "메타 광고로 우리 사이트에
   *    전환하면 인앱 웹으로 뜨는데 속도가 매우 느릴 것 같은데"). 맞았고, 범인은 인앱 브라우저가
   *    아니라 이 상자들이었다 — 실측(프로덕션 · 인스타 UA · 4G · CPU 4배 · 캐시 비움 ·
   *    **스크롤 0회**): 요청 **257건**, 그중 **mp3 150개**, API 45건, 히어로 표지가 뜨는 데
   *    **28초**. 접힘선 아래 활동이 진입 프리워밍·음절 라이브러리·책 데이터를 로드 시점에
   *    한꺼번에 당겨 첫 화면 그림이 그 뒤에 줄을 섰다.
   * 🔴 **높이는 처음부터 잡아 둔다** — 바깥 상자는 늘 렌더하고 children 만 늦게 붙이므로 스크롤이
   *    튀지 않는다(그래서 게이트가 호출부가 아니라 **여기** 있어야 한다).
   * 🔴 `rootMargin` 600px = 눈에 들어오기 한 화면쯤 전에 붙는다. 한 번 붙으면 안 뗀다
   *    (게임 중에 스크롤로 언마운트되면 판이 날아간다).
   */
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const view = window.innerWidth;
      if (!view) return; // 패널이 안 보이면 0 이 나온다 — 그때는 재지 않는다
      setScale(Math.min(1, el.clientWidth / view));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || live) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLive(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden bg-cream-50"
      style={
        {
          '--s': scale,
          height: `calc(${height} * var(--s))`,
        } as CSSProperties
      }
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: '100vw',
          height,
          transform: 'scale(var(--s))',
          transformOrigin: 'top left',
        }}
      >
        {live ? children : null}
      </div>
    </div>
  );
}
