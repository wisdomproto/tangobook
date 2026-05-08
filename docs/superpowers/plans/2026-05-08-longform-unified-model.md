# 롱폼 영상 통일 모델 (그림체 × 언어 매트릭스) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 chip(/editor2)의 그림체+언어 = 영상 탭의 단일 진실 소스로 통일. 한 시점에 `(그림체, 언어)` 매트릭스의 1 cell만 화면 표시. `parentProjectId` 폐기 → 모든 영상이 동등한 master.

**Architecture:**
- 데이터: `LongformProject` 의 `parentProjectId` 폐기 (lazy 마이그). 한 영상 = `(artStyle, language, scenes)`. 같은 그림체 다른 언어 영상끼리 scenes(clipUrl) 자동 share (새 master 생성 시 복제).
- UI: 그림체별 그룹 헤더(접고/펴고)는 유지. **펼치는 그룹은 1개만** (외부 chip 활성 그림체 = 자동 펼침, 다른 그룹 자동 접힘). 그룹 본체엔 그 그림체의 언어 칩 row + active 셀 본체. 외부 lang chip 누르면 그 셀로 전환. 셀 비어있으면 "+ {lang} 영상 만들기" CTA.

**Tech Stack:** 기존 그대로 (React 18, TypeScript, features/longform-video).

---

## 결정 (사용자 합의)

| # | 결정 | 선택 |
|---|---|---|
| 1 | 모달 언어 선택 | **빼기** — 외부 lang chip 이 활성 언어 결정. 모달은 그림체만. |
| 2 | 마이그 정책 | **lazy** — 첫 진입 시 자동 R2 write X. 사용자 액션(addMaster/addLang/updateProject) 시 inline. |
| 3 | accordion | **1 그룹만 펼침** — 외부 chip 활성 그림체. 다른 그림체 헤더 클릭 시 그쪽으로 전환. |
| 4 | scenes share | **자동** — 새 (그림체, 언어) cell 만들 때 같은 그림체 다른 언어 cell 의 scenes 복제 (clipUrl + sfxUrl + offset/volume 보존, ttsUrl/subtitles 비움). |
| 5 | 빈 cell CTA | **외부 chip 매칭 cell 없으면 그룹 본체 = "+ {lang} 영상 만들기" 큰 버튼 + 안내** |
| 6 | parentProjectId 마이그 | sub-master(parentProjectId 있는 영상) → 독립 master 로 lift. lift 시 master 의 artStyle 도 sub-master 에 cascade (이미 6/7 commit 완료) |

---

## 파일 구조

**Modify:**
- `packages/client/src/features/longform-video/lib/group-by-style.ts` — 마이그 헬퍼 + 그룹의 master 1개 강제 X (그림체별 여러 master 가능, 각 master = 1 언어)
- `packages/client/src/features/longform-video/components/LongformVideoTab.tsx` — accordion + activeCell `{ style, lang }` 모델
- `packages/client/src/features/longform-video/components/LongformProjectGroup.tsx` — 활성 그룹만 본체 노출 + 언어 칩 row + 빈 cell CTA
- `packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx` — 언어 select 제거, 그림체만
- `packages/shared/src/types/storybook.ts` — `LongformProject.parentProjectId` deprecated (코드상 폐기, 타입은 호환 위해 optional 유지)

**Create:**
- `packages/client/src/features/longform-video/lib/migrate-longform.ts` — `liftSubMasters(storybook, draftMutator)` lazy 마이그 헬퍼

**Touch (불변):**
- `LongformProjectHeader.tsx` — 그대로 (이름 + 삭제 + 작은 복사 아이콘 — 복사 아이콘은 더 이상 의미 없으니 별도 task 에서 제거 검토)
- Step 컴포넌트들 (`PromptAnalysisStep`, `VideoGenerationStep`, `TimelineEditorStep`, `RenderStep`) — `allProjects` prop 시그니처 그대로 (단일 cell 본체에 전달)

---

## Chunk 1: 데이터 모델 단순화 + 마이그 헬퍼

