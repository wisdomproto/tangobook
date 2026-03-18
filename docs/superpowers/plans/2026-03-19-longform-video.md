# 롱폼 영상 생성 탭 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화책 페이지를 분석하여 AI 영상 프롬프트를 생성하고, Grok API로 영상 클립을 만들고, 타임라인 에디터로 편집하여 최종 영상을 렌더링하는 탭 구현.

**Architecture:** 4단계 스텝 위저드 (프롬프트 분석 → 영상 생성 → 타임라인 편집 → 렌더링). 기존 audiobook 패턴을 따르며, Provider 패턴으로 영상 생성 API 확장 가능. Python/MoviePy로 서버 사이드 렌더링.

**Tech Stack:** React 18, TypeScript, TanStack Query, Zustand, Express v5, Gemini API, xAI Grok API, Python/MoviePy, ffmpeg-static

**Spec:** `docs/superpowers/specs/2026-03-19-longform-video-design.md`

---

## Chunk 1: 타입 정의 + 백엔드 스캐폴딩

### Task 1: shared 타입 추가

**Files:**
- Modify: `packages/shared/src/types/storybook.ts` (Storybook 인터페이스 확장 + 새 타입 추가)

- [ ] **Step 1: storybook.ts에 LongformProject 관련 타입 추가**

파일 끝(기존 타입 정의 뒤)에 추가:
```typescript
// ===== Longform Video =====
export interface LongformProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  language: string;
  promptPresetId?: string;
  scenes: LongformScene[];
  bgmUrl?: string;
  bgmVolume: number;
  subtitleStyle: LongformSubtitleStyle;
  outputUrl?: string;
  createdAt?: string;
}

export interface LongformScene {
  id: string;
  pageNumber: number;
  videoPrompt: string;
  clipUrl?: string;
  clipDuration: number;
  sfxUrl?: string;
  sfxVolume: number;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitles: LongformSubtitleEntry[];
  order: number;
}

export interface LongformSubtitleEntry {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface LongformSubtitleStyle {
  fontSize: 'sm' | 'md' | 'lg';
  position: 'top' | 'center' | 'bottom';
  textColor: string;
  outlineColor: string;
  bgColor: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Storybook 인터페이스에 longformProjects 필드 추가**

`Storybook` 인터페이스 안, `cardNewsProjects` 필드 근처에:
```typescript
longformProjects?: LongformProject[];
```

- [ ] **Step 3: shared/src/index.ts에서 새 타입 re-export 확인**

기존 `export * from './types/storybook.js'`로 자동 포함됨. 별도 작업 불필요.

- [ ] **Step 4: 타입체크**

Run: `cd /c/projects/tangobook && pnpm --filter shared build`

- [ ] **Step 5: 커밋**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "feat(shared): add LongformProject types"
```

---

### Task 2: 프롬프트 프리셋 백엔드 (routes → controller → service)

**Files:**
- Create: `packages/server/src/routes/prompt-preset.routes.ts`
- Create: `packages/server/src/controllers/prompt-preset.controller.ts`
- Create: `packages/server/src/services/prompt-preset.service.ts`
- Modify: `packages/server/src/app.ts` (라우트 등록)

- [ ] **Step 1: prompt-preset.service.ts 생성**

R2에 `prompt-presets/{id}.json`으로 CRUD. `R2Repository` 사용.
```typescript
import { R2Repository } from '../repositories/r2.repository.js';
import type { PromptPreset } from '@tangobook/shared';

const PRESET_PREFIX = 'prompt-presets/';

export const PromptPresetService = {
  async list(): Promise<PromptPreset[]> { /* R2 list + parse */ },
  async getById(id: string): Promise<PromptPreset> { /* R2 get */ },
  async create(data: { name: string; systemPrompt: string }): Promise<PromptPreset> { /* generate id, save */ },
  async update(id: string, data: Partial<PromptPreset>): Promise<PromptPreset> { /* merge + save */ },
  async remove(id: string): Promise<void> { /* R2 delete */ },
};
```

- [ ] **Step 2: prompt-preset.controller.ts 생성**

