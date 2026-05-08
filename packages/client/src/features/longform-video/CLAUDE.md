# 롱폼 영상 모듈

Grok image-to-video + Gemini 분석 + Pillow/ffmpeg 렌더링 + YouTube 업로드.

## 폴더 구조

```
features/longform-video/
  api/longform.api.ts               # analyze, generateClip, generateAll, render, progress 폴링
  utils/timeline.utils.ts           # getEffectiveDuration, getSceneStartTime
  utils/ffmpeg-loader.ts            # FFmpeg.wasm 싱글톤 (fallback용, 미사용)
  utils/subtitle-canvas.ts          # Canvas 자막 PNG (fallback용)
  utils/client-renderer.ts          # 클라이언트 렌더러 (fallback용, 미사용)
  hooks/
    useLongformProject.ts           # 프로젝트 생성/삭제/기본값
    useTimeline.ts                  # 타임라인 상태 (play/pause/seek/trim/split/reorder)
    usePromptPresets.ts             # 프롬프트 프리셋 CRUD
  components/
    LongformVideoTab.tsx            # 메인 탭 (4단계 라우팅)
    PromptAnalysisStep.tsx          # Step 1: AI 프롬프트 분석
    VideoGenerationStep.tsx         # Step 2: Grok 영상 생성 (개별/전체)
    TimelineEditorStep.tsx          # Step 3: 타임라인 편집 (오케스트레이터)
    TimelinePreview.tsx             # 비디오 프리뷰 + 자막 오버레이
    TimelineControls.tsx            # 재생/시크/분할
    TimelineTrack.tsx               # 트랙 (video/sfx/subtitle/tts/bgm)
    TimelineClip.tsx                # 클립 (리사이즈/이동/재정렬 드래그)
    SubtitleStyleModal.tsx          # 자막 스타일
    RenderStep.tsx                  # Step 4: 서버 렌더링 + YouTube 업로드
    PromptPresetModal.tsx           # 프롬프트 프리셋 관리
```

## 서버 구조

```
server/src/
  services/longform.service.ts          # 분석/생성/렌더/진행률/YouTube/AI메타
  services/youtube-preset.service.ts    # YouTube 프롬프트 프리셋 (R2)
  controllers/longform.controller.ts
  controllers/youtube-preset.controller.ts
  routes/longform.routes.ts             # /api/longform/* + /youtube/*
  routes/youtube-preset.routes.ts       # /api/youtube-presets/*
  providers/grok.provider.ts            # xAI Grok image-to-video, 720p
  providers/youtube.provider.ts         # Google YouTube API (OAuth2 + upload + thumbnail)
  providers/longform.provider.ts        # Python 렌더링 호출 (LongformRenderOptions)
  scripts/generate_longform.py          # Pillow 자막 PNG + ffmpeg overlay/concat/amix
```

## 파이프라인

1. **프롬프트 분석** (Gemini): 페이지별 videoPrompt + Motion Matching (이전 장면 카메라 참조)
   - **AI 분석**: `POST /api/longform/analyze` — fire-and-forget + progressMap 폴링
   - **수동 제작**: `POST /api/longform/analyze-manual` — AI 없이 TTS 길이/clipDuration/자막만 채움. videoPrompt 보존, 프리셋 불필요.
   - progressMap에 `updatedAt` + 15초 하트비트 (finally에서 clearInterval)
   - 클라 stale detection: null 1분 또는 활동 15분 멈춤 시 에러 + 폴링 중단
   - `getAudioDuration`: fetch/ffmpeg 각 15초 타임아웃
2. **클립 생성** (Grok xAI): image-to-video, "no music/text/subtitles" 자동 포함, 720p
3. **타임라인 편집**: 트리밍 (trimStart/trimEnd), SFX/TTS 오프셋, 장면 순서 드래그, 분할
4. **렌더링** (네이티브 ffmpeg): Pillow → ffmpeg overlay → xfade 크로스디졸브 → amix → MP4
5. **YouTube**: OAuth2 → AI 메타 생성(프롬프트 프리셋) → 업로드 + 썸네일