### Task 1: liftSubMasters 마이그 헬퍼

**Files:**
- Create: `packages/client/src/features/longform-video/lib/migrate-longform.ts`

- [ ] **Step 1: 헬퍼 작성**

```typescript
import type { Storybook, LongformProject } from '@tangobook/shared';

/**
 * parentProjectId 가 있는 sub-master 를 독립 master 로 lift.
 *  - parentProjectId 제거
 *  - artStyle 미지정이면 부모 master 의 artStyle 또는 storybook.artStyle 으로 채움
 *  - scenes/clipUrl/subtitles/ttsUrl 등 그대로 보존 (이미 사용자 작업물)
 *
 * 반환: 변경 발생 여부 (caller 가 onSave 트리거 결정)
 */
export function liftSubMasters(draft: Storybook): boolean {
  const projects = draft.longformProjects ?? [];
  if (projects.length === 0) return false;

  const projectsById = new Map(projects.map((p) => [p.id, p]));
  let changed = false;

  for (const p of projects) {
    if (!p.parentProjectId) continue;
    // artStyle cascade
    if (!p.artStyle) {
      const parent = projectsById.get(p.parentProjectId);
      p.artStyle = parent?.artStyle ?? draft.artStyle ?? draft.availableStyles?.[0];
    }
    // 독립 master 로 승격
    delete (p as { parentProjectId?: string }).parentProjectId;
    changed = true;
  }

  // master 도 artStyle 미지정이면 채움
  for (const p of projects) {
    if (p.parentProjectId) continue;
    if (!p.artStyle) {
      p.artStyle = draft.artStyle ?? draft.availableStyles?.[0];
      if (p.artStyle) changed = true;
    }
  }

  return changed;
}
```

- [ ] **Step 2: 호출처 결정 (lazy)**

`LongformVideoTab` 의 `updateProject`, `addMaster`, `addLanguageCell` 안에서 `onUpdate((d) => { liftSubMasters(d); ... })` 형태. 첫 진입 시 자동 X.

- [ ] **Step 3: typecheck**

```powershell
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/longform-video/lib/migrate-longform.ts
git commit -m "feat(longform): liftSubMasters helper for lazy parentProjectId migration"
```

---

### Task 2: group-by-style 재작성 (master 다중 보유)

**Files:**
- Modify: `packages/client/src/features/longform-video/lib/group-by-style.ts`

- [ ] **Step 1: 새 모델로 재작성**

```typescript
import type { LongformProject, Storybook } from '@tangobook/shared';

export const LEGACY_STYLE_ID = '__legacy';

/** 한 그림체 그룹 — 그 그림체의 master 들 (각 master = 1 언어) */
export interface StyleGroup {
  artStyle: string;
  label: string;
  /** 이 그림체의 master 들 (parentProjectId 폐기 후엔 모든 영상이 master) */
  masters: LongformProject[];
  /** 이 그림체에 존재하는 언어 → master */
  byLanguage: Record<string, LongformProject>;
  count: number;
  isEmpty: boolean;
}

/**
 * `(artStyle, language)` 매트릭스 시각화용. 같은 (artStyle, language) cell 에 master 1개 강제.
 *  - parentProjectId 가 남아있는 영상도 일단 그 자체 그림체로 분류 (마이그 후엔 안 보일 데이터)
 *  - artStyle 미지정 → '__legacy' 그룹 (마이그 후 사라짐)
 */
export function groupLongformByStyle(storybook: Storybook): StyleGroup[] {
  const projects = storybook.longformProjects ?? [];
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);
  const projectsById = new Map(projects.map((p) => [p.id, p]));

  // version 의 artStyle 은 master 따라감 (마이그 전 호환)
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
      // 같은 (artStyle, lang) cell 중복 시 최신 createdAt 우선 (보통은 1개)
      if (!byLanguage[lang]) byLanguage[lang] = p;
    }
    result.push({
      artStyle: style,
      label: style === LEGACY_STYLE_ID ? '그림체 미지정' : style,
      masters: Object.values(byLanguage),
      byLanguage,
      count: Object.keys(byLanguage).length,
      isEmpty: Object.keys(byLanguage).length === 0,
    });
  }

  // 정렬: 비어있지 않은 그룹 먼저, legacy 마지막
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
```

