# 롱폼 영상 생성 탭 설계 문서

## 개요
동화책의 페이지(삽화+텍스트)를 분석하여 유튜브/릴스용 AI 영상을 생성하는 기능.
4단계 스텝 위저드: 프롬프트 분석 → 영상 생성 → 타임라인 편집 → 렌더링.

## 데이터 모델

### Storybook 확장

`packages/shared/src/types/storybook.ts`의 `Storybook` 인터페이스에 `longformProjects?: LongformProject[]` 필드 추가.

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

`longform-video` 탭을 EditorContent에 추가. `packages/client/src/store/editor.store.ts`의 EditorTab 유니온에 `'longform-video'` 추가.

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

모든 응답은 `{ success: true, data: T }` 또는 `{ success: false, error: string }` 형식.

```
# 프로젝트 CRUD (데이터는 storybook.longformProjects[]에 포함되어 저장)
# 프로젝트 생성/삭제/수정은 storybook 전체를 저장하는 기존 PUT /api/storybooks/:id 재사용.
# 클라이언트에서 storybook.longformProjects[]를 조작 후 storybook 전체 저장.

# 장면 분석
POST /api/longform/analyze              # 전체 장면 프롬프트 생성 (Gemini)
  Request:  { storybookId, projectId, promptPresetId }
  Response: { data: { scenes: LongformScene[] } }

POST /api/longform/analyze-scene        # 개별 장면 재분석
  Request:  { storybookId, projectId, sceneId, promptPresetId }
  Response: { data: { scene: LongformScene } }

# 영상 클립 생성
POST /api/longform/generate-clip        # 개별 클립 생성 (Grok)
  Request:  { storybookId, projectId, sceneId }
  Response: { data: { clipUrl, sfxUrl } }

POST /api/longform/generate-all         # 전체 클립 일괄 생성 (비동기, 폴링으로 추적)
  Request:  { storybookId, projectId }
  Response: { data: { message: '생성 시작됨' } }

GET  /api/longform/progress/:projectId  # 생성 진행률
  Response: { data: { progress: 0-100, step: string, currentScene?: number } | null }

# 렌더링
POST /api/longform/render               # 최종 합성 (비동기, 폴링으로 추적)
  Request:  { storybookId, projectId }
  Response: { data: { message: '렌더링 시작됨' } }

GET  /api/longform/render-progress/:projectId
  Response: { data: { progress: 0-100, step: string, outputUrl?: string } | null }
  # outputUrl은 렌더링 완료(progress=100) 시에만 포함

# BGM 업로드
POST /api/longform/upload-bgm           # BGM 파일 업로드 (multipart/form-data)
  Request:  file + { storybookId, projectId }
  Response: { data: { bgmUrl: string } }

# 프리셋 관리
GET    /api/prompt-presets               # 목록
POST   /api/prompt-presets               # 생성
PUT    /api/prompt-presets/:id           # 수정
DELETE /api/prompt-presets/:id           # 삭제
```

### Provider 확장 패턴

```typescript
// providers/grok.provider.ts
interface VideoGenOptions {
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration?: number;
}

interface VideoGenerationProvider {
  generateClip(prompt: string, options: VideoGenOptions): Promise<Buffer>;
  // 원본 영상(audio 포함) 반환. ffmpeg 분리는 서비스 레이어에서 처리.
}

export const GrokProvider: VideoGenerationProvider = { ... };
// 추후: RunwayProvider, KlingProvider 등 추가
```

### 데이터 흐름

```
분석:   페이지(삽화+텍스트) → Gemini → videoPrompt → storybook.longformProjects[].scenes[] 저장
생성:   videoPrompt → Grok API → 영상(video+audio) → 서비스 레이어
        → ffmpeg-static으로 오디오 분리 → clipUrl(음소거) + sfxUrl(효과음) → R2 업로드
렌더링: scenes[] + subtitles + TTS + SFX + BGM → Python/MoviePy → MP4 → R2 → outputUrl
```

### 자막 자동 생성

분석 단계(Step 1)에서 각 장면의 `subtitles[]`를 자동 생성:
1. 페이지 텍스트를 문장 단위로 분리 (기존 `split_sentences()` 로직과 동일: `.!?。` 기준)
2. TTS가 있으면 TTS 길이 기준으로 문장별 시간 배분 (글자 수 비율)
3. TTS가 없으면 `clipDuration` 기준으로 균등 배분
4. 사용자가 Step 3 타임라인에서 자유롭게 편집 가능

### TTS 로딩

- 기본: 각 페이지의 기존 `page.ttsUrl`(또는 해당 언어의 `translations[lang].ttsUrl`)을 자동 로드
- TTS가 없는 페이지는 타임라인에서 TTS 트랙이 비어있는 상태로 표시
- 타임라인에서 TTS 업로드/삭제/교체 가능 (기존 TTS 업로드 API 재사용)

### ffmpeg 의존성

기존 프로젝트에서 `ffmpeg-static`을 사용 중 (파닉스 음원 연결). 영상 오디오 분리에도 동일하게 사용:
```bash
ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3   # 오디오 추출
ffmpeg -i input.mp4 -an -vcodec copy output_muted.mp4    # 음소거 영상
```
서비스 레이어(`longform.service.ts`)에서 `child_process.execFile`로 ffmpeg-static 호출.

### 에러 처리

- **분석 실패**: 개별 장면 실패 시 해당 장면만 에러 표시, 나머지 계속 진행. 재분석 가능.
- **클립 생성 실패**: 개별 실패 시 해당 장면 에러 상태. 일괄 생성은 실패한 장면 건너뛰고 계속. 재생성 가능.
- **렌더링 실패**: 에러 메시지 표시 + 재시도 버튼. Python 프로세스 타임아웃 10분.
- **Grok API 타임아웃**: 클립당 최대 5분 대기. 초과 시 실패 처리.

### R2 저장 경로

```
storybooks/{id}/longform/{projectId}/clips/scene-{order}.mp4
storybooks/{id}/longform/{projectId}/sfx/scene-{order}.mp3
storybooks/{id}/longform/{projectId}/bgm.mp3
storybooks/{id}/longform/{projectId}/output.mp4
prompt-presets/{presetId}.json
```

### 타임라인 구현 방식

DOM 기반 구현 (Canvas 아님). 각 트랙은 `position: relative` 컨테이너, 클립은 `position: absolute`로 시간 비례 배치.
- 클립 너비 = (duration / totalDuration) * 컨테이너 너비
- 클립 left = (startTime / totalDuration) * 컨테이너 너비
- 재생 헤드: CSS transform으로 애니메이션
- 프리뷰: 영상 트랙의 클립 클릭 시 해당 클립만 재생, 재생 헤드 이동 시 전체 타임라인 재생

### 렌더링 파이프라인 (Python)

기존 `generate_audiobook.py`와 유사한 구조로 `generate_longform.py` 생성.
`child_process.spawn`으로 Python 호출 (기존 audiobook.provider.ts와 동일 패턴):

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
