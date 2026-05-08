# 롱폼 영상 그림체별 그룹화 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 롱폼 영상 탭을 그림체(artStyle)별 collapsible 그룹으로 재구성하고, 그림체별로 별도 master 영상을 보유할 수 있게 한다. 그룹 안에서는 기존 master+version(언어) 모델 유지.

**Architecture:**
- 데이터 모델: `LongformProject.artStyle?: string` 필드 추가 (optional, backward compat).
- UI: `LongformVideoTab`이 `artStyle` 기준 그룹으로 reduce → 각 그룹 = `LongformProjectGroup` (collapsible header + 본체).
- 새 영상 추가 = `AddLongformProjectModal` (그림체 선택 + 자동 이름).
- 외부 그림체 chip(/editor2)은 storybook 자산 swap 동작은 그대로 유지하되, 영상 탭 안에서는 해당 그룹 자동 펼침으로 연동.

**Tech Stack:** React 18 + TypeScript, Zustand v5(클라 UI 상태), 기존 features/longform-video 폴더 패턴 그대로.

---

## 핵심 의사결정 (default — 사용자 redirect 가능)

| # | 결정 포인트 | Default 선택 | 이유 |
|---|---|---|---|
| 1 | 그림체별 master 갯수 | **그림체당 master 1개** | "그림체 그룹 안에서는 언어만 추가" 사용자 요청. 같은 그림체 영상 추가 = 새 lang version. |
| 2 | 외부 그림체 chip 동작 | 그림체 swap(기존)은 유지, **영상 탭에서는 해당 그림체 그룹만 자동 펼침** | 영상은 자산 swap 영향 없음. chip 위치 강조용. |
| 3 | 빈 그림체 그룹 표시 | **`storybook.availableStyles` 의 모든 그림체 + 기존 영상 그림체** 표시. 영상 0개 그룹은 헤더 + "이 그림체로 첫 영상 만들기" CTA만 | 사용자가 어디로든 영상 추가할 수 있게. |
| 4 | Default expand 상태 | **외부 chip 활성 그림체 1개만 펼침**, 나머지 접힘. 영상 있는 그룹 우선. | 화면 복잡도 ↓. |
| 5 | 마이그레이션 | 기존 `artStyle` 미지정 longformProjects → 그룹핑 시 `'__legacy'` fallback. 첫 save 시 `storybook.artStyle` 또는 그 시점 active 그림체로 자동 채움 | 데이터 손실 X. R2 211+권 호환. |
| 6 | 같은 그림체 master 중복 방지 | 모달의 그림체 select 에서 **이미 master 있는 그림체는 disable + "이미 있음 (versions 추가는 그룹 헤더에서)"** | 사용자가 헷갈리지 않게. |
| 7 | /editor (v1) UX | 외부 chip 없으니 `__legacy` 그룹 1개만 보이거나, storybook.artStyle 기반 단일 그룹. **모달 동작은 v1/v2 동일** | 같은 컴포넌트 재사용. |

---

## 파일 구조

**Modify:**
- `packages/shared/src/types/storybook.ts:964-982` — `LongformProject` 에 `artStyle?: string` 추가
- `packages/client/src/features/longform-video/components/LongformVideoTab.tsx` — 전면 재구성 (그룹 렌더 + 모달)
- `packages/client/src/features/longform-video/index.ts` — 신규 컴포넌트 export 추가 시

**Create:**
- `packages/client/src/features/longform-video/lib/group-by-style.ts` — 그룹핑 헬퍼 (순수 함수 + 단위 test 가능)
- `packages/client/src/features/longform-video/components/LongformProjectGroup.tsx` — 그림체별 collapsible 그룹
- `packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx` — 새 영상 추가 모달

**Touch (불변):**
- `packages/client/src/features/longform-video/components/LongformProjectHeader.tsx` — 그대로 (master + version 안에서만 사용)
- `packages/client/src/features/longform-video/components/{PromptAnalysisStep,VideoGenerationStep,TimelineEditorStep,RenderStep}.tsx` — 그대로 (project prop 만 받음)

---

## Chunk 1: 데이터 모델 + 그룹핑 헬퍼

### Task 1: LongformProject 타입에 artStyle 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts:964-982`

- [ ] **Step 1: artStyle 필드 추가**

`LongformProject` interface 에 optional 필드 추가:

