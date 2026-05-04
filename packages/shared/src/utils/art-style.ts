import { ART_STYLES } from '../constants/index.js';

/**
 * 그림체 raw 문자열 (ART_STYLES.id 또는 prompt 전체) → canonical id 로 정규화.
 * 같은 그림체가 두 가지 형태로 들어와도 같은 버킷으로 합치기 위함.
 *
 * - ART_STYLES[].id 와 정확히 일치하면 그대로 반환 (이미 canonical)
 * - ART_STYLES[].prompt 와 일치하면 해당 id 반환
 * - prompt 의 prefix 30자 가 일치하면 해당 id 반환 (긴 prompt 의 일부만 들어온 경우)
 * - 매칭 실패 시 raw 그대로 반환 (custom 그림체)
 */
export function canonicalizeArtStyle(raw: string): string {
  if (!raw) return raw;
  const lower = raw.toLowerCase();

  // 1) ART_STYLES.id 일 경우
  const byId = ART_STYLES.find((s) => s.id === raw);
  if (byId) return byId.id;

  // 2) prompt 전체로 들어온 경우 (v1 artStyle 의 prompt 형태)
  const byPrompt = ART_STYLES.find((s) => s.prompt.toLowerCase() === lower);
  if (byPrompt) return byPrompt.id;

  // 3) prompt 가 길어서 일부만 들어온 경우 (예: "Paper craft, layered..." prefix 매칭)
  const byPromptPrefix = ART_STYLES.find(
    (s) => lower.startsWith(s.prompt.toLowerCase().slice(0, 30)) && s.prompt.length > 20
  );
  if (byPromptPrefix) return byPromptPrefix.id;

  // 매칭 실패 — 그대로 반환 (custom 그림체)
  return raw;
}

/**
 * 그림체 raw 문자열 → 사용자 친화 한국어 라벨.
 * - preset 매칭 시 ART_STYLES.label (예: '종이공예', '3D 픽사')
 * - 매칭 실패 (custom) 시 raw 그대로 반환
 *
 * BookDetail / BookCards / Editor 등에서 chip 노출 시 사용.
 * (raw 가 prompt 전체이면 학습자 화면에 부적합)
 */
export function getArtStyleLabel(raw: string): string {
  if (!raw) return raw;
  const id = canonicalizeArtStyle(raw);
  return ART_STYLES.find((s) => s.id === id)?.label ?? raw;
}

/**
 * styleAssets 객체의 키들을 canonical id 로 정규화.
 * 동일 그림체가 2 키 (id + prompt) 로 분리되어 있으면 머지.
 *
 * 머지 규칙: 두 버킷의 자산 (coverImages / characterImages / pageIllustrations / keyObjectImages 등)
 * 을 합칠 때, 비어있지 않은 값을 우선. 둘 다 비어있지 않으면 canonical id 쪽 우선.
 *
 * 반환값은 새로운 객체 — 입력 변경 X.
 */
export function canonicalizeStyleAssets<T>(
  styleAssets: Record<string, T> | undefined
): Record<string, T> {
  if (!styleAssets) return {};

  const result: Record<string, T> = {};
  // 처리 순서: canonical id 가 이미 있는 키를 먼저 (그게 base 가 되고, prompt 형태가 머지됨)
  const sortedKeys = Object.keys(styleAssets).sort((a, b) => {
    const aIsCanon = ART_STYLES.some((s) => s.id === a);
    const bIsCanon = ART_STYLES.some((s) => s.id === b);
    if (aIsCanon && !bIsCanon) return -1;
    if (!aIsCanon && bIsCanon) return 1;
    return 0;
  });

  for (const key of sortedKeys) {
    const canonicalKey = canonicalizeArtStyle(key);
    const value = styleAssets[key];
    if (!result[canonicalKey]) {
      // 객체면 얕은 복사, 그 외 (예: 원시) 그대로
      result[canonicalKey] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? ({ ...(value as object) } as T)
          : value;
      continue;
    }
    // 머지 — 빈 값을 비-빈 값으로 채움
    const existing = result[canonicalKey] as Record<string, unknown>;
    const incoming = value as Record<string, unknown>;
    if (existing && typeof existing === 'object' && incoming && typeof incoming === 'object') {
      for (const [field, v] of Object.entries(incoming)) {
        const cur = existing[field];
        const isEmpty =
          cur == null ||
          (Array.isArray(cur) && cur.length === 0) ||
          (typeof cur === 'object' && !Array.isArray(cur) && Object.keys(cur).length === 0);
        if (isEmpty) existing[field] = v;
      }
    }
  }
  return result;
}
