# 롱폼 영상 생성 탭 설계 문서

## 개요
동화책의 페이지(삽화+텍스트)를 분석하여 유튜브/릴스용 AI 영상을 생성하는 기능.
4단계 스텝 위저드: 프롬프트 분석 → 영상 생성 → 타임라인 편집 → 렌더링.

## 데이터 모델

### Storybook 확장

`Storybook.longformProjects?: LongformProject[]` 추가.

```typescript
interface LongformProject {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  language: string;
  promptPresetId?: string;
  scenes: LongformScene[];
  bgmUrl?: string;
  bgmVolume: number;                   // 0-100
  subtitleStyle: SubtitleStyle;
  outputUrl?: string;
  createdAt?: string;
}

interface LongformScene {
  id: string;
  pageNumber: number;
  videoPrompt: string;
  clipUrl?: string;
  clipDuration: number;                 // 초 (8~15)
  sfxUrl?: string;                      // 영상에서 추출한 효과음
  sfxVolume: number;                    // 0-100
  ttsUrl?: string;
  ttsDuration?: number;
  subtitles: SubtitleEntry[];
  order: number;
}

interface SubtitleEntry {
  id: string;
  text: string;
  startTime: number;                    // 클립 내 상대 시간 (초)
  endTime: number;
}

interface SubtitleStyle {
  fontSize: 'sm' | 'md' | 'lg';
  position: 'top' | 'center' | 'bottom';
  textColor: string;                    // '#ffffff'
  outlineColor: string;                 // '#000000'
  bgColor: string;                      // '#00000080'
}
```

### 프롬프트 프리셋 (전역, R2 저장)

```typescript
interface PromptPreset {
  id: string;
  name: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}
```

R2 경로: `prompt-presets/{id}.json`

## UI/UX 설계

### 탭 구조

`longform-video` 탭을 EditorContent에 추가. EditorTab 유니온에 `'longform-video'` 추가.

```
LongformVideoTab
├── 프로젝트 없을 때 → "새 프로젝트" 버튼
├── LongformProjectHeader (이름, 비율, 언어, 설정/삭제)
├── StepBar (① 프롬프트 분석 ② 영상 생성 ③ 타임라인 편집 ④ 렌더링)
└── 스텝별 콘텐츠 (조건부 렌더링)
```

### Step 1: 프롬프트 분석 (PromptAnalysisStep)

- **시스템 프롬프트 바**: 프리셋 드롭다운 + [편집] + [관리] 버튼
  - 편집 버튼 → PromptPresetModal (textarea + 저장)
  - 관리 버튼 → PromptPresetModal (목록 CRUD: 추가/이름변경/삭제/복제)
- **"전체 분석 시작" 버튼**: Gemini가 각 페이지의 삽화+텍스트 분석 → 영상 프롬프트 생성
- **장면 카드 리스트**: 삽화 썸네일 + 원문 텍스트 + 영상 프롬프트 + [편집/재분석]
- 상태 뱃지: 대기중 → 분석중 → 완료

### Step 2: 영상 생성 (VideoGenerationStep)

- **모델 선택 바**: Grok (기본). 드롭다운으로 확장 가능.
- **"전체 생성" 버튼** + 개별 장면 생성 버튼
- **장면 카드 리스트**: 프롬프트 요약 + 영상 미리보기(video 태그) + 진행률 바
- 재생성 / 업로드(직접 영상 올리기) 버튼
- 생성 완료 시 ffmpeg로 오디오 트랙 자동 분리 → sfxUrl 저장

### Step 3: 타임라인 편집 (TimelineEditorStep)

```
┌──────────────────────────────────────────────────┐
│  [▶]  [⏸]  00:00 / 02:34        [자막 스타일]   │  컨트롤 바
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐          │
│  │       미리보기 영역 (16:9)         │          │  프리뷰
│  └────────────────────────────────────┘          │
├──────────────────────────────────────────────────┤
│ 🎬 영상  │■■ 장면1 ■■│■■ 장면2 ■│■■■ 장면3 ■■│  │  영상 트랙
│ 🔉 효과음│■■ sfx1 ■■│■■ sfx2 ■│■■■ sfx3 ■■│  │  효과음 트랙
│ 📝 자막  │"옛날"|"깊은"|"토끼"|"매일"|"숲을"│  │  자막 트랙
│ 🔊 TTS  │■■ p1.mp3 ■■│■ p2.mp3 │■■ p3.mp3 ■│  │  TTS 트랙
│ 🎵 BGM  │■■■■■■■■■ bgm.mp3 ■■■■■■■■■■■■■■│  │  BGM 트랙
│          ▲                                       │  재생 헤드
└──────────────────────────────────────────────────┘
```

5트랙 고정 구조:
- **영상 트랙**: 장면 클립 나열. 클릭 → 프리뷰 재생. 드래그 → 순서 변경.
- **효과음 트랙**: Grok 영상에서 추출한 오디오. 삭제/교체/볼륨 조절 가능.
- **자막 트랙**: 문장 단위 클립. 클릭 → 텍스트 편집. 가장자리 드래그 → 시작/끝 시간 조절.
- **TTS 트랙**: 페이지 TTS 자동 로드. 삭제/교체/업로드 가능.
- **BGM 트랙**: 파일 업로드 + 볼륨 슬라이더. 전체 길이에 걸쳐 루프.

자막 스타일 모달 (SubtitleStyleModal):
- 폰트 크기 (sm/md/lg)
- 위치 (top/center/bottom)
- 텍스트 색 (color picker)
- 테두리 색 (color picker)
- 배경색 + 투명도 (color picker)

