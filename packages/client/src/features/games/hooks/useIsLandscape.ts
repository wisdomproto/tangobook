import { useEffect, useState } from 'react';

/**
 * 화면이 가로인가.
 *
 * 🔴 **`landscape:` 변형을 쓰지 않는 이유** — 이 저장소는 `theme.extend.screens.short:{raw}`
 *    때문에 변형이 **에러 없이 조용히 안 만들어진** 전례가 있다(`max-*` 전수 확인, 팔레트 램프도 같은 증상).
 * 🔴 **`sm:` 폭 분기로도 안 된다** — 태블릿은 세로(768×1024)든 가로(1024×768)든 `sm` 을 넘는다.
 *    폭으로 가르면 세로로 세운 태블릿이 가로 배치를 받는다. 물어야 하는 건 폭이 아니라 방향이다.
 */
export function useIsLandscape(): boolean {
  const [landscape, setLandscape] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(orientation: landscape)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const update = () => setLandscape(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return landscape;
}
