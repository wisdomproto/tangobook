/**
 * 파닉스 학습 진척 (localStorage).
 *
 * 키: `phonics-progress` → `{ [lang]: { [unitId]: { completedActivities: string[] } } }`.
 *
 * 진척 모델:
 *   - 액티비티 완료 시 `markActivityCompleted(lang, unitId, activityKey)`.
 *   - 다음 액티비티는 이전 액티비티 완료 시 unlock.
 *   - 다음 unit 은 이 unit 의 `requiredActivities` 모두 완료 시 unlock.
 *
 * 첫 unit 은 항상 unlocked. 그 외는 이전 unit completed 일 때만.
 */
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'phonics-progress';

export type PhonicsLang = 'korean' | 'english';

interface UnitProgress {
  completedActivities: string[];
}

type ProgressShape = Partial<Record<PhonicsLang, Record<string, UnitProgress>>>;

function read(): ProgressShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as ProgressShape;
    return {};
  } catch {
    return {};
  }
}

function write(p: ProgressShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    // 다른 탭/페이지 동기화용 커스텀 이벤트
    window.dispatchEvent(new CustomEvent('phonics-progress:change'));
  } catch {
    /* quota 초과 등 무시 */
  }
}

export function getUnitProgress(lang: PhonicsLang, unitId: string): UnitProgress {
  return read()[lang]?.[unitId] ?? { completedActivities: [] };
}

export function markActivityCompleted(
  lang: PhonicsLang,
  unitId: string,
  activityKey: string
): void {
  const all = read();
  const langMap = { ...(all[lang] ?? {}) };
  const cur = langMap[unitId] ?? { completedActivities: [] };
  if (cur.completedActivities.includes(activityKey)) return; // 멱등
  langMap[unitId] = { completedActivities: [...cur.completedActivities, activityKey] };
  write({ ...all, [lang]: langMap });
}

export function isActivityCompleted(
  lang: PhonicsLang,
  unitId: string,
  activityKey: string
): boolean {
  return getUnitProgress(lang, unitId).completedActivities.includes(activityKey);
}

/**
 * unit 이 완료 상태인지 (`requiredActivities` 모두 완료).
 * required 가 비어있으면 (= unit 설정 없음) false — 작업되지 않은 unit 은 unlock gate 통과 X.
 */
export function isUnitCompleted(
  lang: PhonicsLang,
  unitId: string,
  requiredActivities: readonly string[]
): boolean {
  if (requiredActivities.length === 0) return false;
  const prog = getUnitProgress(lang, unitId);
  return requiredActivities.every((k) => prog.completedActivities.includes(k));
}

/**
 * React hook — 진척 변경 시 자동 rerender.
 * 같은 탭 안에서 `markActivityCompleted` 호출 후 즉시 반영.
 */
export function usePhonicsProgress(lang: PhonicsLang): {
  isActivityDone: (unitId: string, activityKey: string) => boolean;
  unitCompletedActivities: (unitId: string) => string[];
  markDone: (unitId: string, activityKey: string) => void;
  isUnitDone: (unitId: string, requiredActivities: readonly string[]) => boolean;
} {
  const [, force] = useState({});
  useEffect(() => {
    const handler = () => force({});
    window.addEventListener('phonics-progress:change', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('phonics-progress:change', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const isActivityDone = useCallback(
    (unitId: string, activityKey: string) => isActivityCompleted(lang, unitId, activityKey),
    [lang]
  );
  const unitCompletedActivities = useCallback(
    (unitId: string) => getUnitProgress(lang, unitId).completedActivities,
    [lang]
  );
  const markDone = useCallback(
    (unitId: string, activityKey: string) => markActivityCompleted(lang, unitId, activityKey),
    [lang]
  );
  const isUnitDone = useCallback(
    (unitId: string, requiredActivities: readonly string[]) =>
      isUnitCompleted(lang, unitId, requiredActivities),
    [lang]
  );

  return { isActivityDone, unitCompletedActivities, markDone, isUnitDone };
}