### Step 4: 렌더링 (RenderStep)

- **해상도 선택**: 1920×1080 / 1080×1920 / 1080×1080 (aspectRatio 기반 자동 선택)
- **"렌더링 시작" 버튼** → 서버에서 Python/MoviePy 합성
- 진행률 바 (폴링)
- 완료 후: 미리보기 플레이어 + 다운로드 버튼

## 백엔드 아키텍처

### 파일 구조

```
server/src/
  routes/longform.routes.ts
  controllers/longform.controller.ts
  services/longform.service.ts
  providers/grok.provider.ts           # xAI Grok 영상 생성
  routes/prompt-preset.routes.ts
  controllers/prompt-preset.controller.ts
  services/prompt-preset.service.ts
```

### API 엔드포인트

```
# 장면 분석
POST /api/longform/analyze              # 전체 장면 프롬프트 생성 (Gemini)
  Request:  { storybookId, projectId }
  Response: { scenes: LongformScene[] }

POST /api/longform/analyze-scene        # 개별 장면 재분석
  Request:  { storybookId, projectId, sceneId }
  Response: { scene: LongformScene }

# 영상 클립 생성
POST /api/longform/generate-clip        # 개별 클립 생성 (Grok)
  Request:  { storybookId, projectId, sceneId }
  Response: { clipUrl, sfxUrl }

POST /api/longform/generate-all         # 전체 클립 일괄 생성
  Request:  { storybookId, projectId }
  Response: { success: true }

GET  /api/longform/progress/:projectId  # 생성 진행률
  Response: { progress: 0-100, step: string, currentScene?: number }

# 렌더링
POST /api/longform/render               # 최종 합성
  Request:  { storybookId, projectId }
  Response: { outputUrl }

GET  /api/longform/render-progress/:projectId
  Response: { progress: 0-100, step: string }

# 프리셋 관리
GET    /api/prompt-presets               # 목록
POST   /api/prompt-presets               # 생성
PUT    /api/prompt-presets/:id           # 수정
DELETE /api/prompt-presets/:id           # 삭제
```

### Provider 확장 패턴

```typescript
// providers/grok.provider.ts
interface VideoGenerationProvider {
  generateClip(prompt: string, options: VideoGenOptions): Promise<{
    videoBuffer: Buffer;
    audioBuffer: Buffer;   // 효과음 자동 분리
  }>;
}

export const GrokProvider: VideoGenerationProvider = { ... };
// 추후: RunwayProvider, KlingProvider 등 추가
```

### 데이터 흐름

```
분석:   페이지(삽화+텍스트) → Gemini → videoPrompt → storybook.longformProjects[].scenes[] 저장
생성:   videoPrompt → Grok API → 영상(video+audio)
        → ffmpeg 분리 → clipUrl(음소거) + sfxUrl(효과음) → R2 업로드
렌더링: scenes[] + subtitles + TTS + SFX + BGM → Python/MoviePy → MP4 → R2 → outputUrl
```

### R2 저장 경로

```
storybooks/{id}/longform/{projectId}/clips/scene-{order}.mp4
storybooks/{id}/longform/{projectId}/sfx/scene-{order}.mp3
storybooks/{id}/longform/{projectId}/output.mp4
prompt-presets/{presetId}.json
```

### 렌더링 파이프라인 (Python)

기존 `generate_audiobook.py`와 유사한 구조로 `generate_longform.py` 생성:

1. 각 장면의 영상 클립 다운로드
2. 자막 이미지 생성 (기존 `create_subtitle_image` 재사용, 테두리색 추가)
3. 효과음 + TTS 오디오 믹싱 (장면별)
4. BGM 루프 + 볼륨 조절
5. 전체 영상 연결 (concatenate)
6. 최종 인코딩 (libx264, aac)
7. 진행률 stderr JSON 출력

### 클라이언트 파일 구조

```
client/src/features/longform-video/
  api/longform.api.ts
  components/
    LongformVideoTab.tsx
    LongformProjectHeader.tsx
    PromptAnalysisStep.tsx
    VideoGenerationStep.tsx
    TimelineEditorStep.tsx
    RenderStep.tsx
    PromptPresetModal.tsx
    SubtitleStyleModal.tsx
    TimelineTrack.tsx
    TimelineClip.tsx
    TimelinePreview.tsx
  hooks/
    useLongformProject.ts
    usePromptPresets.ts
    useTimeline.ts
  index.ts
```

## 기존 코드 재사용

| 기능 | 기존 코드 | 재사용 방식 |
|------|-----------|-------------|
| TTS 생성 | `TtsService.generate/batch` | 그대로 호출 |
| TTS 업로드 | `TtsService.uploadAudio` | 그대로 호출 |
| 자막 렌더링 | `generate_audiobook.py::create_subtitle_image` | `generate_longform.py`에서 import |
| 오디오 믹싱 | `generate_audiobook.py` BGM 로직 | 동일 패턴 복제 |
| 진행률 추적 | `AudiobookService.progressMap` | 동일 패턴 |
| R2 업로드 | `R2Repository` | 그대로 사용 |
| Gemini 호출 | `GeminiProvider` | 프롬프트 분석에 사용 |

## 미구현 (향후 확장)

- 로컬 렌더링 (FFmpeg.wasm / WebCodecs)
- 추가 영상 생성 모델 (Runway, Kling, Pika)
- 타임라인 줌/스냅
- 장면 전환 효과 (fade, dissolve)
- 다중 프로젝트 관리 (현재 1개 프로젝트 집중)