기존 controller 패턴 (req 파싱 → service 호출 → res.json).

- [ ] **Step 3: prompt-preset.routes.ts 생성**

```typescript
import { Router } from 'express';
const router = Router();
router.get('/', controller.list);
router.post('/', controller.create);
router.post('/:id', controller.update);  // POST for update (no apiPut helper in client)
router.delete('/:id', controller.remove);
export default router;
```

- [ ] **Step 4: app.ts에 라우트 등록**

`app.use('/api/prompt-presets', promptPresetRoutes);` 추가.

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter server typecheck`

- [ ] **Step 6: 커밋**

```bash
git add packages/server/src/routes/prompt-preset.routes.ts \
       packages/server/src/controllers/prompt-preset.controller.ts \
       packages/server/src/services/prompt-preset.service.ts \
       packages/server/src/app.ts
git commit -m "feat(server): add prompt preset CRUD API"
```

---

### Task 3: Grok Provider 생성

**Files:**
- Create: `packages/server/src/providers/grok.provider.ts`

- [ ] **Step 1: grok.provider.ts 생성**

xAI Grok 영상 생성 API 클라이언트. Provider 인터페이스 정의 + Grok 구현.
```typescript
export interface VideoGenOptions {
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration?: number;
}

export interface VideoGenerationProvider {
  generateClip(prompt: string, options: VideoGenOptions): Promise<Buffer>;
}

export const GrokProvider: VideoGenerationProvider = {
  async generateClip(prompt, options) {
    // xAI API 호출 (https://api.x.ai/v1/images/generations 또는 video endpoint)
    // 환경변수: XAI_API_KEY
    // Buffer 반환
  },
};
```

- [ ] **Step 2: config/index.ts에 XAI_API_KEY 추가**

optional env로 추가 (없으면 영상 생성 시 에러).

- [ ] **Step 3: 타입체크**

Run: `pnpm --filter server typecheck`

- [ ] **Step 4: 커밋**

```bash
git add packages/server/src/providers/grok.provider.ts packages/server/src/config/index.ts
git commit -m "feat(server): add Grok video generation provider"
```

---

### Task 4: R2 키 확장

**Files:**
- Modify: `packages/server/src/utils/r2-key.ts`

- [ ] **Step 1: R2 키 전략 결정**

스펙의 계층적 R2 경로(`storybooks/{id}/longform/{projectId}/clips/scene-{order}.mp4`)는 `buildR2Key`의 flat 패턴과 맞지 않음. `longform.service.ts`에서 R2 키를 직접 구성:
```typescript
const clipKey = `storybooks/${storybookId}/longform/${projectId}/clips/scene-${order}.mp4`;
const sfxKey = `storybooks/${storybookId}/longform/${projectId}/sfx/scene-${order}.mp3`;
const bgmKey = `storybooks/${storybookId}/longform/${projectId}/bgm.mp3`;
const outputKey = `storybooks/${storybookId}/longform/${projectId}/output.mp4`;
```
`buildR2Key` 확장 없이 서비스에서 직접 키 생성.

- [ ] **Step 2: 커밋** (r2-key.ts 변경 불필요, Task 5에서 서비스 생성 시 반영)

---

### Task 5: Longform 백엔드 서비스 + 라우트

**Files:**
- Create: `packages/server/src/services/longform.service.ts`
- Create: `packages/server/src/controllers/longform.controller.ts`
- Create: `packages/server/src/routes/longform.routes.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: longform.service.ts 생성**

핵심 메서드:
- `analyze(storybookId, projectId, promptPresetId)`: Gemini로 장면별 프롬프트 생성. 각 장면에서:
  - 페이지 텍스트를 문장 단위로 분리 (`.!?。` 기준, 기존 split_sentences 로직)
  - 기존 `page.ttsUrl` 또는 `translations[lang].ttsUrl` 자동 로드 → `scene.ttsUrl`
  - TTS 길이 기반 자막 시간 배분 (TTS 없으면 clipDuration 기준 균등 배분)
  - `subtitles[]` 자동 생성
