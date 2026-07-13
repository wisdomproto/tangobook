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

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // 브라우저 기본 미니 배너 억제 → 우리 버튼으로 유도
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
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