## 렌더링 (`generate_longform.py`)

- MoviePy 완전 제거 → Pillow + ffmpeg subprocess
- Phase 1: 병렬 다운로드 (ThreadPoolExecutor 6워커)
- Phase 2: 씬별 Pillow 자막 PNG → ffmpeg overlay (한글 자동 줄바꿈, 외곽선, 반투명 배경)
- Phase 3: ffmpeg xfade (기본 0.5초)
- Phase 4: ffmpeg amix (SFX/TTS adelay + BGM, normalize=0)
- 최종: `-movflags +faststart` (브라우저 스트리밍)
- 프로덕션 = 시스템 ffmpeg (drawtext/libfreetype), 로컬 = ffmpeg-static
- 방어: ≤0.1초/0바이트 클립 스킵, xfade transition이 최단 장면보다 길면 자동 축소
- Node 측 `longform.provider.ts`: 비-JSON stderr를 tail 버퍼(30줄)에 누적

## YouTube Upload → R2 Auto-Cleanup (2026-05-01 정책)

업로드 성공 시 R2 archive mp4 자동 삭제 + `project.outputUrl=undefined`. YouTube 가 master copy. UI 의 R2 preview/download/short 섹션은 `{project.outputUrl && ...}` 조건부 → 자동 hide. 1회 정리: `cleanup-youtube-uploaded-mp4.mjs`. 상세: [memory/youtube-r2-cleanup-policy.md](../../../../../memory/youtube-r2-cleanup-policy.md).

## YouTube 업로드

- OAuth2 다채널 (`system/youtube-channels.json`)
- AI 메타: 프롬프트 프리셋 + 동화책 정보 → Gemini → title/description/tags/privacy/category/language JSON
- `POST /api/longform/youtube/generate-meta`
- `YouTubePreset { id, name, prompt, createdAt }` — R2에 JSON 저장
- 썸네일 sharp 1280×720 JPEG
- fire-and-forget + polling
- **다채널 자막 업로드**: `YouTubeUploadResult.channelId` 저장 → `captions.insert` 동일 채널로 호출. 누락 시 `findChannelIdForVideo` 보정
- **수동 연결**: `POST /api/{audiobooks|longform}/youtube/link-video` (URL 또는 11자 ID 파싱)

## LongformScene 핵심 필드

- `clipDuration`, `trimStart?`, `trimEnd?` — 트리밍
- `sfxUrl`, `sfxOffset?`, `sfxVolume` — 효과음
- `ttsUrl`, `ttsOffset?`, `ttsDuration?` — 나레이션
- `subtitles[]` — 자막 (startTime/endTime 상대값)
- `clipHistory[]` — 이전 클립 히스토리

## 다국어 버전 (master ↔ version)

- 최상위 = master, 자식 = version (`parentProjectId = master.id`)
- `addVersion()`: master scenes 복제 (clipUrl 포함), 타임라인 편집값(trim/offset)만 리셋
- **재분석 보존**: pageNumber 매칭된 기존 씬의 `clipUrl`/`clipHistory`/`trim*`/`sfxUrl`/offset/볼륨 유지, 언어 종속(videoPrompt/subtitles/ttsUrl/ttsDuration)만 갱신
- **자동 fallback**: 자식 버전 씬 clipUrl 누락 시 master 같은 pageNumber에서 복사 (TimelineEditorStep effect)

## 그림체 × 언어 매트릭스 (2026-05-08, unified)

`storybook.longformProjects` = `(artStyle, language)` 매트릭스. `parentProjectId` 폐기 → 모든 영상이 동등한 master. 외부 chip(/editor2) 단일 진실 소스.