- `analyzeScene(storybookId, projectId, sceneId, promptPresetId)`: 개별 장면 재분석
- `generateClip(storybookId, projectId, sceneId)`: Grok → 영상 생성 → ffmpeg 오디오 분리 → R2
- `generateAll(storybookId, projectId)`: 일괄 생성 (비동기, progressMap). **실패한 장면은 건너뛰고 계속 진행.** 개별 에러 상태 기록.
- `getProgress(projectId)`: 진행률 조회
- `render(storybookId, projectId)`: Python 렌더링 호출 (비동기)
- `getRenderProgress(projectId)`: 렌더링 진행률
- `uploadBgm(file, storybookId, projectId)`: BGM R2 업로드

에러 처리 / 타임아웃:
- Grok API: 클립당 최대 5분 타임아웃. `AbortController` 사용.
- Python 렌더링: 최대 10분 타임아웃.
- 일괄 생성: 개별 실패 시 `scene.error` 필드에 에러 메시지 저장, 나머지 계속.

ffmpeg 오디오 분리 헬퍼:
```typescript
async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  const ffmpegPath = require('ffmpeg-static');
  await execFileAsync(ffmpegPath, ['-i', videoPath, '-vn', '-acodec', 'libmp3lame', audioPath]);
}
async function muteVideo(inputPath: string, outputPath: string): Promise<void> {
  const ffmpegPath = require('ffmpeg-static');
  await execFileAsync(ffmpegPath, ['-i', inputPath, '-an', '-vcodec', 'copy', outputPath]);
}
```

- [ ] **Step 2: longform.controller.ts 생성**

엔드포인트별 controller. 기존 패턴 따라감.

- [ ] **Step 3: longform.routes.ts 생성**

```
POST /analyze
POST /analyze-scene
POST /generate-clip
POST /generate-all
GET  /progress/:projectId
POST /render
GET  /render-progress/:projectId
POST /upload-bgm (multer)
```

- [ ] **Step 4: app.ts에 라우트 등록**

`app.use('/api/longform', longformRoutes);`

- [ ] **Step 5: 타입체크**

Run: `pnpm --filter server typecheck`

- [ ] **Step 6: 커밋**

```bash
git add packages/server/src/services/longform.service.ts \
       packages/server/src/controllers/longform.controller.ts \
       packages/server/src/routes/longform.routes.ts \
       packages/server/src/app.ts
git commit -m "feat(server): add longform video service, controller, routes"
```

---

## Chunk 2: 프론트엔드 탭 + Step 1 (프롬프트 분석)

### Task 6: EditorTab 등록 + 빈 탭 컴포넌트

**Files:**
- Modify: `packages/client/src/store/editor.store.ts` (EditorTab 유니온)
- Create: `packages/client/src/features/longform-video/index.ts`
- Create: `packages/client/src/features/longform-video/api/longform.api.ts`
- Create: `packages/client/src/features/longform-video/components/LongformVideoTab.tsx`
- Modify: `packages/client/src/features/editor/components/EditorContent.tsx`

- [ ] **Step 1: editor.store.ts에 'longform-video' 추가**

EditorTab 유니온에 `| 'longform-video'` 추가.

- [ ] **Step 2: longform.api.ts 생성**

