import type { AccessStatus } from '@tangobook/shared';

interface PaywallNoticeProps {
  /** 'guest' = 미로그인, 'expired' = 체험 종료. (entitled 상태에선 렌더하지 않음) */
  status: AccessStatus;
  /** 구독 결제 시작 (Paddle checkout). 미연동 시 비활성 표기. */
  onSubscribe?: () => void;
  /** 로그인/가입 이동 (guest). */
  onLogin?: () => void;
}

/**
 * 유료 책을 권한 없이 열었을 때 보여주는 잠금 안내.
 * guest → "가입하면 7일 무료" / expired → "체험 종료, 구독하고 계속".
 */
export function PaywallNotice({ status, onSubscribe, onLogin }: PaywallNoticeProps) {
  const isGuest = status === 'guest';
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-pop">
      <div className="text-5xl" aria-hidden>
        🔒
      </div>
      <h2 className="font-display text-2xl font-black text-slate-900">프리미엄 동화예요</h2>
      <p className="text-slate-600 leading-relaxed">
        {isGuest
          ? '가입하면 7일 동안 모든 동화를 무료로 즐길 수 있어요. 친구를 초대하면 7일씩 더 늘어나요!'
          : '무료 체험이 끝났어요. 구독하고 모든 동화·자연관찰·학습을 계속 즐겨보세요.'}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        {isGuest && (
          <button
            type="button"
            onClick={onLogin}
            className="w-full rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
          >
            7일 무료로 시작하기
          </button>
        )}
        <button
          type="button"
          onClick={onSubscribe}
          disabled={!onSubscribe}
          className="w-full rounded-full border-2 border-coral-500 px-6 py-3 font-black text-coral-600 hover:bg-coral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {onSubscribe ? '구독하기' : '구독 준비 중'}
        </button>
      </div>
    </div>
  );
}
