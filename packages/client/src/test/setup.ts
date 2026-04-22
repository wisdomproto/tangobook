import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom doesn't implement canvas context; stub it for libraries that touch
// canvas at import time (e.g. lottie-web reads fillStyle during module init).
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => null
  ) as unknown as HTMLCanvasElement['getContext'];
}

// Mock lottie-react — it imports lottie-web which trips over jsdom's canvas stub.
// In tests we only care that PNG/emoji fallback paths render; Lottie rendering is
// verified manually in Phase A QA.
vi.mock('lottie-react', () => ({
  default: () => null,
}));