```typescript
import { apiGet, apiPost, apiDelete } from '@/lib/axios';
import type { LongformScene, PromptPreset } from '@tangobook/shared';

export const longformApi = {
  analyze: (req: { storybookId: string; projectId: string; promptPresetId: string }) =>
    apiPost<{ scenes: LongformScene[] }>('/longform/analyze', req),
  analyzeScene: (req: { storybookId: string; projectId: string; sceneId: string; promptPresetId: string }) =>
    apiPost<{ scene: LongformScene }>('/longform/analyze-scene', req),
  generateClip: (req: { storybookId: string; projectId: string; sceneId: string }) =>
    apiPost<{ clipUrl: string; sfxUrl: string }>('/longform/generate-clip', req),
  generateAll: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/generate-all', req),
  getProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; currentScene?: number } | null>(`/longform/progress/${projectId}`),
  render: (req: { storybookId: string; projectId: string }) =>
    apiPost<{ message: string }>('/longform/render', req),
  getRenderProgress: (projectId: string) =>
    apiGet<{ progress: number; step: string; outputUrl?: string } | null>(`/longform/render-progress/${projectId}`),
  uploadBgm: (formData: FormData) =>
    apiPost<{ bgmUrl: string }>('/longform/upload-bgm', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const presetApi = {
  list: () => apiGet<PromptPreset[]>('/prompt-presets'),
  create: (data: { name: string; systemPrompt: string }) =>
    apiPost<PromptPreset>('/prompt-presets', data),
  update: (id: string, data: Partial<PromptPreset>) =>
    apiPost<PromptPreset>(`/prompt-presets/${id}`, data),
  remove: (id: string) => apiDelete(`/prompt-presets/${id}`),
};
```

- [ ] **Step 3: LongformVideoTab.tsx 스캐폴딩**

스텝 위저드 구조 + 프로젝트 생성/선택. AudiobookTab.tsx 패턴 따라감.
- state: `currentStep` (1-4), 프로젝트 CRUD
- 프로젝트 없으면 "새 프로젝트" 버튼
- 프로젝트 있으면 헤더 + 스텝 바 + 스텝별 콘텐츠

- [ ] **Step 4: index.ts 생성**

```typescript
export { LongformVideoTab } from './components/LongformVideoTab.js';
```

- [ ] **Step 5: EditorContent.tsx에 탭 추가**

import 추가 + `sharedEndTabs` 배열에 audiobook 뒤에 추가:
```typescript
{ id: 'longform-video' as const, label: '롱폼 영상', component: LongformVideoTab },
```

- [ ] **Step 6: 타입체크 + 빌드**

Run: `pnpm typecheck`

- [ ] **Step 7: 커밋**

```bash
git add packages/client/src/store/editor.store.ts \
       packages/client/src/features/longform-video/ \
       packages/client/src/features/editor/components/EditorContent.tsx
git commit -m "feat(client): add longform-video tab scaffold"
```

---

### Task 7: useLongformProject 훅

**Files:**
- Create: `packages/client/src/features/longform-video/hooks/useLongformProject.ts`

- [ ] **Step 1: useLongformProject.ts 생성**

프로젝트 CRUD 훅. storybook의 `longformProjects[]`를 조작하고 storybook 전체 저장.
```typescript
// 기존 storybook query/mutation 패턴 재사용
export function useLongformProject(storybook: Storybook) {
  // addProject(): 기본값으로 LongformProject 생성 → longformProjects push → save
  // updateProject(projectId, updates): 해당 프로젝트 업데이트 → save
  // deleteProject(projectId): 해당 프로젝트 제거 → save
  // updateScene(projectId, sceneId, updates): 장면 업데이트 → save
  // reorderScenes(projectId, fromIndex, toIndex): 장면 순서 변경 → save
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/longform-video/hooks/useLongformProject.ts
git commit -m "feat(client): add useLongformProject hook"
```

---

### Task 8: 프롬프트 프리셋 모달 (PromptPresetModal)

**Files:**
- Create: `packages/client/src/features/longform-video/hooks/usePromptPresets.ts`
- Create: `packages/client/src/features/longform-video/components/PromptPresetModal.tsx`

- [ ] **Step 1: usePromptPresets.ts 생성**

TanStack Query 훅: `usePresetList()`, `useCreatePreset()`, `useUpdatePreset()`, `useDeletePreset()`.

- [ ] **Step 2: PromptPresetModal.tsx 생성**

두 가지 모드:
- `mode='edit'`: textarea로 시스템 프롬프트 편집 + 저장
- `mode='manage'`: 프리셋 목록 CRUD (추가/이름변경/삭제/복제)

기존 `Modal` 컴포넌트(`@/components/Modal`) 재사용.

- [ ] **Step 3: 타입체크**

Run: `pnpm --filter client typecheck`

- [ ] **Step 4: 커밋**

