/**
 * 묶음·세트의 **총 재생시간 어림**.
 *
 * 🔴 권수로 잰다. 쪽수가 아니다 — 실측(10권 142쪽, 카테고리 5종)에서
 * **권당 길이가 쪽당 길이보다 훨씬 안정적**이었다. 책마다 "한 권 분량"을 비슷하게 잡고
 * 쪽으로 쪼개는 방식만 다르기 때문이다(명작 15쪽 ≈ 자연관찰 18쪽 ≈ 생활동화 10쪽).
 *
 *   권당 편차 σ ≈ 14%  ·  쪽당 편차 σ ≈ 33% (쪽당 7.1초 ~ 21.4초)
 *
 * 표본 평균 = 나레이션 174초 + 페이지 넘김 쉼(`PAGE_REST_MS` 900 + `NEXT_TTS_DELAY_MS` 350)
 * ≈ **권당 192초**. 뷰어 쉼 상수가 바뀌면 여기도 같이 볼 것.
 *
 * 어차피 어림이라 화면엔 "약 …" 으로 붙이고 5분 단위로 끊는다 — 「약 2시간 33분」 은
 * 있지도 않은 정밀도를 주장하는 셈이다.
 */
export const SECONDS_PER_BOOK = 192;

export function estimatePlaySeconds(bookCount: number): number {
  return Math.max(0, bookCount) * SECONDS_PER_BOOK;
}

export interface PlaytimeParts {
  hours: number;
  minutes: number;
}

/** 초 → 5분 단위로 끊은 {시, 분}. 5분 미만이어도 0분으로 내리지 않는다(최소 5분). */
export function playtimeParts(seconds: number): PlaytimeParts {
  const rounded = Math.max(5, Math.round(seconds / 60 / 5) * 5);
  return { hours: Math.floor(rounded / 60), minutes: rounded % 60 };
}
