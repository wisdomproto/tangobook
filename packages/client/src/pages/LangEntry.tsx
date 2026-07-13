import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { setUiLanguage, AVAILABLE_UI_LANGS, hasExplicitUiLang } from '@/i18n';

/**
 * 언어별 진입 링크 — tangobook.co.kr/en · /vi · /zh · /th · /ko.
 * 해당 언어로 UI(그리고 책 기본 언어)를 설정한 뒤 라이브러리로 진입.
 * 언어는 localStorage(`tangobook-ui-lang`)에 남아 이후 세션에도 유지.
 *
 * 해외 유저에게 `tangobook.co.kr/en` 같은 주소를 주면 그 언어로 시작한다.
 * 지원 안 하는 세그먼트는 그냥 라이브러리로 폴백(정적 라우트는 이 라우트보다 우선 매칭).
 */
export function LangEntry() {
  const { lang } = useParams<{ lang: string }>();
  const supported = !!lang && AVAILABLE_UI_LANGS.includes(lang);
  // 사용자가 언어를 직접 고른 적이 있으면 URL 프리픽스가 덮어쓰지 않음 — 그의 선택 유지.
  const skipOverride = supported && hasExplicitUiLang();
  // 언어 로케일 로드 완료 후 진입 — 라이브러리가 이전 언어로 잠깐 떴다 바뀌는 깜빡임 방지.
  const [ready, setReady] = useState(!supported || skipOverride);
  useEffect(() => {
    if (!supported || !lang || skipOverride) return;
    void setUiLanguage(lang).finally(() => setReady(true));
  }, [lang, supported, skipOverride]);
  if (!ready) return null;
  return <Navigate to="/library" replace />;
}