```bash
git add packages/client/src/features/longform-video/hooks/usePromptPresets.ts \
       packages/client/src/features/longform-video/components/PromptPresetModal.tsx
git commit -m "feat(client): add prompt preset modal and hooks"
```

---

### Task 8: Step 1 - 프롬프트 분석 UI (PromptAnalysisStep)

**Files:**
- Create: `packages/client/src/features/longform-video/components/PromptAnalysisStep.tsx`
- Create: `packages/client/src/features/longform-video/components/LongformProjectHeader.tsx`
- Create: `packages/client/src/features/longform-video/components/StepBar.tsx`

- [ ] **Step 1: StepBar.tsx 생성**

4단계 스텝 바. props: `currentStep`, `onStepChange`. 각 스텝 클릭 시 이동.

- [ ] **Step 2: LongformProjectHeader.tsx 생성**

프로젝트 이름, aspectRatio, language 표시. 설정/삭제 버튼.

- [ ] **Step 3: PromptAnalysisStep.tsx 생성**

- 시스템 프롬프트 프리셋 드롭다운 + 편집/관리 버튼 (PromptPresetModal 연동)
- "전체 분석 시작" 버튼 → `longformApi.analyze()` 호출
- 장면 카드 리스트: 삽화 썸네일 + 원문 + 영상 프롬프트
- 개별 편집 (textarea toggle) + 재분석 버튼
- 상태 뱃지: 대기중/분석중/완료

- [ ] **Step 4: LongformVideoTab.tsx에 Step 1 연결**

`currentStep === 1`일 때 `PromptAnalysisStep` 렌더.

- [ ] **Step 5: 타입체크**

Run: `pnpm typecheck`

- [ ] **Step 6: 커밋**

```bash
git add packages/client/src/features/longform-video/components/
git commit -m "feat(client): add prompt analysis step (Step 1)"
```

---

## Chunk 3: Step 2 (영상 생성) + Step 4 (렌더링)

### Task 9: Step 2 - 영상 생성 UI (VideoGenerationStep)

**Files:**
- Create: `packages/client/src/features/longform-video/components/VideoGenerationStep.tsx`

- [ ] **Step 1: VideoGenerationStep.tsx 생성**

- 모델 선택 드롭다운 (현재 Grok만, 확장 대비)
- 장면 카드 리스트: 프롬프트 요약 + 영상 미리보기(`<video>` 태그) + 진행률
- "전체 생성" 버튼 → `longformApi.generateAll()` + 폴링 (`longformApi.getProgress()`)
- 개별 생성/재생성/업로드 버튼
- 기존 `BatchProgressBar` 컴포넌트 재사용 가능

- [ ] **Step 2: LongformVideoTab.tsx에 Step 2 연결**

- [ ] **Step 3: 타입체크 + 커밋**

```bash
git add packages/client/src/features/longform-video/components/VideoGenerationStep.tsx
git commit -m "feat(client): add video generation step (Step 2)"
```

---

### Task 10: Python 렌더링 스크립트 + Provider

**Files:**
- Create: `packages/server/scripts/generate_longform.py`
- Create: `packages/server/src/providers/longform.provider.ts`

- [ ] **Step 1: generate_longform.py 생성**

`generate_audiobook.py`와 동일 구조:
1. stdin으로 JSON 옵션 수신
2. 각 장면 영상 클립 다운로드
3. 자막 이미지 생성 (`create_subtitle_image` 재사용, `outlineColor` 추가)
4. 효과음 + TTS 오디오 믹싱 (장면별)
5. BGM 루프 + 볼륨 조절
6. 전체 영상 concat
7. 최종 인코딩 (libx264, aac)
8. 진행률 stderr JSON 출력
9. stdout으로 `{"outputPath": "..."}` 출력

- [ ] **Step 2: longform.provider.ts 생성**

`audiobook.provider.ts`와 동일 패턴: Python 프로세스 spawn, stdin으로 JSON 전달, stderr에서 progress 읽기.

- [ ] **Step 3: longform.service.ts의 render 메서드에 provider 연결**