```typescript
export interface LongformProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  language: string;
  /** 이 영상이 어느 그림체로 만들어졌는지 (그룹핑 키). 미지정 시 legacy 그룹. */
  artStyle?: string;
  promptPresetId?: string;
  // ... 나머지 그대로
}
```

- [ ] **Step 2: typecheck 통과 확인**

```powershell
pnpm --filter @tangobook/shared typecheck
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/server typecheck
```

Expected: 모두 PASS (optional 필드라 기존 코드 영향 없음).

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "feat(types): add LongformProject.artStyle for style-based grouping"
```

---

### Task 2: 그룹핑 헬퍼 (순수 함수)

**Files:**
- Create: `packages/client/src/features/longform-video/lib/group-by-style.ts`

- [ ] **Step 1: 헬퍼 작성**

```typescript
import type { LongformProject, Storybook } from '@tangobook/shared';

export interface StyleGroup {
  /** 그림체 id. legacy 면 '__legacy'. */
  artStyle: string;
  /** 표시용 라벨 (그림체 id 와 동일하거나 사람 친화적). */
  label: string;
  /** master + 그 versions (parentProjectId === master.id) */
  masters: LongformProject[];
  /** 해당 그림체의 versions (parent 별 lookup 용). master/key=master.id */
  versionsByMaster: Record<string, LongformProject[]>;
  /** 영상 갯수 (master + versions) */
  count: number;
  /** 빈 그룹 여부 */
  isEmpty: boolean;
}

/**
 * artStyle 기준 그룹핑.
 *  - storybook.availableStyles 의 모든 그림체 (영상 0개여도 빈 그룹으로 노출)
 *  - + 기존 영상에만 있는 그림체 (legacy 마이그 전 데이터)
 *  - 영상 artStyle 미지정 → '__legacy' 그룹
 */
