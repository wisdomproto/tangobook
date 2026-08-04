/**
 * PWA "홈에 설치" 지원 — `beforeinstallprompt` 이벤트를 앱 초기에 가로채 보관하고,
 * 설치 버튼에서 꺼내 쓴다. (이벤트는 React 마운트 전에 올 수 있어 모듈 로드 시점에 리스너 등록 —
 * main.tsx 에서 이 모듈을 import 해 조기 등록.)
 *
 * 설치 조건(HTTPS + manifest + fetch 핸들러 있는 서비스워커)은 이미 충족(sw.js). iOS Safari 는
 * beforeinstallprompt 미지원이라 버튼에서 "공유 → 홈 화면에 추가" 안내로 폴백한다.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/**
 * GA4 이벤트 발화 (설치 수 집계용). 내부/테스트 계정은 index.html 의 ga-disable +
 * __tbNoTrack 로 이미 차단되므로 여기선 방어적으로 한 번 더 확인만 한다.
 */
function fireGaEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || window.__tbNoTrack) return;
  window.gtag?.('event', name, params);
}

/** 홈에서 실행(standalone) 중이면 세션당 1회 pwa_standalone 발화 (iOS 설치 추정용). */
function trackStandaloneOnce(): void {
  if (typeof window === 'undefined' || !isStandalone()) return;
  try {
    if (sessionStorage.getItem('tb_pwa_standalone_tracked')) return;
    sessionStorage.setItem('tb_pwa_standalone_tracked', '1');
  } catch {
    /* ignore */
  }
  fireGaEvent('pwa_standalone');
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // 브라우저 기본 미니 배너 억제 → 우리 버튼으로 유도
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    fireGaEvent('pwa_install'); // 실제 설치 완료(Android/데스크톱 Chrome) — iOS 미발화
    notify();
  });
  trackStandaloneOnce();
}

/**
 * 모바일(터치) 기기인지. 설치 안내(PWA)와 TV 미러링 안내가 **같은 기준**을 쓴다 —
 * 둘 다 "폰·태블릿에서만 뜻이 있는 안내"라 판정이 갈리면 한쪽만 안 보이는 일이 생긴다.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    !!window.matchMedia?.('(pointer: coarse)').matches ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

/** 설치 프롬프트가 준비됐는지 (Chrome/Android/데스크탑). */
export function canInstall(): boolean {
  return deferred !== null;
}

/** 설치 가능 상태 변화 구독 — 언구독 함수 반환. */
export function subscribeInstall(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 네이티브 설치 프롬프트 표시. 수락 시 true. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  if (outcome === 'accepted') {
    deferred = null;
    notify();
  }
  return outcome === 'accepted';
}

/** 이미 설치된(스탠드얼론) 상태로 실행 중인가 → 버튼 숨김용. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** iOS(Safari) 여부 — beforeinstallprompt 미지원이라 수동 안내 필요. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}