- [ ] **Step 4: 타입체크 + 커밋**

```bash
git add packages/server/scripts/generate_longform.py \
       packages/server/src/providers/longform.provider.ts \
       packages/server/src/services/longform.service.ts
git commit -m "feat(server): add longform rendering pipeline"
```

---

### Task 11: Step 4 - 렌더링 UI (RenderStep)

**Files:**
- Create: `packages/client/src/features/longform-video/components/RenderStep.tsx`

- [ ] **Step 1: RenderStep.tsx 생성**

- 해상도 표시 (aspectRatio 기반 자동)
- "렌더링 시작" 버튼 → `longformApi.render()` + 폴링
- 진행률 바 + 단계 표시
- 완료 후: `<video>` 미리보기 + 다운로드 버튼 (`DownloadButton` 컴포넌트 재사용)

- [ ] **Step 2: LongformVideoTab.tsx에 Step 4 연결**

- [ ] **Step 3: 타입체크 + 커밋**

```bash
git add packages/client/src/features/longform-video/components/RenderStep.tsx
git commit -m "feat(client): add render step (Step 4)"
```

---

## Chunk 4: Step 3 (타임라인 에디터)

### Task 12: 타임라인 코어 훅 (useTimeline)

**Files:**
- Create: `packages/client/src/features/longform-video/hooks/useTimeline.ts`

- [ ] **Step 1: useTimeline.ts 생성**

타임라인 상태 관리:
```typescript
interface TimelineState {
  totalDuration: number;          // 전체 영상 길이 (초)
  currentTime: number;            // 재생 헤드 위치
  isPlaying: boolean;
  selectedClipId: string | null;  // 선택된 클립
  selectedTrack: 'video' | 'sfx' | 'subtitle' | 'tts' | 'bgm' | null;
}
```

핵심 함수:
- `play() / pause() / seek(time)`
- `selectClip(trackType, clipId)`
- `updateSubtitleTiming(subtitleId, startTime, endTime)`
- `updateSubtitleText(subtitleId, text)`
- `reorderScenes(fromIndex, toIndex)`
- `getSceneAtTime(time)`: 현재 시간에 해당하는 장면 반환
- `timeToPixel(time) / pixelToTime(px)`: 시간↔픽셀 변환

- [ ] **Step 2: 커밋**

```bash
git add packages/client/src/features/longform-video/hooks/useTimeline.ts
git commit -m "feat(client): add timeline state hook"
```

---

### Task 13: 타임라인 컴포넌트 (TimelineTrack, TimelineClip)

**Files:**
- Create: `packages/client/src/features/longform-video/components/TimelineTrack.tsx`
- Create: `packages/client/src/features/longform-video/components/TimelineClip.tsx`

- [ ] **Step 1: TimelineClip.tsx 생성**

개별 클립 컴포넌트:
- `position: absolute`, left/width 계산 (시간 비례)
- 클릭 → 선택
- 자막 클립: 가장자리 드래그로 시작/끝 시간 조절 (onMouseDown + onMouseMove)
- 선택된 클립 하이라이트

- [ ] **Step 2: TimelineTrack.tsx 생성**

트랙 한 줄: 라벨 + `position: relative` 컨테이너 + 자식 클립들.
5가지 트랙 타입별 렌더링:
- video: 장면 클립 (썸네일 + 이름)
- sfx: 효과음 클립 (파형 아이콘)
- subtitle: 자막 텍스트 조각
- tts: TTS 오디오 클립
- bgm: 전체 길이 단일 클립

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/longform-video/components/TimelineTrack.tsx \
       packages/client/src/features/longform-video/components/TimelineClip.tsx
