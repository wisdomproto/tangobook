import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';

interface Props {
  mode: 'signin' | 'signup';
}

type Provider = 'kakao' | 'google' | 'facebook';

/**
 * 페이스북 로그인 노출 스위치. Supabase 에 Facebook provider(+ Meta 앱) 설정이 끝나면 true.
 * 🔴 false 인 동안 비-ko 로케일은 구글만 노출(이메일은 항상 별도) — 설정 안 된 페북 버튼이
 *    에러 나는 것 방지. (오픈은 구글+이메일로 충분, 페북은 후속.)
 */
const FACEBOOK_LOGIN_ENABLED = false;

/**
 * 소셜 로그인 버튼 (공용) — **로케일별 provider 노출**.
 * - 한국어(ko) UI: 카카오 + 구글 (카카오는 한국 전용)
 * - 그 외 언어: 구글 + 페이스북 (Facebook = 전세계 소셜로그인 1위·동남아 최강)
 * 이메일/비번은 별도(범용 안전망)라 이 컴포넌트 밖에서 항상 노출.
 *
 * 뒤단 entitlement 는 provider 무관 하나로 통일 — Supabase 네이티브 OAuth 로 위임,
 * 복귀는 /login/callback 의 detectSessionInUrl 이 자동 처리. 로고는 인라인 SVG.
 * (2단계: 태국·대만 LINE, iOS 네이티브 시 Apple — memory overseas-login-strategy-2026-07-13)
 */
export function SocialAuthButtons({ mode }: Props) {
  const { t, i18n } = useTranslation('auth');
  const [busy, setBusy] = useState<Provider | null>(null);

  // 한국어 UI = 카카오+구글, 그 외 = 구글(+페이스북 준비되면). 구글은 어디서나, 이메일은 항상 별도.
  const providers: Provider[] =
    i18n.language === 'ko'
      ? ['kakao', 'google']
      : FACEBOOK_LOGIN_ENABLED
        ? ['google', 'facebook']
        : ['google'];

  const run = async (provider: Provider, fn: () => Promise<void>) => {
    setBusy(provider);
    try {
      await fn();
      // 성공 시 외부로 리다이렉트되므로 setBusy(null) 도달 안 함
    } catch (err) {
      alert(err instanceof Error ? err.message : t('social.error'));
      setBusy(null);
    }
  };

  const label = (provider: Provider) =>
    mode === 'signup' ? t(`social.${provider}SignUp`) : t(`social.${provider}SignIn`);

  const config: Record<
    Provider,
    { fn: () => Promise<void>; className: string; logo: ReactElement }
  > = {
    kakao: {
      fn: authApi.signInWithKakao,
      className: 'bg-[#FEE500] text-[#191600] hover:brightness-95',
      logo: <KakaoLogo />,
    },
    google: {
      fn: authApi.signInWithGoogle,
      className: 'bg-white border-2 border-ink-100 text-ink-900 hover:bg-ink-50',
      logo: <GoogleLogo />,
    },
    facebook: {
      fn: authApi.signInWithFacebook,
      className: 'bg-[#1877F2] text-white hover:brightness-95',
      logo: <FacebookLogo />,
    },
  };

  return (
    <div className="flex flex-col gap-3">
      {providers.map((p) => {
        const c = config[p];
        return (
          <button
            key={p}
            onClick={() => run(p, c.fn)}
            disabled={busy !== null}
            className={`h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60 transition ${c.className}`}
          >
            {c.logo}
            {label(p)}
          </button>
        );
      })}
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

function FacebookLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 36 36" aria-hidden="true">
      <path
        fill="#fff"
        d="M20.9 35.7V22.9h4.3l.8-5H20.9v-3.2c0-1.4.5-2.6 2.7-2.6h2.4V7.6c-.4-.1-1.9-.2-3.6-.2-3.6 0-6 2.2-6 6.2v3.5h-4v5h4v12.8z"
      />
    </svg>
  );
}
