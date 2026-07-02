import type { AccessStatus } from '@tangobook/shared';
import { InviteButton } from '@/features/payment';

interface PaywallNoticeProps {
  /** 'guest' = 미로그인, 'expired' = 체험 종료. (entitled 상태에선 렌더하지 않음) */
  status: AccessStatus;
  /** 잠긴 책의 표지 — 벽 앞에서 가치를 보여주기 위해 썸네일로 노출. */
  coverUrl?: string;
  /** 구독 결제 시작. 미연동 시 비활성 표기. */
  onSubscribe?: () => void;
  /** 로그인/가입 이동 (guest). */
  onLogin?: () => void;
  /** 무료 책 둘러보기 (guest·expired 공통 탈출 동선). */
  onBrowseFree?: () => void;
  /** 닫기 (모달로 띄운 경우) — 있으면 우상단 ✕ 노출. */
  onClose?: () => void;
}

/**
 * 유료 책을 권한 없이 열었을 때 보여주는 잠금 안내.
 * guest → "가입하면 7일 무료" / expired → "구독 or 친구초대 or 무료책".
 * 통보형 dead-end 가 되지 않게 guest/expired 모두 대안 동선(무료책·✕)을 함께 준다.
 */
export function PaywallNotice({
  status,
  coverUrl,
  onSubscribe,
  onLogin,
  onBrowseFree,
  onClose,
}: PaywallNoticeProps) {
  const isGuest = status === 'guest';
  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-pop">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          data-sound="close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-600"
        >
          ✕
        </button>
      )}
      {coverUrl ? (
        <div className="relative">
          <img src={coverUrl} alt="" className="h-32 w-auto rounded-2xl object-cover shadow-soft" />
          <span className="absolute -top-2 -right-2 rounded-full bg-ink-900/75 px-2.5 py-0.5 text-[11px] font-black text-white shadow-soft">
            🔒 잠금
          </span>
        </div>
      ) : (
        <div className="text-5xl" aria-hidden>
          🔒
        </div>
      )}
      <h2 className="font-display text-2xl font-black text-ink-900">잠긴 동화예요</h2>
      <p className="leading-relaxed text-ink-600">
        {isGuest
          ? '회원 가입하면 7일 동안 모든 동화를 무료로 즐길 수 있어요. 친구를 초대하면 둘 다 7일씩 더 늘어나요!'
          : '무료 체험이 끝났어요. 구독하거나 친구를 초대하면 모든 동화를 계속 즐길 수 있어요.'}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        {isGuest ? (
          <>
            <button
              type="button"
              onClick={onLogin}
              className="w-full rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
            >
              7일 무료로 시작하기
            </button>
            {onBrowseFree && (
              <button
                type="button"
                onClick={onBrowseFree}
                className="mt-1 text-sm font-bold text-ink-500 hover:text-coral-500"
              >
                무료 책 먼저 보러가기
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSubscribe}
              disabled={!onSubscribe}
              className="w-full rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {onSubscribe ? '구독하고 계속 보기' : '구독 준비 중'}
            </button>
            <InviteButton className="w-full rounded-full border-2 border-coral-500 px-6 py-3 font-black text-coral-600 hover:bg-coral-50" />
            {onBrowseFree && (
              <button
                type="button"
                onClick={onBrowseFree}
                className="mt-1 text-sm font-bold text-ink-500 hover:text-coral-500"
              >
                무료 책 먼저 보러가기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
