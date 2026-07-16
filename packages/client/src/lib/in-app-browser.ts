/**
 * 인앱 브라우저(인스타그램·페이스북·스레드·라인 등 WebView) 감지.
 *
 * 🔴 카카오·구글 OAuth 는 임베디드 WebView 에서 막힌다 — 카카오는 정책상 인앱 로그인을
 * 차단하고, 구글은 `disallowed_useragent` 에러를 낸다. 인스타 프로필 링크로 유입된
 * 사용자가 소셜 가입을 시도하면 인증 후 앱으로 돌아오는 리다이렉트가 완성되지 않는다.
 * → 로그인 화면에서 감지 시 "외부 브라우저에서 열기" 안내를 띄운다.
 */

/** Instagram/Facebook/Threads/Line 등 알려진 인앱 WebView UA 패턴. */
const IN_APP_UA =
  /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Line\/|Threads|NAVER\(inapp|Snapchat|Pinterest|Twitter|musical_ly|Bytedance|TikTok|DaumApps|everytimeApp|WhatsApp|WeChat|MicroMessenger/i;

export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return IN_APP_UA.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * 안드로이드 인앱 WebView 에서 현재 URL 을 Chrome 으로 넘긴다(intent 스킴).
 * iOS 는 프로그램적으로 Safari 를 열 방법이 없어 false 반환 → 호출부가 수동 안내로 폴백.
 */
export function openInExternalBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isAndroid()) return false;
  const noProto = window.location.href.replace(/^https?:\/\//, '');
  window.location.href = `intent://${noProto}#Intent;scheme=https;package=com.android.chrome;end`;
  return true;
}