- [ ] **Step 2: typecheck**

```powershell
pnpm --filter @tangobook/client typecheck
```

(LongformProjectGroup / LongformVideoTab 의 타입 에러 다수 예상 — 다음 task 에서 수정)

- [ ] **Step 3: Commit (헬퍼만)**

```bash
git add packages/client/src/features/longform-video/lib/group-by-style.ts
git commit -m "refactor(longform): group-by-style returns by-language map (post-migration model)"
```

---

## Chunk 2: 단일 active cell 모드

### Task 3: LongformVideoTab — accordion + activeCell

**Files:**
- Modify: `packages/client/src/features/longform-video/components/LongformVideoTab.tsx`

핵심 변경:
- `activeProjectId` 대신 `activeCell: { style, lang } | null`
- `expandedStyle: string | null` — accordion (외부 chip 활성 그림체와 동기화)
- 외부 그림체 chip 변경 → `expandedStyle = externalStyle` + `activeCell.style = externalStyle`
- 외부 lang chip 변경 → `activeCell.lang = externalLang`
- `addMaster(style)` — 모달에서 그림체 선택 + 현재 외부 lang 으로 1 cell 생성. 같은 그림체 다른 언어 master 가 있으면 scenes 복제.
- `addLanguageCell(style, lang)` — 빈 cell CTA / amber 안내 버튼에서 호출. scenes share.

- [ ] **Step 1: 새 LongformVideoTab 작성** (전체 대체 — 약 200줄)

