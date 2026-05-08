import type { LongformProject, Storybook } from '@tangobook/shared';

export const LEGACY_STYLE_ID = '__legacy';

/** 한 그림체 그룹 — 그 그림체의 master 들. 마이그 후엔 cell = (artStyle, language) 쌍. */
export interface StyleGroup {
  artStyle: string;
  label: string;
  /** 이 그림체의 모든 영상 (마이그 후엔 모든 영상이 master) */
  masters: LongformProject[];
  /** 이 그림체에 존재하는 (lang → master). 같은 cell 중복 시 첫 번째 유지. */
  byLanguage: Record<string, LongformProject>;
  count: number;
  isEmpty: boolean;
}

/**
 * `(artStyle, language)` 매트릭스 시각화용 그룹핑.
 *  - storybook.availableStyles + 영상이 등장한 그림체 모두 포함 (영상 0개 그룹도 노출)
 *  - artStyle 미지정 + parentProjectId 있음 → 부모 따라감 (마이그 전 호환)
 *  - 그래도 미지정 → '__legacy'
 */
export function groupLongformByStyle(storybook: Storybook): StyleGroup[] {
  const projects = storybook.longformProjects ?? [];
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  const styleOf = (p: LongformProject): string => {
    if (p.artStyle) return p.artStyle;
    if (p.parentProjectId) {
      const parent = projectsById.get(p.parentProjectId);
      if (parent?.artStyle) return parent.artStyle;
    }
    return LEGACY_STYLE_ID;
  };

  const styleSet = new Set<string>(availableStyles);
  for (const p of projects) styleSet.add(styleOf(p));

  const result: StyleGroup[] = [];
  for (const style of styleSet) {
    const inStyle = projects.filter((p) => styleOf(p) === style);
    const byLanguage: Record<string, LongformProject> = {};
    for (const p of inStyle) {
      const lang = p.language ?? 'ko';
      if (!byLanguage[lang]) byLanguage[lang] = p;
    }
    const langKeys = Object.keys(byLanguage);
    result.push({
      artStyle: style,
      label: style === LEGACY_STYLE_ID ? '그림체 미지정' : style,
      masters: Object.values(byLanguage),
      byLanguage,
      count: langKeys.length,
      isEmpty: langKeys.length === 0,
    });
  }

  // 정렬: 비어있지 않은 그룹 먼저, legacy 마지막, 그 외 availableStyles 순
  result.sort((a, b) => {
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
    if (a.artStyle === LEGACY_STYLE_ID) return 1;
    if (b.artStyle === LEGACY_STYLE_ID) return -1;
    const aIdx = availableStyles.indexOf(a.artStyle);
    const bIdx = availableStyles.indexOf(b.artStyle);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  return result;
}
