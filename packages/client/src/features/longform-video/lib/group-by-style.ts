import type { LongformProject, Storybook } from '@tangobook/shared';

export const LEGACY_STYLE_ID = '__legacy';

export interface StyleGroup {
  /** 그림체 id. legacy 면 '__legacy'. */
  artStyle: string;
  /** 표시용 라벨 (그림체 id 와 동일하거나 사람 친화적). */
  label: string;
  /** master 들 (parentProjectId 없는 영상) */
  masters: LongformProject[];
  /** master.id → versions[] (parentProjectId === master.id) */
  versionsByMaster: Record<string, LongformProject[]>;
  /** 영상 갯수 (master + versions) */
  count: number;
  /** 빈 그룹 여부 (영상 0개) */
  isEmpty: boolean;
}

/**
 * `storybook.longformProjects` 를 `artStyle` 기준 그룹으로 분류.
 *  - `storybook.availableStyles` 의 모든 그림체 (영상 0개여도 빈 그룹으로 노출)
 *  - + 기존 영상에만 있는 그림체 (legacy 마이그 전 데이터)
 *  - 영상 `artStyle` 미지정 → '__legacy' 그룹
 *
 * 정렬: 영상 있는 그룹 먼저 → availableStyles 순서 → legacy 마지막.
 */
export function groupLongformByStyle(storybook: Storybook): StyleGroup[] {
  const projects = storybook.longformProjects ?? [];
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);

  // 1. 등장하는 모든 artStyle 수집
  const styleSet = new Set<string>(availableStyles);
  for (const p of projects) {
    styleSet.add(p.artStyle ?? LEGACY_STYLE_ID);
  }

  // 2. 그림체별로 master + versions 분리
  const result: StyleGroup[] = [];
  for (const style of styleSet) {
    const inStyle = projects.filter((p) => (p.artStyle ?? LEGACY_STYLE_ID) === style);
    const masters = inStyle.filter((p) => !p.parentProjectId);
    const versionsByMaster: Record<string, LongformProject[]> = {};
    for (const m of masters) {
      versionsByMaster[m.id] = inStyle.filter((p) => p.parentProjectId === m.id);
    }
    result.push({
      artStyle: style,
      label: style === LEGACY_STYLE_ID ? '그림체 미지정' : style,
      masters,
      versionsByMaster,
      count: inStyle.length,
      isEmpty: inStyle.length === 0,
    });
  }

  // 3. 정렬
  result.sort((a, b) => {
    if (a.artStyle === LEGACY_STYLE_ID) return 1;
    if (b.artStyle === LEGACY_STYLE_ID) return -1;
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
    const aIdx = availableStyles.indexOf(a.artStyle);
    const bIdx = availableStyles.indexOf(b.artStyle);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  return result;
}
