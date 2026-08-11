import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * 로그인 벽 — 가입 / 로그인 둘뿐.
 *
 * 🔴 게스트 30일 창을 폐지하면서 이 화면의 성격이 바뀌었다(2026-08-11). 예전엔 **첫 진입마다**
 *    떠서 「게스트로 둘러보기 / 가입 / 로그인」을 물었는데, 이제 라이브러리는 미로그인도 그냥
 *    들어와 **무료 책 11권**을 본다(그게 "일부 공개"다). 그래서 이 화면은 첫 진입 선택지가
 *    아니라, **잠긴 것을 열려고 할 때**만 붙는 벽이다 → `PhonicsUnitGate`.
 */
export function EntryGate() {
  const { t } = useTranslation('access');
  const navigate = useNavigate();

  const goAuth = (mode: 'signup' | 'login') =>
    navigate(mode === 'signup' ? '/login?mode=signup' : '/login');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-gradient-to-b from-cream-50 to-peach-100 p-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={t('entryGate.title')}
    >
      <div className="w-full max-w-sm text-center">
        <img
          src="/logo/logo-kr.webp"
          alt="탱고북"
          className="mx-auto mb-5 h-14 w-auto object-contain"
        />
        <h1 className="font-display text-2xl font-black leading-tight text-ink-900 break-keep">
          {t('entryGate.title')}
        </h1>
        <p className="mt-2 text-sm font-bold text-ink-600 break-keep">{t('entryGate.sub')}</p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            onClick={() => goAuth('signup')}
            className="w-full rounded-2xl bg-coral-500 px-5 py-3.5 font-black text-white shadow-pop transition hover:brightness-110"
          >
            {t('entryGate.signupBtn')}
            <span className="mt-0.5 block text-[11px] font-bold opacity-90 break-keep">
              {t('entryGate.signupNote')}
            </span>
          </button>

          <button
            onClick={() => goAuth('login')}
            className="min-h-[44px] w-full py-2 text-sm font-black text-ink-500 underline underline-offset-4 hover:text-ink-800"
          >
            {t('entryGate.loginBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