export function groupLongformByStyle(storybook: Storybook): StyleGroup[] {
  const projects = storybook.longformProjects ?? [];
  const availableStyles = storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);

  // 1. 등장하는 모든 artStyle 수집 (availableStyles 우선 + 기존 영상)
  const styleSet = new Set<string>(availableStyles);
  for (const p of projects) {
    styleSet.add(p.artStyle ?? '__legacy');
  }

  // 2. 그림체별로 master + versions 분리
  const result: StyleGroup[] = [];
  for (const style of styleSet) {
    const inStyle = projects.filter((p) => (p.artStyle ?? '__legacy') === style);
    const masters = inStyle.filter((p) => !p.parentProjectId);
    const versionsByMaster: Record<string, LongformProject[]> = {};
    for (const m of masters) {
      versionsByMaster[m.id] = inStyle.filter((p) => p.parentProjectId === m.id);
    }
    result.push({
      artStyle: style,
      label: style === '__legacy' ? '그림체 미지정' : style,
      masters,
      versionsByMaster,
      count: inStyle.length,
      isEmpty: inStyle.length === 0,
    });
  }

  // 3. 정렬: 영상 있는 그룹 먼저 → availableStyles 순서 → legacy 마지막
  result.sort((a, b) => {
    if (a.artStyle === '__legacy') return 1;
    if (b.artStyle === '__legacy') return -1;
    if (a.isEmpty !== b.isEmpty) return a.isEmpty ? 1 : -1;
    const aIdx = availableStyles.indexOf(a.artStyle);
    const bIdx = availableStyles.indexOf(b.artStyle);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  return result;
}
```

- [ ] **Step 2: 직접 검증 (이 프로젝트엔 client 단위 test 인프라 없음)**

기존 책 1권 (예: 잭과 콩나무 `1772510956605`) 의 storybook 데이터로 그룹핑 결과를 콘솔에 찍어 확인:
- v2 책 (paper-craft + pixar-3d) → 2개 그룹 (각 영상 0~N개) + legacy 0개
- 기존 v1 책 (artStyle 만, longformProjects.artStyle 미지정) → availableStyles 그룹 1개 (영상 0개) + `__legacy` 그룹 1개 (영상 N개)

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/longform-video/lib/group-by-style.ts
git commit -m "feat(longform): add groupLongformByStyle helper"
```

---

## Chunk 2: 그림체 그룹 컴포넌트

### Task 3: LongformProjectGroup (collapsible)

**Files:**
- Create: `packages/client/src/features/longform-video/components/LongformProjectGroup.tsx`

- [ ] **Step 1: 컴포넌트 골격 작성**

```typescript
import { useState } from 'react';
import type { Storybook, LongformProject } from '@tangobook/shared';
import type { StyleGroup } from '../lib/group-by-style';
import { LongformProjectHeader } from './LongformProjectHeader';
import { StepBar } from './StepBar';
// ... 기존 step 컴포넌트들

interface Props {
  storybook: Storybook;
  group: StyleGroup;
  defaultExpanded: boolean;
  // master 의 첫 항목을 활성. 사용자 클릭 시 master 전환.
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Omit<LongformProject, 'id'>>) => void;
  onDeleteProject: (id: string) => void;
  onAddVersion: (masterId: string, lang?: string) => void;
  onAddMaster: () => void; // 빈 그룹의 "이 그림체로 첫 영상" CTA
}

export function LongformProjectGroup({
  storybook, group, defaultExpanded,
  activeProjectId, onSelectProject,
  onUpdateProject, onDeleteProject, onAddVersion, onAddMaster,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [currentStep, setCurrentStep] = useState(1);

  // 그룹의 첫 master 또는 selectedMaster
  const masters = group.masters;
  const selectedMaster = masters.find((m) => m.id === activeProjectId) ?? masters[0] ?? null;
  const versions = selectedMaster
    ? [selectedMaster, ...(group.versionsByMaster[selectedMaster.id] ?? [])]
    : [];
  const activeVersion = versions.find((v) => v.id === activeProjectId) ?? versions[0] ?? null;

  // 헤더
  const header = (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
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

  if (!expanded) return <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">{header}</div>;

  // 빈 그룹 → CTA
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
            + 이 그림체로 첫 영상 만들기
          </button>
        </div>
      </div>
    );
  }

  // master 가 있는 그룹 → 기존 master+version UX 그대로 렌더 (StepBar + 4 step)
  // 단, "버전 추가" 큰 버튼을 헤더 손톱 아이콘 대신 안내 영역에 명시 표시
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {header}
      {selectedMaster && (
        <div>
          <LongformProjectHeader
            project={selectedMaster}
            onUpdate={(patch) => onUpdateProject(selectedMaster.id, patch)}
            onDelete={() => onDeleteProject(selectedMaster.id)}
            onDuplicate={() => onAddVersion(selectedMaster.id)}
            duplicateLabel="버전 추가"
          />
          {/* 언어 버전 칩 row + "+ 다른 언어 버전 만들기" 큰 버튼 (Task 5 에서 채움) */}
          <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />
          <div className="p-5">
            {/* Step 1/2/3 — 기존 LongformVideoTab 의 동작 그대로 import 해서 위임 */}
            {/* (Task 5 에서 마저 채움) */}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

```powershell
pnpm --filter @tangobook/client typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit (구조만)**

```bash
git add packages/client/src/features/longform-video/components/LongformProjectGroup.tsx
git commit -m "feat(longform): scaffold LongformProjectGroup (collapsible header + empty-state CTA)"
```

---

### Task 4: AddLongformProjectModal

**Files:**
- Create: `packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx`

- [ ] **Step 1: 모달 작성**

```typescript
import { useState, useEffect } from 'react';
import type { Storybook } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  /** 같은 그림체 master 중복 방지: 이미 master 있는 그림체 id 들. */
  takenStyles: string[];
  /** Default 그림체 (외부 chip 활성 또는 storybook.artStyle). */
  defaultStyle?: string;
  defaultLang?: string;
  onClose: () => void;
  onConfirm: (artStyle: string, lang: string, name: string) => void;
}

export function AddLongformProjectModal({
  storybook, takenStyles, defaultStyle, defaultLang = 'ko', onClose, onConfirm,
}: Props) {
  const availableStyles =
    storybook.availableStyles ?? (storybook.artStyle ? [storybook.artStyle] : []);
  const [style, setStyle] = useState(defaultStyle ?? availableStyles.find((s) => !takenStyles.includes(s)) ?? availableStyles[0] ?? '');
  const [lang, setLang] = useState(defaultLang);
  const [name, setName] = useState('');

  useEffect(() => {
    setName(`새 동영상${style ? ` (${style})` : ''}`);
  }, [style]);

  const langs = storybook.languages ?? ['ko'];
  const isStyleTaken = takenStyles.includes(style);
  const canSubmit = style && !isStyleTaken;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">+ 새 동영상</h3>

        {/* 그림체 select */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">그림체</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
          >
            {availableStyles.length === 0 && <option value="">(그림체 없음 — /editor2 에서 추가하세요)</option>}
            {availableStyles.map((s) => {
              const taken = takenStyles.includes(s);
              return (
                <option key={s} value={s} disabled={taken}>
                  {s}{taken ? ' (이미 영상 있음)' : ''}
                </option>
              );
            })}
          </select>
          {isStyleTaken && (
            <p className="mt-1 text-xs text-amber-600">이 그림체 영상은 이미 있어요. 그룹에서 "버전 추가" 로 다른 언어를 추가하세요.</p>
          )}
        </div>

        {/* 언어 select */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">언어</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
          >
            {langs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            취소
          </button>
          <button
            onClick={() => onConfirm(style, lang, name)}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: typecheck + Commit**

```powershell
pnpm --filter @tangobook/client typecheck
```

```bash
git add packages/client/src/features/longform-video/components/AddLongformProjectModal.tsx
git commit -m "feat(longform): add AddLongformProjectModal (style + lang + name)"
```

---

## Chunk 3: LongformVideoTab 재구성 + 외부 chip 동기화

### Task 5: LongformVideoTab 전면 재구성

**Files:**
- Modify: `packages/client/src/features/longform-video/components/LongformVideoTab.tsx` (전체 재작성)

핵심 변경:
- `masterProjects[0]` 제약 제거 → 그림체별 그룹 렌더
- `groupLongformByStyle` 호출
- `+ 새 동영상` 버튼 → `AddLongformProjectModal`
- 외부 chip 활성 그림체 그룹 자동 펼침
- 외부 lang chip → 활성 master 안에서 매칭 version 자동 선택 (기존 로직 그대로)

- [ ] **Step 1: 새 LongformVideoTab 작성**

전체 코드 (현재 파일 대체):

```typescript
import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo, useEffect } from 'react';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { groupLongformByStyle } from '../lib/group-by-style';
import { LongformProjectGroup } from './LongformProjectGroup';
import { AddLongformProjectModal } from './AddLongformProjectModal';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeDefaultProject(name: string, lang: string, artStyle?: string): Omit<LongformProject, 'id'> {
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

export function LongformVideoTab({ storybook, onUpdate, onSave }: Props) {
  const externalLang = useEditorLang();
  const externalStyle = storybook.artStyle; // /editor2 외부 chip 으로 swap 시 storybook.artStyle 이 갱신됨

  const groups = useMemo(() => groupLongformByStyle(storybook), [storybook]);
  const takenStyles = useMemo(
    () => groups.filter((g) => g.masters.length > 0).map((g) => g.artStyle),
    [groups]
  );

  // 활성 project (master 또는 version)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 외부 lang 변경 시 활성 master 의 매칭 version 자동 선택
  useEffect(() => {
    if (!externalLang || !activeProjectId) return;
    const all = storybook.longformProjects ?? [];
    const cur = all.find((p) => p.id === activeProjectId);
    if (!cur) return;
    const masterId = cur.parentProjectId ?? cur.id;
    const master = all.find((p) => p.id === masterId);
    if (!master) return;
    const versions = [master, ...all.filter((p) => p.parentProjectId === masterId)];
    const match = versions.find((v) => (v.language ?? 'ko') === externalLang);
    if (match && match.id !== activeProjectId) setActiveProjectId(match.id);
  }, [externalLang, activeProjectId, storybook.longformProjects]);

  // 영상 0개 → 안내
  const totalProjects = storybook.longformProjects?.length ?? 0;
  if (totalProjects === 0 && groups.every((g) => g.isEmpty)) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-sm">동영상 제작 프로젝트가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + 새 동영상
          </button>
        </div>
        {showAddModal && (
          <AddLongformProjectModal
            storybook={storybook}
            takenStyles={takenStyles}
            defaultStyle={externalStyle}
            defaultLang={externalLang ?? 'ko'}
            onClose={() => setShowAddModal(false)}
            onConfirm={(artStyle, lang, name) => {
              const id = `lf-${Date.now()}`;
              onUpdate((d) => {
                if (!d.longformProjects) d.longformProjects = [];
                d.longformProjects.push({ ...makeDefaultProject(name, lang, artStyle), id });
              });
              onSave();
              setActiveProjectId(id);
              setShowAddModal(false);
            }}
          />
        )}
      </div>
    );
  }

  // helpers
  const updateProject = (id: string, updates: Partial<Omit<LongformProject, 'id'>>) => {
    onUpdate((d) => {
      const p = d.longformProjects?.find((x) => x.id === id);
      if (!p) return;
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined) delete (p as any)[k];
        else (p as any)[k] = v;
      }
    });
    onSave();
  };
  const deleteProject = (id: string) => {
    const target = storybook.longformProjects?.find((p) => p.id === id);
    if (!target) return;
    const isVersion = !!target.parentProjectId;
    const msg = isVersion
      ? `"${target.name}" 버전 삭제?`
      : `"${target.name}" 영상과 모든 버전 삭제?`;
    if (!window.confirm(msg)) return;
    onUpdate((d) => {
      d.longformProjects = d.longformProjects?.filter((p) =>
        isVersion ? p.id !== id : p.id !== id && p.parentProjectId !== id
      );
    });
    onSave();
    if (activeProjectId === id) setActiveProjectId(null);
  };
  const addVersion = (masterId: string, overrideLang?: string) => {
    const all = storybook.longformProjects ?? [];
    const master = all.find((p) => p.id === masterId);
    if (!master) return;
    const newId = `lf-${Date.now()}`;
    const targetLang = overrideLang ?? externalLang ?? master.language ?? 'ko';
    const langChanged = targetLang !== (master.language ?? 'ko');
    const baseName = (master.name ?? '새 동영상').replace(/\s*\([^)]+\)\s*$/, '');
    onUpdate((d) => {
      if (!d.longformProjects) d.longformProjects = [];
      const m = d.longformProjects.find((p) => p.id === masterId);
      if (!m) return;
      const clone = structuredClone(m);
      clone.id = newId;
      clone.parentProjectId = masterId;
      clone.language = targetLang;
      clone.name = `${baseName} (${targetLang})`;
      clone.outputUrl = undefined;
      clone.youtubeUpload = undefined;
      clone.createdAt = undefined;
      clone.scenes = (clone.scenes ?? []).map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        trimStart: undefined,
        trimEnd: undefined,
        sfxOffset: undefined,
        ttsOffset: undefined,
        ttsUrl: langChanged ? undefined : s.ttsUrl,
        ttsDuration: langChanged ? undefined : s.ttsDuration,
        subtitles: langChanged ? [] : s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
      }));
      d.longformProjects.push(clone);
    });
    onSave();
    setActiveProjectId(newId);
  };

  // 첫 active project 자동 설정 (외부 chip 활성 그룹의 master)
  useEffect(() => {
    if (activeProjectId) return;
    const targetGroup =
      groups.find((g) => !g.isEmpty && g.artStyle === externalStyle) ??
      groups.find((g) => !g.isEmpty);
    if (targetGroup?.masters[0]) setActiveProjectId(targetGroup.masters[0].id);
  }, [groups, externalStyle, activeProjectId]);

  return (
    <div className="space-y-3">
      {/* 상단: + 새 동영상 큰 버튼 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">동영상 ({totalProjects})</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
        >
          + 새 동영상
        </button>
      </div>

      {/* 그림체 그룹들 */}
      {groups.map((g) => (
        <LongformProjectGroup
          key={g.artStyle}
          storybook={storybook}
          group={g}
          defaultExpanded={g.artStyle === externalStyle || (!externalStyle && !g.isEmpty)}
          activeProjectId={activeProjectId}
          onSelectProject={setActiveProjectId}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onAddVersion={addVersion}
          onAddMaster={() => {
            // 빈 그룹 CTA → 모달을 그 그림체 default 로 열기
            setShowAddModal(true);
          }}
        />
      ))}

      {showAddModal && (
        <AddLongformProjectModal
          storybook={storybook}
          takenStyles={takenStyles}
          defaultStyle={externalStyle}
          defaultLang={externalLang ?? 'ko'}
          onClose={() => setShowAddModal(false)}
          onConfirm={(artStyle, lang, name) => {
            const id = `lf-${Date.now()}`;
            onUpdate((d) => {
              if (!d.longformProjects) d.longformProjects = [];
              d.longformProjects.push({ ...makeDefaultProject(name, lang, artStyle), id });
            });
            onSave();
            setActiveProjectId(id);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: LongformProjectGroup 마무리 — 본체에 StepBar + 4 step 위임**

`LongformProjectGroup.tsx` 의 본체 (master 있는 케이스) 안에 기존 StepBar/PromptAnalysisStep/VideoGenerationStep/TimelineEditorStep/RenderStep 을 옮긴다 (현재 LongformVideoTab.tsx 의 line 244~289 코드 그대로 이동). 또한 안내 영역에 "+ 다른 언어 버전 만들기" 큰 버튼을 외부 lang 활성 + 매칭 없을 때 표시.

- [ ] **Step 3: typecheck**

```powershell
pnpm --filter @tangobook/client typecheck
```

Expected: PASS.

- [ ] **Step 4: dev preview 검증 (가장 중요)**

브라우저에서 다음 시나리오 모두 직접 확인:

1. **/editor2 (그림체 multi)**: 잭과 콩나무 같은 multi-style 책 → paper-craft + pixar-3d 두 그룹 보임. paper-craft chip 누르면 그 그룹 펼침. 다른 그룹 접힘. 영상 0개 그룹은 "+ 첫 영상" CTA.
2. **/editor (v1)**: 외부 chip 없음 → __legacy 또는 storybook.artStyle 그룹 1개 보임. + 새 동영상 누르면 모달, 그림체 select 에 storybook.artStyle 만 선택 가능.
3. **+ 새 동영상 → 그림체 = pixar-3d → ko → 만들기**: 그 그림체 그룹 자동 펼침 + 새 master 활성. 같은 그림체 다시 추가 시도 → modal 의 그림체 select 에서 disabled.
4. **버전 추가 (master 헤더 작은 아이콘 또는 그룹 안 큰 버튼)**: 외부 lang 이 'en' 일 때 누르면 영어 version 만들어짐 + 매칭 자동 전환.
5. **라이브러리/뷰어 회귀**: 기존 v1 책 1권 (예: 영상 있는 거) 라이브러리 → 뷰어 → 영상 재생 정상.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/longform-video/components/{LongformVideoTab,LongformProjectGroup}.tsx
git commit -m "feat(longform): regroup by artStyle + multi-master per book + add modal"
```

---

### Task 6: 마이그레이션 — save 시 artStyle 자동 채움

**Files:**
- Modify: `packages/client/src/features/longform-video/components/LongformProjectGroup.tsx` (또는 LongformVideoTab.tsx) — Save 직전 lazy 마이그레이션

- [ ] **Step 1: useEffect 로 lazy 마이그**

LongformVideoTab.tsx 안에:

```typescript
// artStyle 미지정 master 들을 storybook.artStyle 로 자동 채움 (1회)
useEffect(() => {
  const all = storybook.longformProjects ?? [];
  const needsMigration = all.filter((p) => !p.artStyle && !p.parentProjectId);
  if (needsMigration.length === 0) return;
  const fallbackStyle = storybook.artStyle ?? storybook.availableStyles?.[0];
  if (!fallbackStyle) return; // 그림체 자체가 없으면 그대로 legacy
  onUpdate((d) => {
    for (const p of d.longformProjects ?? []) {
      if (!p.artStyle) p.artStyle = fallbackStyle;
    }
  });
  onSave();
  // versions 도 master.artStyle 따라가야 — group-by-style 에서 master.artStyle 만 보고
  // versions 는 같은 그룹으로 묶이도록 헬퍼 수정 필요? 아니: parentProjectId 매칭이라 group 내부에서 자동.
}, []); // 첫 마운트만
```

❗ 사이드 이펙트 주의: 첫 마운트마다 onSave 호출되면 R2 write 가 매번 발생. → `localStorage` 에 마이그된 책 id 기록하거나 storybook 자체에 `_lfMigratedAt` 메타 추가.

대안: 마이그를 "Save 가 일어나는 시점에만" — 사용자가 명시적으로 영상 추가/수정할 때 같이 처리. 그래서 `addVersion` / `updateProject` 안에서 `if (!project.artStyle) project.artStyle = inferredStyle` 추가.

- [ ] **Step 2: 더 안전한 마이그 — addVersion + updateProject 안에서 inline 처리**

```typescript
// addVersion 안에서:
if (!m.artStyle) m.artStyle = storybook.artStyle ?? '__legacy';
clone.artStyle = m.artStyle;
```

```typescript
// updateProject 안에서: 변경 없음 — group-by-style 헬퍼가 legacy 그룹으로 fallback
```

자동 마이그는 안 하고, 그룹핑 헬퍼의 legacy fallback 으로 자연스럽게 표시. 사용자가 명시적으로 수정 시 그때 채움.

- [ ] **Step 3: 검증 — 기존 v1 책 (artStyle 미지정 영상 N개) 정상 표시**

직접 책 1권 열어서 `__legacy` 그룹 펼침 → 영상들 master + version 정상 동작 확인.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/longform-video/components/LongformVideoTab.tsx
git commit -m "feat(longform): lazy artStyle migration on addVersion (no auto-write)"
```

---

## Chunk 4: 마무리

### Task 7: index.ts export + CLAUDE.md / Memory 업데이트

**Files:**
- Modify: `packages/client/src/features/longform-video/index.ts`
- Modify: `packages/client/src/features/longform-video/CLAUDE.md`
- Modify: `memory/MEMORY.md` + 신규 `memory/longform-style-grouping.md`

- [ ] **Step 1: index export**

```typescript
export { LongformVideoTab } from './components/LongformVideoTab';
// 신규 컴포넌트는 internal — export 불필요
```

- [ ] **Step 2: features/longform-video/CLAUDE.md 업데이트**

기존 폴더 구조 + 파이프라인 섹션 아래에 추가:

```markdown
## 그림체별 그룹화 (2026-05-08)

`storybook.longformProjects` 를 `artStyle` 기준 그룹으로 표시:
- `groupLongformByStyle` (lib/group-by-style.ts) — availableStyles 우선 + legacy fallback
- `LongformProjectGroup` — collapsible 그림체 헤더 + 본체. 빈 그룹은 "+ 첫 영상" CTA
- `AddLongformProjectModal` — 새 master 추가 시 그림체 선택 (이미 있는 그림체 disabled)
- 한 그림체당 master 1개 강제. 그림체 그룹 안에서 lang version 추가만.
- artStyle 미지정 영상 → `'__legacy'` 그룹. addVersion 시 inline 마이그.
- 외부 (`/editor2`) 그림체 chip → 해당 그룹 자동 펼침. 외부 lang chip → 활성 master 의 매칭 version.
```

- [ ] **Step 3: memory 업데이트**

- 신규: `memory/longform-style-grouping.md` (이 plan 의 결정 + 결과 요약)
- `memory/MEMORY.md` 에 한 줄 인덱스 추가

- [ ] **Step 4: typecheck + lint**

```powershell
pnpm typecheck
pnpm lint
```

Expected: 둘 다 PASS.

- [ ] **Step 5: 통합 commit**

```bash
git add packages/client/src/features/longform-video/index.ts \
        packages/client/src/features/longform-video/CLAUDE.md \
        memory/MEMORY.md memory/longform-style-grouping.md
git commit -m "docs(longform): style-grouping CLAUDE.md + memory"
```

- [ ] **Step 6: push (사용자가 "업데이트 하자" 하면 자동, 아니면 확인)**

```bash
git push origin claude/heuristic-bardeen-e19a9e
```

---

## 검증 체크리스트 (전체 끝나고)

- [ ] /editor2 multi-style 책: 그림체별 그룹 표시, chip 누르면 자동 펼침
- [ ] /editor v1 책: legacy 그룹 정상 동작, "+ 새 동영상" 모달 그림체 select 동작
- [ ] 기존 영상 (artStyle 미지정) — 라이브러리·뷰어·YouTube 업로드 회귀 없음
- [ ] 같은 그림체 master 중복 시도 → 모달에서 disabled + 안내
- [ ] 빈 그림체 그룹 → "+ 첫 영상" CTA → 모달 그 그림체 default
- [ ] 영어 버전 추가 → 매칭 자동 선택 + TTS/자막 비워짐 + 사용자 다시 분석/렌더 가능
- [ ] typecheck / lint PASS

---

## 미해결 (사용자 확인 필요)

1. **마이그 정책 확정**: lazy(addVersion 시 inline) vs 일괄(Save trigger 시) — default 는 lazy
2. **legacy 그룹 라벨**: "그림체 미지정" vs "기타" vs hide — default "그림체 미지정"
3. **availableStyles 가 빈 v1 책**: storybook.artStyle 1개로 그룹 1개 만드나, 또는 legacy 그룹만? — default "artStyle 1개로 그룹"
4. **그림체 표시 라벨**: 그림체 id (예: `paper-craft`) 그대로 vs art-style-library 의 한글 이름 lookup — default id 그대로 (단순)
