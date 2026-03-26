/**
 * Promise에 타임아웃을 적용하는 헬퍼.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${context}: 요청 타임아웃 (${Math.round(ms / 1000)}초)`)),
      ms
    );
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/**
 * Gemini API 호출에 대한 공통 재시도 래퍼.
 * Exponential backoff + jitter로 재시도.
 * 각 시도에 타임아웃 적용 (기본 120초).
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number; context?: string; timeoutMs?: number } = {}
): Promise<T> {
  const { retries = 5, baseDelayMs = 1000, context = 'Gemini', timeoutMs = 120_000 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await withTimeout(fn(), timeoutMs, context);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('이미지 생성 실패') ||
        msg.includes('오디오 데이터가 없습니다') ||
        msg.includes('요청 타임아웃');
      if (!isRetryable || attempt === retries) throw err;
      // Exponential backoff: 1s, 2s, 4s, 8s... + jitter (0~500ms)
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.warn(
        `[${context}] 재시도 ${attempt}/${retries} (${(delay / 1000).toFixed(1)}초 후): ${msg.slice(0, 120)}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${context}: 최대 재시도 횟수 초과`);
}