git commit -m "feat(client): add timeline track and clip components"
```

---

### Task 14: 타임라인 프리뷰 + 컨트롤

**Files:**
- Create: `packages/client/src/features/longform-video/components/TimelinePreview.tsx`
- Create: `packages/client/src/features/longform-video/components/TimelineControls.tsx`

- [ ] **Step 1: TimelinePreview.tsx 생성**

상단 미리보기 영역:
- `<video>` 태그로 현재 장면 클립 재생
- 자막 오버레이 (CSS positioned text, subtitleStyle 반영)
- `useTimeline`의 `currentTime`에 따라 적절한 클립 표시
- **개별 클립 재생**: 타임라인에서 영상 클립 클릭 시 해당 클립만 프리뷰 재생 (video src 교체 + 해당 구간 자막 표시)
- **전체 재생**: 재생 버튼 시 currentTime부터 순차 재생 (클립 전환 시 video src 자동 교체)

- [ ] **Step 2: TimelineControls.tsx 생성**

재생/일시정지 버튼, 현재시간/전체시간 표시, 자막 스타일 버튼.

- [ ] **Step 3: 커밋**

```bash
git add packages/client/src/features/longform-video/components/TimelinePreview.tsx \
       packages/client/src/features/longform-video/components/TimelineControls.tsx
git commit -m "feat(client): add timeline preview and controls"
```

---

### Task 15: 자막 스타일 모달 + Step 3 조립

**Files:**
- Create: `packages/client/src/features/longform-video/components/SubtitleStyleModal.tsx`
- Create: `packages/client/src/features/longform-video/components/TimelineEditorStep.tsx`

- [ ] **Step 1: SubtitleStyleModal.tsx 생성**

모달 내용:
- 폰트 크기 선택 (sm/md/lg)
- 위치 선택 (top/center/bottom)
- 텍스트 색 (color input)
- 테두리 색 (color input)
- 배경색 + 투명도 (color input + range slider)

- [ ] **Step 2: TimelineEditorStep.tsx 생성 (Step 3 메인)**

조립:
```
TimelineEditorStep
├── TimelineControls (재생, 시간, 자막 스타일 버튼)
├── TimelinePreview (영상 미리보기 + 자막 오버레이)
├── 5x TimelineTrack (video, sfx, subtitle, tts, bgm)
│   └── TimelineClip (각 클립)
├── 재생 헤드 (세로선, CSS transform)
├── SubtitleStyleModal (조건부)
└── 선택된 클립 편집 패널 (하단)
    - 자막: 텍스트 편집 input
    - 효과음/TTS: 볼륨 슬라이더, 삭제/교체 버튼
    - BGM: 파일 업로드, 볼륨 슬라이더
```

- [ ] **Step 3: LongformVideoTab.tsx에 Step 3 연결**

- [ ] **Step 4: 타입체크**

Run: `pnpm typecheck`

- [ ] **Step 5: 커밋**

```bash
git add packages/client/src/features/longform-video/components/SubtitleStyleModal.tsx \
       packages/client/src/features/longform-video/components/TimelineEditorStep.tsx \
       packages/client/src/features/longform-video/components/LongformVideoTab.tsx
git commit -m "feat(client): add timeline editor step (Step 3)"
```

---

## Chunk 5: 통합 + 마무리

### Task 16: 전체 빌드 + 타입체크

- [ ] **Step 1: 전체 타입체크**

Run: `pnpm typecheck`
모든 에러 수정.

- [ ] **Step 2: 전체 빌드**

Run: `pnpm build`

- [ ] **Step 3: lint**

Run: `pnpm lint`
에러 수정.

- [ ] **Step 4: 커밋**

```bash
git commit -m "fix: resolve typecheck and lint errors"
```

---

### Task 17: 수동 통합 테스트

- [ ] **Step 1: 개발 서버 시작**

Run: `pnpm dev`

- [ ] **Step 2: 테스트 시나리오**

1. 동화책 선택 → 롱폼 영상 탭 진입
2. 새 프로젝트 생성 (이름, 비율, 언어)
3. Step 1: 시스템 프롬프트 프리셋 CRUD → 전체 분석 → 프롬프트 편집
4. Step 2: 영상 생성 (Grok API 키 필요) → 미리보기
5. Step 3: 타임라인 조작 (자막 편집, 오디오 조절)
6. Step 4: 렌더링 → 다운로드

- [ ] **Step 3: 발견된 이슈 수정 + 커밋**
