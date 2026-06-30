import { useNavigate } from 'react-router-dom';
import { PLANS } from '@tangobook/shared';
import type { PlanId } from '@tangobook/shared';
import { PlanCard } from '../components/PlanCard';
import { useCheckout } from '../hooks/useCheckout';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { startCheckout, loading, error } = useCheckout();

  async function handleSelect(planId: PlanId) {
    await startCheckout(planId);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-peach-50 px-4 py-10">
      {/* Back button */}
      <div className="mb-6 w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          ← 돌아가기
        </button>
      </div>

      <h1 className="mb-2 font-display text-3xl font-black text-ink-900 break-keep text-center">
        탱고북 이용권
      </h1>
      <p className="mb-8 text-center text-slate-500 break-keep">
        동화책·자연관찰·학습 콘텐츠를 무제한으로 즐겨보세요.
      </p>

      <div className="grid w-full max-w-md gap-4">
        {(Object.values(PLANS) as Array<(typeof PLANS)[PlanId]>).map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={plan.name}
            amount={plan.amount}
            days={plan.days}
            onSelect={() => void handleSelect(plan.id as PlanId)}
            disabled={loading}
          />
        ))}
      </div>

      {error && <p className="mt-6 text-center text-sm text-red-600 break-keep">{error}</p>}

      {loading && <p className="mt-6 text-center text-sm text-slate-500">결제창을 불러오는 중…</p>}

      <p className="mt-8 max-w-xs text-center text-xs text-slate-400 break-keep">
        결제 후 언제든 해지할 수 있으며, 해지 시 남은 기간까지 이용 가능합니다.
      </p>
    </div>
  );
}
