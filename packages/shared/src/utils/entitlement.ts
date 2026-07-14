// 유료화(freemium) 접근 권한 판정 — 순수 로직. DB·네트워크·React 없음.
// 규칙: 가입 후 7일 무료 체험 + 친구 초대 시 +7일(연장, 무한 누적은 상한 정책으로 별도 제한) + 구독.
//       무료 책(isAccessibleForFree !== false)은 권한과 무관하게 항상 열람 가능.

export const TRIAL_DAYS = 7;
/** 친구 1명 초대 시 적립되는 체험 연장 일수. */
export const REFERRAL_BONUS_DAYS = 7;

const DAY_MS = 86_400_000;

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface Subscription {
  status: SubscriptionStatus;
  /** 구독 유효 종료 시각(ISO). 지정 시 이 시각 이후엔 비활성. null/미지정 = 무기한 유효. */
  currentPeriodEnd?: string | null;
  /** 결제 프로바이더 (예: 'paddle'). */
  provider?: string;
}

export type AccessStatus = 'guest' | 'trial' | 'subscribed' | 'expired';

export interface AccessState {
  status: AccessStatus;
  /** 체험/구독이 유효해 유료 책을 읽을 수 있는가. */
  isEntitled: boolean;
  /** 체험 종료 시각(ISO). 구독자/게스트는 null. */
  trialEndsAt: string | null;
  /** 남은 체험 일수(올림, ≥0). */
  trialDaysLeft: number;
}

export interface AccessInput {
  /** 부모 계정 — null = 게스트(미로그인). */
  account: { createdAt: string } | null;
  subscription?: Subscription | null;
  /** 레퍼럴로 적립된 보너스 일수(체험 연장). */
  referralBonusDays?: number;
  /**
   * 체험 시작 시각 override(ISO). 지정 시 이 시각 + 7일이 체험 종료 기준.
   * 미지정/null = 가입일(account.createdAt) 사용(기본 = "가입일부터 7일").
   * 용도: 기존 회원 체험 리셋, 정식 오픈 시 일괄 시작 등.
   */
  trialStartedAt?: string | null;
}

function toTime(iso?: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/** 가입시각 + 기본 체험 + 보너스(레퍼럴) → 체험 종료 시각(ms). */
export function trialEndMs(createdAt: string, bonusDays = 0): number | null {
  const start = toTime(createdAt);
  if (start == null) return null;
  return start + (TRIAL_DAYS + Math.max(0, bonusDays)) * DAY_MS;
}

export function isSubscriptionActive(sub: Subscription | null | undefined, now: number): boolean {
  if (!sub) return false;
  if (sub.status === 'active' || sub.status === 'trialing') {
    const end = toTime(sub.currentPeriodEnd);
    return end == null ? true : end > now;
  }
  return false;
}

/**
 * 계정·구독·레퍼럴 → 현재 접근 상태.
 * @param now Date.now() 주입(테스트 결정성).
 */
export function computeAccess(input: AccessInput, now: number = Date.now()): AccessState {
  const { account, subscription, referralBonusDays = 0, trialStartedAt } = input;
  const bonusMs = Math.max(0, referralBonusDays) * DAY_MS;

  // 구독 종료 시각(ms) — active/trialing 일 때만. currentPeriodEnd 미지정 = 무기한(Infinity).
  // 지난 시각이어도(구독 막 종료) 여기서 잡아 아래 보너스 이월의 기준으로 쓴다.
  const subEndMs =
    subscription && (subscription.status === 'active' || subscription.status === 'trialing')
      ? (toTime(subscription.currentPeriodEnd) ?? Infinity)
      : null;

  // 구독이 지금 유효하게 커버 중이면 subscribed.
  // (레퍼럴 보너스는 구독 종료 뒤로 이월되어, 종료 시점의 재평가에서 아래 trial 로 이어진다.)
  if (subEndMs != null && subEndMs > now) {
    return { status: 'subscribed', isEntitled: true, trialEndsAt: null, trialDaysLeft: 0 };
  }
  if (!account) {
    return { status: 'guest', isEntitled: false, trialEndsAt: null, trialDaysLeft: 0 };
  }

  // 무료 종료 = (체험 앵커 종료 vs 구독 종료 중 더 나중) + 레퍼럴 보너스.
  // → 구독자가 초대한 보너스도 구독 종료 뒤로 붙고, 순수 체험자는 기존과 동일(구독 없음).
  const trialAnchorEnd = trialEndMs(trialStartedAt || account.createdAt, 0);
  const ends = [trialAnchorEnd, subEndMs].filter(
    (x): x is number => x != null && Number.isFinite(x)
  );
  const baseEnd = ends.length ? Math.max(...ends) : null;
  const endMs = baseEnd != null ? baseEnd + bonusMs : null;

  if (endMs != null && endMs > now) {
    return {
      status: 'trial',
      isEntitled: true,
      trialEndsAt: new Date(endMs).toISOString(),
      trialDaysLeft: Math.ceil((endMs - now) / DAY_MS),
    };
  }
  return {
    status: 'expired',
    isEntitled: false,
    trialEndsAt: endMs != null ? new Date(endMs).toISOString() : null,
    trialDaysLeft: 0,
  };
}

/**
 * 책 열람 가능 여부.
 * 무료 책(isAccessibleForFree !== false — 미지정/true)은 항상 열람.
 * 유료 책(isAccessibleForFree === false)은 entitlement(체험/구독) 필요.
 */
export function canReadBook(
  book: { isAccessibleForFree?: boolean },
  access: Pick<AccessState, 'isEntitled'>
): boolean {
  if (book.isAccessibleForFree !== false) return true;
  return access.isEntitled;
}

/** 기존 paid_until(없으면 now)에서 days 만큼 연장한 ISO. 결제 성공 시 서버가 사용. */
export function extendPaidUntil(current: string | null, days: number, now = Date.now()): string {
  const base = Math.max(now, current ? Date.parse(current) || now : now);
  return new Date(base + days * 86_400_000).toISOString();
}
