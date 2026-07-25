import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// i18n 초기화 — useTranslation 을 쓰는 컴포넌트가 테스트에서 ko 원문을 그대로 렌더하도록.
// 🔴 jsdom navigator.language='en-US' 라 detectLang 이 'en' 을 고름(텍스트는 ko 폴백이라 안 보였음).
// i18n.language 를 직접 읽는 로직(예: useAccess 해외 무료 게이트)이 정상 동작하도록 ko 로 고정.
import i18n from '@/i18n';
await i18n.changeLanguage('ko');

// jsdom doesn't implement canvas context; stub it for libraries that touch
// canvas at import time (e.g. lottie-web reads fillStyle during module init).
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as HTMLCanvasElement['getContext'];
}

// jsdom doesn't implement HTMLMediaElement.play/pause — it throws "Not implemented"
// and returns undefined, so callers doing `audio.play().catch(...)` blow up during
// commit and take the whole render down (AppBgm did this to every AppShell test).
// Return a resolved promise so autoplay-with-fallback code paths behave.
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
}

// jsdom doesn't implement window.matchMedia at all. Components that call it
// unguarded (MobileLandscapeGate, RewardScreen) throw inside their mount effect and
// take the whole render down. matches:false = desktop / fine pointer / no
// reduced-motion, which is the right default for jsdom (no rotate gate).
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })) as unknown as typeof window.matchMedia;
}

// Mock lottie-react — it imports lottie-web which trips over jsdom's canvas stub.
// In tests we only care that PNG/emoji fallback paths render; Lottie rendering is
// verified manually in Phase A QA.
vi.mock('lottie-react', () => ({
  default: () => null,
}));
