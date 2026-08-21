import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { setUiLanguage, AVAILABLE_UI_LANGS, hasExplicitUiLang } from '@/i18n';
import { useAuth } from '@/features/auth/context/AuthContext';

/**
 * 언어별 진입 링크 — tangobook.co.kr/en · /vi · /zh · /th · /ko.
 * 해당 언어로 UI를 설정한 뒤 라이브러리로 진입. (SEO 언어 페이지는 서버 SSR `/:lang/library/:id/about`
 * 등이 따로 담당 — 이 클라 라우트는 "그 언어로 시작하기" 편의 링크일 뿐.)
 *
 * 🔴 규칙 (2026-07-13): **이미 언어가 정해진 사용자는 URL 프리픽스로 안 바꾼다.**
 *   - explicit(셀렉터로 직접 고름) 이거나 **로그인 사용자**(자기 언어 유지)면 링크 무시 → 현재 언어 유지.
 *   - 링크로 언어를 바꾸는 건 **신규·미로그인 방문자 온보딩**(해외 마케팅 `/vi` 링크 등)만.
 *   봇/크롤러는 미로그인·비explicit 라 `/en`=영어로 정상 동작(SEO 유지).
 *   (기존: 기본 한국어 유저가 `/en` 링크 한 번에 영어로 영구 전환되던 문제 해결.)
 *
 * `?to=<내부경로>` — 언어 설정 후 이동할 목적지(기본 `/library`). 다국어 블로그의
 *   "동화책 보러가기" CTA 가 `/en?to=/library/:id` 로 걸어, 영어 블로그 독자가
 *   영어로 설정된 책 상세로 가게 한다. 오픈 리다이렉트 방지로 내부 경로만 허용.
 */
export function LangEntry() {
  const { lang } = useParams<{ lang: string }>();
  const [params] = useSearchParams();
  // 🔴 **기본 도착지 = 루트**(2026-08-21) — 루트가 소개 페이지가 됐고 그 페이지가 5개 언어로
  //    번역되면서, 해외 마케팅 링크(`/vi`)가 곧장 `/library` 로 가면 **그 언어로 된 설명을
  //    한 줄도 못 보고** 책장부터 본다. `?to=` 로 지정한 링크(블로그 CTA 등)는 그대로 존중한다.
  const rawTo = params.get('to') || '/';
  const to = rawTo.startsWith('/') && !rawTo.startsWith('//') ? rawTo : '/';
  const { account, loading } = useAuth();
  const supported = !!lang && AVAILABLE_UI_LANGS.includes(lang);
  // 이미 언어를 정한 사용자 = 직접 고름(explicit) 또는 로그인. 링크는 이들을 덮어쓰지 않음.
  const hasPreference = hasExplicitUiLang() || !!account;
  const shouldSet = supported && !hasPreference;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return; // 로그인 여부 확정 전엔 판단 보류(깜빡임·오판 방지)
    if (!shouldSet || !lang) {
      setReady(true);
      return;
    }
    void setUiLanguage(lang).finally(() => setReady(true));
  }, [loading, shouldSet, lang]);

  if (loading || !ready) return null;
  return <Navigate to={to} replace />;
}
