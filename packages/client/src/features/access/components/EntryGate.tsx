import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startGuestMode, markAuthChoice } from '../lib/guest-mode';

interface Props {
  /** 게스트 30일이 끝나 다시 뜬 경우 — 가입 벽 카피로 바뀌고 "게스트로 둘러보기"가 사라진다. */
  expired?: boolean;
  onChoose: () => void;
}

/**
 * 첫 진입 선택 화면 — 모바일 게임식 온보딩.
 *   게스트로 둘러보기 (30일 무료, 학습 기록은 로컬)  /  회원가입(1년 무료)  /  로그인
 *
 * 게스트 30일이 만료되면 같은 게이트가 **가입 벽**으로 재등장한다(게스트 버튼 없음).
 * 🔴 소프트 게이트 — 앵커가 localStorage 라 캐시를 지우면 리셋된다(의도적으로 눈감음).
 */
export function EntryGate({ expired = false, onChoose }: Props) {
  const { t } = useTranslation('access');
  const navigate = useNavigate();

  const goAuth = (mode: 'signup' | 'login') => {
    markAuthChoice();
    onChoose();
    navigate(mode === 'signup' ? '/login?mode=signup' : '/login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-gradient-to-b from-cream-50 to-peach-100 p-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={t(expired ? 'entryGate.expiredTitle' : 'entryGate.title')}
    >
      <div className="w-full max-w-sm text-center">
        <img
          src="/logo/logo-kr.webp"
          alt="탱고북"
          className="mx-auto mb-5 h-14 w-auto object-contain"
        />
        <h1 className="font-display text-2xl font-black leading-tight text-ink-900 break-keep">
          {t(expired ? 'entryGate.expiredTitle' : 'entryGate.title')}
        </h1>
        <p className="mt-2 text-sm font-bold text-ink-600 break-keep">
          {t(expired ? 'entryGate.expiredSub' : 'entryGate.sub')}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          {/* 회원가입 — 1년 무료가 가장 강한 훅이라 항상 최상단(만료 시엔 유일한 진행 경로). */}
          <button
            onClick={() => goAuth('signup')}
            className="w-full rounded-2xl bg-coral-500 px-5 py-3.5 font-black text-white shadow-pop transition hover:brightness-110"
          >
            {t('entryGate.signupBtn')}
            <span className="mt-0.5 block text-[11px] font-bold opacity-90 break-keep">
              {t('entryGate.signupNote')}
            </span>
          </button>

          {!expired && (
            <button
              onClick={() => {
                startGuestMode();
                onChoose();
              }}
              className="w-full rounded-2xl border-2 border-ink-100 bg-white px-5 py-3.5 font-black text-ink-700 shadow-soft transition hover:border-coral-200"
            >
              {t('entryGate.guestBtn')}
              <span className="mt-0.5 block text-[11px] font-bold text-ink-500 break-keep">
                {t('entryGate.guestNote')}
              </span>
            </button>
          )}

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