```typescript
import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo, useEffect } from 'react';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { groupLongformByStyle } from '../lib/group-by-style';
import { liftSubMasters } from '../lib/migrate-longform';
import { LongformProjectGroup } from './LongformProjectGroup';
import { AddLongformProjectModal } from './AddLongformProjectModal';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeProject(name: string, lang: string, artStyle?: string): Omit<LongformProject, 'id'> {
  return {
    name,
    aspectRatio: '16:9',
    language: lang,
    artStyle,
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 44,
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
  };
}

/** scenes 복제 — 같은 그림체 다른 언어 master 의 비디오 클립/SFX/타이밍 share, 텍스트 종속만 비움 */
function cloneScenesForNewLang(
  src: LongformProject['scenes'],
  langChanged: boolean
): LongformProject['scenes'] {
  return (src ?? []).map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    trimStart: undefined,
    trimEnd: undefined,
    sfxOffset: undefined,
    ttsOffset: undefined,
    ttsUrl: langChanged ? undefined : s.ttsUrl,
    ttsDuration: langChanged ? undefined : s.ttsDuration,
    subtitles: langChanged
      ? []
      : s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
  }));
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: Props) {
  const externalLang = useEditorLang();
  const externalStyle = storybook.artStyle;

  const allProjects = storybook.longformProjects ?? [];
  const groups = useMemo(() => groupLongformByStyle(storybook), [storybook]);

  // 활성 cell — 외부 chip 으로부터 derive
  const activeStyle = externalStyle ?? groups.find((g) => !g.isEmpty)?.artStyle ?? null;
  const activeLang = externalLang ?? 'ko';
  const activeProject =
    activeStyle != null
      ? (groups.find((g) => g.artStyle === activeStyle)?.byLanguage[activeLang] ?? null)
      : null;

  // accordion 펼친 그림체 — 외부 chip 따라가되 사용자가 헤더 클릭 시 override
  const [overrideExpanded, setOverrideExpanded] = useState<string | null>(null);
  const expandedStyle = overrideExpanded ?? activeStyle;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStyle, setModalDefaultStyle] = useState<string | undefined>(undefined);

  // 외부 chip 변경 시 override 초기화 (자동 따라가기 복원)
  useEffect(() => {
    setOverrideExpanded(null);
  }, [externalStyle]);

  const updateProject = (
    id: string,
    updates:
      | Partial<Omit<LongformProject, 'id'>>
      | ((proj: LongformProject) => void)
  ) => {
    onUpdate((d) => {
      liftSubMasters(d); // lazy 마이그
      const p = d.longformProjects?.find((x) => x.id === id);
      if (!p) return;
      if (typeof updates === 'function') updates(p);
      else {
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined) delete (p as unknown as Record<string, unknown>)[k];
          else (p as unknown as Record<string, unknown>)[k] = v;
        }
      }
    });
    onSave();
  };

  const deleteProject = (id: string) => {
    const target = allProjects.find((p) => p.id === id);
    if (!target) return;
    if (!window.confirm(`"${target.name}" 영상을 삭제하시겠습니까?`)) return;
    onUpdate((d) => {
      liftSubMasters(d);
      d.longformProjects = d.longformProjects?.filter((p) => p.id !== id);
    });
    onSave();
  };

  const addLanguageCell = (style: string, lang: string) => {
    const sameStyleProjects = allProjects.filter((p) => p.artStyle === style);
    const sourceProject =
      sameStyleProjects.find((p) => (p.language ?? 'ko') === 'ko') ?? sameStyleProjects[0];
    const id = `lf-${Date.now()}`;
    onUpdate((d) => {
      liftSubMasters(d);
      if (!d.longformProjects) d.longformProjects = [];
      const baseName = sourceProject?.name?.replace(/\s*\([^)]+\)\s*$/, '') ?? '새 동영상';
      const proj: LongformProject = {
        ...makeProject(`${baseName} (${lang})`, lang, style),
        id,
        bgmUrl: sourceProject?.bgmUrl,
        bgmVolume: sourceProject?.bgmVolume ?? 30,
        subtitleStyle: sourceProject?.subtitleStyle ?? makeProject('', lang, style).subtitleStyle,
      };
      if (sourceProject) {
        const langChanged = (sourceProject.language ?? 'ko') !== lang;
        proj.scenes = cloneScenesForNewLang(sourceProject.scenes, langChanged);
      }
      d.longformProjects.push(proj);
    });
    onSave();
  };

  const handleAddMaster = (style: string) => {
    // 모달 confirm — 그림체만 받음. 언어는 외부 chip.
    const lang = externalLang ?? 'ko';
    const id = `lf-${Date.now()}`;
    onUpdate((d) => {
      liftSubMasters(d);
      if (!d.longformProjects) d.longformProjects = [];
      // 같은 그림체 다른 언어 master 가 이미 있으면 그쪽에서 scenes 복제
      const sameStyle = d.longformProjects.find((p) => p.artStyle === style);
      const proj: LongformProject = { ...makeProject('새 동영상', lang, style), id };
      if (sameStyle) {
        const langChanged = (sameStyle.language ?? 'ko') !== lang;
        proj.scenes = cloneScenesForNewLang(sameStyle.scenes, langChanged);
        proj.bgmUrl = sameStyle.bgmUrl;
        proj.bgmVolume = sameStyle.bgmVolume;
        proj.subtitleStyle = sameStyle.subtitleStyle;
      }
      d.longformProjects.push(proj);
    });
    onSave();
    setModalOpen(false);
  };

  const openAddModal = (preselectStyle?: string) => {
    setModalDefaultStyle(preselectStyle ?? externalStyle);
    setModalOpen(true);
  };

  // 이미 (그림체, 외부 lang) cell 이 있는 그림체 = 모달에서 disabled
  const takenStyles = useMemo(
    () => groups.filter((g) => g.byLanguage[activeLang]).map((g) => g.artStyle),
    [groups, activeLang]
  );

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-sm">먼저 그림체를 등록한 뒤 영상을 만들 수 있어요.</p>
        <p className="text-xs mt-1">/editor2 에서 그림체를 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">동영상</h2>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            ({allProjects.length}개)
          </span>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 동영상
        </button>
      </div>

      {groups.map((g) => (
        <LongformProjectGroup
          key={g.artStyle}
          storybook={storybook}
          storybookId={storybook.id}
          group={g}
          expanded={expandedStyle === g.artStyle}
          onToggle={() =>
            setOverrideExpanded(expandedStyle === g.artStyle ? null : g.artStyle)
          }
          activeLang={activeLang}
          activeProject={g.artStyle === activeStyle ? activeProject : null}
          languages={storybook.languages ?? ['ko']}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onAddLanguage={(lang) => addLanguageCell(g.artStyle, lang)}
          onAddMaster={() => openAddModal(g.artStyle)}
        />
      ))}

      {modalOpen && (
        <AddLongformProjectModal
          storybook={storybook}
          takenStyles={takenStyles}
          defaultStyle={modalDefaultStyle}
          activeLang={activeLang}
          onClose={() => setModalOpen(false)}
          onConfirm={handleAddMaster}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: typecheck — 다른 컴포넌트 시그니처 안 맞아 fail 예상**

다음 task 에서 LongformProjectGroup + 모달 수정 시 PASS.

---

### Task 4: LongformProjectGroup — 1 cell 본체 + 언어 칩 row

**Files:**
- Modify: `packages/client/src/features/longform-video/components/LongformProjectGroup.tsx` (전체 재작성)

```typescript
import { useState } from 'react';
import type { Storybook, LongformProject } from '@tangobook/shared';
import type { StyleGroup } from '../lib/group-by-style';
import { LongformProjectHeader } from './LongformProjectHeader';
import { StepBar } from './StepBar';
import { PromptAnalysisStep } from './PromptAnalysisStep';
import { VideoGenerationStep } from './VideoGenerationStep';
import { TimelineEditorStep } from './TimelineEditorStep';
import { RenderStep } from './RenderStep';

