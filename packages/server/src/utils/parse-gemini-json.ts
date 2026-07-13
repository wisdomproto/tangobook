import { AppError } from '../middleware/error.middleware.js';

/**
 * Gemini API 텍스트 응답에서 JSON을 추출하고 파싱.
 * ```json ... ``` 펜스를 벗기고, 배열(`[...]`)·객체(`{...}`) 중 **먼저 나오는 종류**를
 * 그 종류의 마지막 닫힘까지 추출한다.
 *
 * 🔴 과거 버그: 객체 정규식(`{...}`)을 배열 정규식(`[...]`)보다 먼저 시도해,
 * `[{...},{...}]` 같은 배열 응답에서 바깥 `[]` 를 잘라먹고 파싱 실패했음.
 */
export function parseGeminiJSON<T>(raw: string, errorMsg: string): T {
  try {
    // 1) ```json ... ``` 또는 ``` ... ``` 펜스 벗기기
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const body = (fence ? fence[1] : raw).trim();

    // 2) 배열/객체 중 먼저 등장하는 것을 그 종류의 마지막 닫힘까지 슬라이스
    //    (배열이 객체보다 앞서면 바깥 [] 유지 — 이게 옛 버그의 핵심 수정)
    const obj = body.indexOf('{');
    const arr = body.indexOf('[');
    let candidate = body;
    if (arr !== -1 && (obj === -1 || arr < obj)) {
      candidate = body.slice(arr, body.lastIndexOf(']') + 1);
    } else if (obj !== -1) {
      candidate = body.slice(obj, body.lastIndexOf('}') + 1);
    }
    return JSON.parse(candidate) as T;
  } catch {
    throw new AppError(500, errorMsg);
  }
}
