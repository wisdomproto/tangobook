export const PLANS = {
  month1: { id: 'month1', amount: 9900, days: 30, name: '1개월 이용권' },
  year1: { id: 'year1', amount: 99000, days: 365, name: '12개월 이용권' },
} as const;

export type PlanId = keyof typeof PLANS;
export const isPlanId = (v: unknown): v is PlanId => typeof v === 'string' && v in PLANS;
