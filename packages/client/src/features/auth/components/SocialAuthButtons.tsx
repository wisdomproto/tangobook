import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';

interface Props {
  mode: 'signin' | 'signup';
}

/**
 * 카카오 + 구글 소셜 로그인 버튼 (공용).
 * Supabase 네이티브 OAuth provider 로 위임 — 클릭 시 외부 동의 화면으로
 * 리다이렉트되고, 복귀는 /login/callback 에서 detectSessionInUrl 이 자동 처리한다.
 * 로고는 공식 브랜드 가이드 색상의 인라인 SVG (외부 자산 의존 없음).
 */
export function SocialAuthButtons({ mode }: Props) {
  const { t } = useTranslation('auth');
  const [busy, setBusy] = useState<'kakao' | 'google' | null>(null);

  const run = async (provider: 'kakao' | 'google', fn: () => Promise<void>) => {
    setBusy(provider);
    try {
      await fn();
      // 성공 시 외부로 리다이렉트되므로 setBusy(null) 도달 안 함
    } catch (err) {
      alert(err instanceof Error ? err.message : t('social.error'));
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => run('kakao', authApi.signInWithKakao)}
        disabled={busy !== null}
        className="h-14 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-lg flex items-center justify-center gap-3 hover:brightness-95 disabled:opacity-60 transition"
      >
        <KakaoLogo />
        {mode === 'signup' ? t('social.kakaoSignUp') : t('social.kakaoSignIn')}
      </button>
      <button
        onClick={() => run('google', authApi.signInWithGoogle)}
        disabled={busy !== null}
        className="h-14 rounded-xl bg-white border-2 border-ink-100 text-ink-900 font-bold text-lg flex items-center justify-center gap-3 hover:bg-ink-50 disabled:opacity-60 transition"
      >
        <GoogleLogo />
        {mode === 'signup' ? t('social.googleSignUp') : t('social.googleSignIn')}
      </button>
    </div>
  );
}

function KakaoLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 256 256" aria-hidden="true">
      <path
        fill="#191600"
        d="M128 36C70.56 36 24 72.89 24 118.4c0 29.41 19.45 55.2 48.72 69.78-1.61 5.6-10.34 35.7-10.69 38.07 0 0-.21 1.79.95 2.47s2.69.15 2.69.15c3.34-.47 38.7-25.3 44.82-29.6 5.7.81 11.56 1.23 17.51 1.23 57.44 0 104-36.89 104-82.4S185.44 36 128 36"
      />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48"
      />
    </svg>
  );
}
