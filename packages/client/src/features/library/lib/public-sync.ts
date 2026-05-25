import type { Storybook } from '@tangobook/shared';

function getBookStyles(sb: Storybook): string[] {
  return sb.availableStyles && sb.availableStyles.length > 0 ? sb.availableStyles : [sb.artStyle];
}

function getBookLangs(sb: Storybook): string[] {
  return sb.languages && sb.languages.length > 0 ? sb.languages : ['ko'];
}

/**
 * 셀(`publicByStyleLang`) 토글 후 책 단위 `isPublic` 자동 동기화.
 *
 * - 책의 가능한 모든 `(그림체, 언어)` 조합이 모두 false 면 → `isPublic = false`
 * - 하나라도 true 면 → `isPublic = true` (자동 회복)
 *
 * 호출처: BookMatrixModal 의 셀 토글, LevelEditCard 헤더 체크박스 토글.
 */
export function syncBookPublicAfterCellToggle(sb: Storybook): Storybook {
  const styles = getBookStyles(sb);
  const langs = getBookLangs(sb);
  const allFalse = styles.every((s) =>
    langs.every((l) => sb.publicByStyleLang?.[s]?.[l] === false)
  );
  const nextPublic = !allFalse;
  if (sb.isPublic === nextPublic) return sb;
  return { ...sb, isPublic: nextPublic };
}

/**
 * 책 단위 `isPublic` 토글 시 `publicByStyleLang` 일괄 동기화.
 *
 * - `next=false` → 책의 모든 `(그림체, 언어)` 조합을 명시적 false 로 마킹
 * - `next=true` → `publicByStyleLang` clear (모두 default true 로 회복)
 *
 * 호출처: useCategoryActions.setBookPublic (책 카드의 👁 토글).
 */
export function applyBookPublic(sb: Storybook, next: boolean): Storybook {
  if (next) {
    const clone: Storybook = { ...sb, isPublic: true };
    delete clone.publicByStyleLang;
    return clone;
  }
  const styles = getBookStyles(sb);
  const langs = getBookLangs(sb);
  const matrix: Record<string, Record<string, boolean>> = {};
  styles.forEach((s) => {
    matrix[s] = {};
    langs.forEach((l) => {
      matrix[s][l] = false;
    });
  });
  return { ...sb, isPublic: false, publicByStyleLang: matrix };
}
