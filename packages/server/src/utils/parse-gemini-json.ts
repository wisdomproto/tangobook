import { AppError } from '../middleware/error.middleware.js';

/**
 * Gemini API 텍스트 응답에서 JSON을 추출하고 파싱.
 * ```json ... ``` 블록 또는 raw JSON 객체/배열을 자동 감지.
 */
export function parseGeminiJSON<T>(raw: string, errorMsg: string): T {
  try {
    const jsonMatch =
      raw.match(/```json\n?([\s\S]*?)\n?```/) ??
      raw.match(/(\{[\s\S]*\})/) ??
      raw.match(/(\[[\s\S]*\])/);
    return JSON.parse(jsonMatch?.[1] ?? raw) as T;
  } catch {
    throw new AppError(500, errorMsg);
  }
}
