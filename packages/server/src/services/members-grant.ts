import { AppError } from '../middleware/error.middleware.js';

export type GrantInput =
  | { type: 'trial-reset' }
  | { type: 'bonus-days'; days: number }
  | { type: 'paid-until'; until: string };

export interface EntitlementValues {
  trial_started_at: string | null;
  referral_bonus_days: number;
  paid_until: string | null;
}

/** grant 요청 → entitlements 갱신 필드. 검증 실패 시 AppError(400). 순수 함수(테스트 대상). */
export function resolveGrantUpdate(
  input: GrantInput,
  existing: EntitlementValues,
  now: number = Date.now()
): Partial<EntitlementValues> {
  if (input.type === 'trial-reset') {
    return { trial_started_at: new Date(now).toISOString() };
  }
  if (input.type === 'bonus-days') {
    const d = input.days;
    if (!Number.isInteger(d) || d < 1 || d > 365) {
      throw new AppError(400, 'days는 1~365 정수여야 합니다');
    }
    return { referral_bonus_days: existing.referral_bonus_days + d };
  }
  if (input.type === 'paid-until') {
    const t = Date.parse(input.until);
    if (Number.isNaN(t) || t <= now) throw new AppError(400, 'until은 미래 시각이어야 합니다');
    return { paid_until: new Date(t).toISOString() };
  }
  throw new AppError(400, '알 수 없는 grant type입니다');
}
