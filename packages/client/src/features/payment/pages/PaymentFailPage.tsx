import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PaymentFailPage() {
  const { t } = useTranslation('payment');
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        😢
      </div>
      <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
        {t('paymentFail.title')}
      </h1>
      {message && <p className="text-sm text-slate-600 break-keep">{message}</p>}
      {code && <p className="text-xs text-slate-400">{t('paymentFail.errorCode', { code })}</p>}
      <Link
        to="/subscribe"
        className="mt-4 inline-block rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
      >
        {t('paymentFail.retry')}
      </Link>
      <Link to="/library" className="text-sm text-slate-400 underline hover:text-slate-600">
        {t('paymentFail.backToLibrary')}
      </Link>
    </div>
  );
}
