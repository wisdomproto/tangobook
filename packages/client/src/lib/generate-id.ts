/**
 * 짧은 랜덤 ID를 생성합니다.
 * @param prefix - ID 접두어 (예: 'sec', 'slide'). 있으면 `prefix-xxxxx` 형태.
 */
export function generateId(prefix?: string): string {
  const suffix = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${suffix}` : suffix;
}
