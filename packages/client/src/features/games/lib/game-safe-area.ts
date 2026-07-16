import type { CSSProperties } from 'react';
import { isInAppBrowser } from '@/lib/in-app-browser';

/**
 * 게임 풀스크린 컨테이너(`fixed inset-0`)용 시스템 UI 회피 스타일.
 *
 * `index.html` 이 `viewport-fit=cover` 라 게임이 화면 끝까지 깔린다. 모바일 가로에서는
 * 가장자리에 시스템 UI 가 겹친다:
 *  · 안드로이드 3버튼 내비바(가로에선 우측 ‹ ◯ ||| ) — **일반 크롬에서도** 오른쪽 카드/컬럼을 가림
 *  · 노치·펀치홀(`env(safe-area-inset-*)`) · 인앱 브라우저(인스타·페북)의 자체 컨트롤 바
 * `env(safe-area-inset)` 은 안드로이드에서 내비바를 항상 보고하진 않으므로, 모바일(coarse
 * pointer)·인앱이면 최소 좌우 여백을 고정 확보하고 그 위에 env 를 `max` 로 얹는다. 데스크톱은 무여백.
 *
 * 또한 모바일 크롬은 `fixed inset-0` 을 (동적 UI 를 감춘) 큰 뷰포트 높이로 잡아 실제 보이는
 * 높이보다 커진 채 콘텐츠가 아래로 밀린다 → `height:100dvh` 로 캡한다(데스크톱은 dvh=vh 라 무변화).
 *
 * 세로 여백은 컨테이너마다 튜닝(블록 게임의 vh clamp 등)이 달라 여기서 건드리지 않는다 —
 * 가로 여백 + 동적 높이 캡만 공통 적용. (가로에선 시스템 내비바가 좌우에 있어 가로가 핵심.)
 */
export function gameSafeAreaStyle(): CSSProperties {
  const inApp = isInAppBrowser();
  const coarse =
    typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  const minH = inApp || coarse ? '3rem' : '1rem';
  return {
    paddingLeft: `max(${minH}, env(safe-area-inset-left))`,
    paddingRight: `max(${minH}, env(safe-area-inset-right))`,
    height: '100dvh',
  };
}
