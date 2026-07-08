/**
 * 이용권 가격 단일소스 — 클라 표시 + 서버 결제 생성/금액 교차검증 모두 이 값 사용.
 *
 * 🎉 오픈 기념 반값 할인 (2026-07~): `amount` = 실 결제액(할인가), `originalAmount` = 정가(표시용).
 * 할인 종료 시: amount 를 originalAmount 값으로 되돌리고 originalAmount 필드·LAUNCH_PROMO_LABEL 제거.
 */
export const PLANS = {
  month1: { id: 'month1', amount: 4950, originalAmount: 9900, days: 30, name: '1개월 이용권' },
  // 연간 정가 79,000(월환산 6,583 = 월간 정가 9,900 대비 33% 저렴) — 연간 전환 유인 강화(2026-07-08).
  // 오픈 반값 프로모 실결제 = 39,500(50%). 프로모 종료 시 amount=79000 로 되돌리고 originalAmount 제거.
  year1: { id: 'year1', amount: 39500, originalAmount: 79000, days: 365, name: '12개월 이용권' },
} as const;

/** 할인 프로모션 라벨 — 이용권 화면 배지/헤드라인 공용. */
export const LAUNCH_PROMO_LABEL = '오픈 기념 반값 할인';

export type PlanId = keyof typeof PLANS;
export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && v in PLANS;