interface Props {
  storybook: Storybook;
  storybookId: string;
  group: StyleGroup;
  /** 이 그룹이 펼쳐져 있는지 (accordion) */
  expanded: boolean;
  onToggle: () => void;
  /** 외부 활성 언어 — 본체에 표시할 cell 결정 */
  activeLang: string;
  /** 활성 cell 의 project — 외부에서 결정 (null = 빈 cell, "+ 영상 만들기" CTA) */
  activeProject: LongformProject | null;
  languages: string[];
  onUpdateProject: (
    id: string,
    updates:
      | Partial<Omit<LongformProject, 'id'>>
      | ((proj: LongformProject) => void)
  ) => void;
  onDeleteProject: (id: string) => void;
  onAddLanguage: (lang: string) => void;
  onAddMaster: () => void;
}

export function LongformProjectGroup({
  storybook,
  storybookId,
  group,
  expanded,
  onToggle,
  activeLang,
  activeProject,
  languages,
  onUpdateProject,
  onDeleteProject,
  onAddLanguage,
  onAddMaster,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);

  const header = (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          🎨 {group.label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({group.count}개 영상)
        </span>
      </div>
      <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
    </button>
  );

  if (!expanded) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
      </div>
    );
  }

  // 빈 그룹 → "+ 첫 영상 만들기" CTA
  if (group.isEmpty) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        <div className="p-6 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            아직 이 그림체로 만든 영상이 없어요.
          </p>
          <button
            onClick={onAddMaster}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + 이 그림체로 첫 영상 만들기 ({activeLang})
          </button>
        </div>
      </div>
    );
  }

  // 언어 칩 row
  const langRow = (
    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">언어</span>
      {languages.map((lang) => {
        const has = !!group.byLanguage[lang];
        const active = lang === activeLang;
        return (
          <button
            key={lang}
            onClick={() => {
              if (has && !active) {
                // 사용자가 언어 칩 직접 클릭 — 외부 chip 와 다른 언어로 둘러보기
                // (외부 chip 자체를 흔들지 않음. 단순 cell 전환은 못함. 그래서 disabled UX 또는 안내 만)
              }
              if (!has) onAddLanguage(lang);
            }}
            className={[
              'px-2 py-0.5 rounded text-[11px] font-bold border',
              active
                ? 'bg-sky-500 text-white border-sky-500'
                : has
                  ? 'bg-white text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
            ].join(' ')}
            title={!has ? `+ ${lang} 영상 만들기` : has && !active ? `상단 언어 chip 으로 ${lang} 활성` : ''}
          >
            {lang} {has ? '✓' : '+'}
          </button>
        );
      })}
    </div>
  );

  // 활성 cell 비어있음 → "+ {lang} 영상 만들기" 큰 CTA
  if (!activeProject) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        {langRow}
        <div className="p-6 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            이 그림체의 <strong>{activeLang}</strong> 영상이 아직 없어요.
          </p>
          <button
            onClick={() => onAddLanguage(activeLang)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + {activeLang} 영상 만들기
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            같은 그림체 다른 언어 영상이 있으면 비디오 클립을 자동으로 가져옵니다.
          </p>
        </div>
      </div>
    );
  }

  // 활성 cell 본체 — 1 master step UI
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {header}
      {langRow}
      <LongformProjectHeader
        project={activeProject}
        onUpdate={(patch) => onUpdateProject(activeProject.id, patch)}
        onDelete={() => onDeleteProject(activeProject.id)}
        onDuplicate={() => onAddLanguage(activeLang)}
        duplicateLabel="복사 (현재 cell 새로 만들기)"
      />
      <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />
      <div className="p-5">
        {currentStep === 1 && (
          <>
            <PromptAnalysisStep
              storybook={storybook}
              project={activeProject}
              onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            />
            {(activeProject.scenes?.length ?? 0) > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <VideoGenerationStep
                  storybook={storybook}
                  project={activeProject}
                  onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
                />
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <TimelineEditorStep
            storybook={storybook}
            project={activeProject}
            allProjects={[activeProject]}
            onSelectProject={() => {}}
            onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            onAddVersion={() => onAddLanguage(activeLang)}
          />
        )}

        {currentStep === 3 && (
          <RenderStep
            storybookId={storybookId}
            project={activeProject}
            allProjects={[activeProject]}
            onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            onUpdateProject={onUpdateProject}
            onSelectVersion={() => {}}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: 위 코드로 전체 대체**

- [ ] **Step 2: typecheck**

```powershell
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/longform-video/components/LongformProjectGroup.tsx \
        packages/client/src/features/longform-video/components/LongformVideoTab.tsx
git commit -m "refactor(longform): single-active-cell mode (style+lang accordion)"
```

---

### Task 5: AddLongformProjectModal — 언어 select 제거

**Files:**
- Modify: `packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx`

- [ ] **Step 1: 모달 단순화**

```typescript
import { useState, useEffect } from 'react';
import type { Storybook } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  takenStyles: string[]; // (스타일, activeLang) 이미 있는 그림체
  defaultStyle?: string;
  activeLang: string;
  onClose: () => void;
  onConfirm: (artStyle: string) => void;
}

export function AddLongformProjectModal({
  storybook, takenStyles, defaultStyle, activeLang, onClose, onConfirm,
}: Props) {
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);

  const initial =
    defaultStyle && !takenStyles.includes(defaultStyle)
      ? defaultStyle
      : (availableStyles.find((s) => !takenStyles.includes(s)) ?? availableStyles[0] ?? '');

  const [style, setStyle] = useState(initial);
  const [name, setName] = useState('');
  useEffect(() => setName(style ? `새 동영상 (${style})` : '새 동영상'), [style]);

  const isStyleTaken = takenStyles.includes(style);
  const canSubmit = !!style && !isStyleTaken;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">+ 새 동영상</h3>
          <span className="text-xs text-slate-500">언어: <strong>{activeLang}</strong> (상단 언어 chip)</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">그림체</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm dark:bg-slate-800 dark:text-slate-100"
          >
            {availableStyles.length === 0 && <option value="">(/editor2 에서 그림체 추가)</option>}
            {availableStyles.map((s) => {
              const taken = takenStyles.includes(s);
              return (
                <option key={s} value={s} disabled={taken}>
                  {s}{taken ? ` (${activeLang} 영상 이미 있음)` : ''}
                </option>
              );
            })}
          </select>
          {isStyleTaken && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              이 그림체의 {activeLang} 영상은 이미 있어요. 그룹 펼치면 보입니다.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">
            취소
          </button>
          <button
            onClick={() => onConfirm(style)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded font-bold"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: typecheck (전체 client)**

```powershell
pnpm --filter @tangobook/client typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx
git commit -m "refactor(longform): modal drops language picker (uses external lang chip)"
```

---

## Chunk 3: 검증 + 마무리

### Task 6: Browser preview 검증

**Sub-skill:** superpowers:verification-before-completion

- [ ] **Sce 1: Heidi (artStyle=paper-craft, languages=[ko,en], 영상 3개 with parentProjectId)**
  - 외부 chip = 🇰🇷 ko + paper-craft → paper-craft 그룹 펼침. 본체 = ko cell. 다른 그룹 접힘.
  - 외부 chip = 🇺🇸 en → 같은 paper-craft 그룹 안 en cell 로 본체 자동 전환 (이전 commit으로 이미 있음).
  - 외부 chip = pixar-3d 그림체 swap → paper-craft 그룹 자동 접힘 + pixar-3d 그룹 펼침. 본체 = "+ 이 그림체로 첫 영상" CTA.
  - "+ 새 동영상" 모달: paper-craft = "(ko 영상 이미 있음)" disabled. pixar-3d/watercolor 선택 가능. 만들기 → scenes 자동 share (paper-craft master scenes 복제, 한국어 그대로).
  - Step 1 분석 화면에서 페이지별 영상이 그 그림체 cell 의 scenes 만 표시 (다른 그림체 영상 안 보임).

- [ ] **Sce 2: 잭과 콩나무 (paper-craft + pixar-3d + watercolor + ko + en)**
  - 외부 chip 그림체 swap 시 본체가 즉시 그 그림체로 전환.
  - 같은 그림체 ko ↔ en chip 누르면 같은 그룹 안 cell 전환.

- [ ] **Sce 3: /editor (v1) 호환**
  - externalLang = null → activeLang = 'ko' default.
  - externalStyle = storybook.artStyle (그대로).
  - 사용자가 그룹 헤더 직접 클릭으로 펼침 가능.

- [ ] **dev preview 직접 검증** (preview_eval / preview_screenshot)

---

### Task 7: 최종 commit + push

- [ ] **Step 1: lint (errors 만 — 기존 부채 X)**

```powershell
pnpm lint 2>&1 | grep -i "error" | grep -v "warning"
```

Expected: 내 새 파일 (group-by-style, migrate-longform, LongformProjectGroup, LongformVideoTab, AddLongformProjectModal) 에 새 errors 없음.

- [ ] **Step 2: CLAUDE.md / Memory 업데이트**

```
## 그림체 × 언어 매트릭스 (2026-05-08, 2차)
parentProjectId 폐기. 한 영상 = (artStyle, language). 외부 chip 단일 진실 소스.
화면에 활성 그림체 그룹 1개만 펼침 (accordion). 본체 = 외부 lang 활성 cell.
빈 cell = "+ {lang} 영상 만들기" 큰 CTA. scenes 자동 share (같은 그림체 다른 언어).
lazy 마이그 (liftSubMasters): 사용자 액션 시 sub-master → 독립 master.
```

- [ ] **Step 3: 통합 commit + push**

```bash
git add -u && git commit -m "docs(longform): unified style×lang matrix + lazy migration"
git push origin claude/heuristic-bardeen-e19a9e
```

---

## 미해결 (사후 검토)

- 같은 그림체로 master 여러 개 (현재는 (그림체, 언어) cell 당 1개. 예: paper-craft ko 영상 2개 만들기 = 다른 동화 영상). MVP scope 밖.
- LongformProjectHeader 의 작은 복사 아이콘은 이제 의미 없으니 (`onDuplicate=onAddLanguage(activeLang)` = 같은 cell 복제 무의미) 별도 PR 에서 제거 검토.
