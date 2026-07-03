import { Link, useNavigate } from 'react-router-dom';
import { PLANS, LAUNCH_PROMO_LABEL } from '@tangobook/shared';
import type { PlanId } from '@tangobook/shared';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { PlanCard } from '../components/PlanCard';
import { useCheckout, isCheckoutConfigured } from '../hooks/useCheckout';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { startCheckout, loading, error } = useCheckout();

  // 결제 오픈 전(유료화 OFF 또는 토스 키 미설정) — 개발자용 에러 대신 친절한 준비 중 안내.
  const checkoutReady = PAYWALL_ENABLED && isCheckoutConfigured;

  async function handleSelect(planId: PlanId) {
    await startCheckout(planId);
  }

  if (!checkoutReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-peach-50 px-4 py-10 text-center">
        <div className="text-5xl mb-4">🎁</div>
        <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
          지금은 모든 동화가 무료예요
        </h1>
        <p className="mt-3 max-w-xs text-sm text-ink-500 break-keep">
          이용권 구매는 정식 오픈과 함께 열려요. 그동안은 마음껏 읽어 주세요!
        </p>
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="mt-8 rounded-xl bg-coral-500 px-6 py-3 font-black text-white hover:brightness-110"
        >
          동화책 보러 가기
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          data-sound="back"
          className="mt-3 text-sm font-bold text-ink-400 hover:text-ink-600"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-peach-50 px-4 py-10">
      {/* Back button */}
      <div className="mb-6 w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          data-sound="back"
          className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-600"
        >
          ← 돌아가기
        </button>
      </div>

      <h1 className="mb-2 font-display text-3xl font-black text-ink-900 break-keep text-center">
        탱고북 이용권
      </h1>
      <p className="mb-3 text-center text-ink-500 break-keep">
        동화책·자연관찰·학습 콘텐츠를 무제한으로 즐겨보세요.
      </p>
      <p className="mb-8 rounded-full bg-coral-500 px-5 py-2 text-center text-sm font-black text-white shadow-soft break-keep">
        🎉 {LAUNCH_PROMO_LABEL} 중!
      </p>

      <div className="grid w-full max-w-md gap-4">
        {(Object.values(PLANS) as Array<(typeof PLANS)[PlanId]>).map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={plan.name}
            amount={plan.amount}
            originalAmount={plan.originalAmount}
            days={plan.days}
            onSelect={() => void handleSelect(plan.id as PlanId)}
            disabled={loading}
          />
        ))}
      </div>

      {error && <p className="mt-6 text-center text-sm text-danger break-keep">{error}</p>}

      {loading && <p className="mt-6 text-center text-sm text-ink-500">결제창을 불러오는 중…</p>}

      <p className="mt-8 max-w-xs text-center text-xs text-ink-400 break-keep">
        기간이 끝나도 자동으로 결제되지 않아요. 구매한 기간 동안 모든 콘텐츠를 이용할 수 있어요.
      </p>
      <p className="mt-3 text-center text-xs text-ink-400">
        <Link to="/terms" className="underline hover:text-ink-600">
          이용약관
        </Link>
        {' · '}
        <Link to="/refund" className="underline hover:text-ink-600">
          취소·환불 규정
        </Link>
        {' · '}
        <Link to="/privacy" className="underline hover:text-ink-600">
          개인정보처리방침
        </Link>
      </p>
    </div>
  );
}
