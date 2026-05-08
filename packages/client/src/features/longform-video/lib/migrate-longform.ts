import type { Storybook } from '@tangobook/shared';

/**
 * `parentProjectId` 가 있는 sub-master 를 독립 master 로 lift.
 *  - parentProjectId 제거
 *  - artStyle 미지정이면 부모 master / storybook.artStyle / availableStyles[0] 으로 cascade
 *  - scenes/clipUrl/subtitles/ttsUrl 등 기존 데이터 그대로 보존
 *
 * 호출 시점: 사용자 액션(addMaster/addLang/updateProject) 시 inline. 자동 R2 write X.
 */
export function liftSubMasters(draft: Storybook): boolean {
  const projects = draft.longformProjects ?? [];
  if (projects.length === 0) return false;

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  let changed = false;
  const fallbackStyle = draft.artStyle ?? draft.availableStyles?.[0];

  for (const p of projects) {
    if (p.parentProjectId) {
      // artStyle cascade from parent
      if (!p.artStyle) {
        const parent = projectsById.get(p.parentProjectId);
        p.artStyle = parent?.artStyle ?? fallbackStyle;
      }
      // 독립 master 로 승격
      delete (p as { parentProjectId?: string }).parentProjectId;
      changed = true;
    } else if (!p.artStyle && fallbackStyle) {
      // master 도 artStyle 미지정이면 채움
      p.artStyle = fallbackStyle;
      changed = true;
    }
  }

  return changed;
}
