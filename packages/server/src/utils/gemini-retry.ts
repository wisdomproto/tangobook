/**
 * Gemini API 호출에 대한 공통 재시도 래퍼.
 * 503/UNAVAILABLE/429/RESOURCE_EXHAUSTED 에러에 대해 자동 재시도.
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; context?: string } = {}
): Promise<T> {
  const { retries = 3, baseDelayMs = 3000, context = 'Gemini' } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED');
      if (!isRetryable || attempt === retries) throw err;
      const delay = attempt * baseDelayMs;
      console.warn(
        `[${context}] 일시적 오류 (attempt ${attempt}/${retries}), ${delay / 1000}초 후 재시도: ${msg.slice(0, 100)}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${context}: 최대 재시도 횟수 초과`);
}
