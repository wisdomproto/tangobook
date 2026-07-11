import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PLANS } from '@tangobook/shared';
import type { PlanId } from '@tangobook/shared';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { PlanCard } from '../components/PlanCard';
import { useCheckout, isCheckoutConfigured } from '../hooks/useCheckout';

export default function SubscribePage() {
  const { t } = useTranslation('payment');
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
          {t('subscribe.preOpenTitle')}
        </h1>
        <p className="mt-3 max-w-xs text-sm text-ink-500 break-keep">
          {t('subscribe.preOpenDesc')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="mt-8 rounded-xl bg-coral-500 px-6 py-3 font-black text-white hover:brightness-110"
        >
          {t('subscribe.goLibrary')}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          data-sound="back"
          className="mt-3 text-sm font-bold text-ink-400 hover:text-ink-600"
        >
          {t('subscribe.back')}
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
          {t('subscribe.back')}
        </button>
      </div>

      <h1 className="mb-2 font-display text-3xl font-black text-ink-900 break-keep text-center">
        {t('subscribe.title')}
      </h1>
      <p className="mb-3 text-center text-ink-500 break-keep">{t('subscribe.subtitle')}</p>
      <p className="mb-8 rounded-full bg-coral-500 px-5 py-2 text-center text-sm font-black text-white shadow-soft break-keep">
        {t('subscribe.promoBadge', { label: t('launchPromo') })}
      </p>

      <div className="grid w-full max-w-md gap-4">
        {(Object.values(PLANS) as Array<(typeof PLANS)[PlanId]>).map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={t(`plans.${plan.id}.name`, { defaultValue: plan.name })}
            amount={plan.amount}
            originalAmount={plan.originalAmount}
            days={plan.days}
            onSelect={() => void handleSelect(plan.id as PlanId)}
            disabled={loading}
          />
        ))}
      </div>

      {error && <p className="mt-6 text-center text-sm text-danger break-keep">{error}</p>}

      {loading && (
        <p className="mt-6 text-center text-sm text-ink-500">{t('subscribe.loadingCheckout')}</p>
      )}

      <p className="mt-8 max-w-xs text-center text-xs text-ink-400 break-keep">
        {t('subscribe.noAutoRenew')}
      </p>
      <p className="mt-3 text-center text-xs text-ink-400">
        <Link to="/terms" className="underline hover:text-ink-600">
          {t('subscribe.terms')}
        </Link>
        {' · '}
        <Link to="/refund" className="underline hover:text-ink-600">
          {t('subscribe.refund')}
        </Link>
        {' · '}
        <Link to="/privacy" className="underline hover:text-ink-600">
          {t('subscribe.privacy')}
        </Link>
      </p>
    </div>
  );
}