- `LongformProject.artStyle?: string` (optional, 마이그 fallback) + `language` — 매트릭스 cell 키
- `lib/migrate-longform.ts:liftSubMasters` — `parentProjectId` 있는 sub-master 를 독립 master 로 lift + artStyle cascade. 사용자 액션 시 inline 만, 자동 R2 write X.
- `lib/group-by-style.ts` — `byLanguage` map per style group. version artStyle 미지정 시 master 따라감.
- `components/LongformProjectGroup.tsx` — collapsible 그룹. 헤더에 mini lang status (`🎨 paper-craft  ko · en  (2개 영상) ▼`). 본체 = activeLang cell만. 활성 lang 의 page 자료(text/ttsUrl) 누락 시 amber 경고 배너.
- `LongformVideoTab.tsx` — `activeStyle/activeLang` 외부 chip 에서 derive. `expandedStyles: Set<string>` accordion (외부 chip 변경 시 그 그림체로 reset, 사용자 헤더 클릭은 자유 toggle).
- 외부 그림체 chip swap → 그 그림체 그룹만 default 펼침. 다른 그룹 본체 안 보임 (페이지별 영상이 그 cell 자체 scenes 만 표시).
- 외부 lang chip swap → 같은 그룹 안 cell 자동 전환 또는 자동 생성.

## Cell 자동 생성 + 자동 채움 (2026-05-08)

명시적인 "+ 새 동영상" / "+ 영상 만들기" 버튼/모달 모두 제거 (`AddLongformProjectModal.tsx` 삭제, header 의 "복사" 버튼 제거). cell 은 외부 (style, lang) chip 선택 시 암묵적으로 등장:

- `LongformVideoTab.tsx` 의 useEffect: `(activeStyle, activeLang)` cell 부재 시 `addLanguageCell` 자동 호출. ref 가드로 StrictMode 더블 실행 + storybook update propagate 전 stale 상태 보호. cell 존재 확인되면 ref 해제 → 삭제 후 재선택 시 다시 생성.
- `cloneScenesForNewLang(src, langChanged, storybook, lang)`: 같은 그림체 다른 언어 master 의 `clipUrl`/`clipHistory`/`sfxUrl`/`videoPrompt`/타이밍 share. 언어 바뀌면 `storybook.pages[].translations[lang].{text, ttsUrl}` 에서 자동 매핑 (문장 단위 split 으로 자막 빌드). 번역 없으면 빈 채 두고 amber 경고 배너로 안내.
- `TimelineEditorStep.tsx` 의 useEffect: 기존 cell 의 빈 `ttsUrl`/`subtitles` 도 storybook 번역에서 자동 채움 (옛 마이그 cell 복구용). `hasFillable` 체크로 무한 루프 방지.

## TimelineEditorStep 단순화 (2026-05-08)

매트릭스 모델 도입으로 inline 컨트롤 제거:

- "자막/TTS 언어" select 제거 (외부 lang chip 단일 진실 소스, lang 변경 = cell 전환)
- Version tabs 1개 cell 일 땐 hide (`allProjects.length > 1` 가드)
- `parentProjectId` clipUrl fallback effect 폐기 → 위 자동 채움 effect 로 대체

## 슬라이더 race fix + onSave 디바운스 (2026-05-08)

- `LongformVideoTab.updateProject`: `onSave` 250ms 디바운스. BGM/SFX/TTS 슬라이더 드래그 시 R2 PUT 다발 발사 → AppLayout 의 `localRef = structuredClone(server)` 리셋 race 로 슬라이더가 "지맘대로 움직이는" 증상 fix. unmount 시 pending flush.
- `TimelinePreview.tsx`: SFX/TTS `play()` 직전에 `currentScene.sfxVolume/ttsVolume` 명시 set → 슬라이더 빠른 조작 시 race 방지

## BGM 루프 — 미리보기 + 렌더 양쪽 (2026-05-08)

짧은 BGM 도 영상 끝까지 들리도록 양쪽에서 처리:

- 렌더: `generate_longform.py` BGM input 에 `-stream_loop -1` (amix `duration=first` 가 silence base 길이로 컷)
- 미리보기: `TimelinePreview.tsx` BGM 동기화에서 `bgm.currentTime = currentTime % bgm.duration` modulo. 그냥 `= currentTime` 이면 BGM 30초 + 타임라인 60초일 때 범위 초과로 무음 → `<audio loop>` 가 발동 못 함. duration 미로드 (NaN/0) 일 땐 modulo 안 함.
