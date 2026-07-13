# 롱폼 오디오북 마케팅 영상 파이프라인 — 설계

> 상태: 설계 확정 대기 · 작성 2026-07-13

## 1. 배경 / 목표

editor2 각 동화책에는 오디오북 렌더 인프라(Remotion `Audiobook` 컴포지션 + `AudiobookService`)가 있다. 이 인프라로 동화책마다 **그림체(artStyle) × 언어(language) 조합의 롱폼 영상**을 자동 생성해 마케팅 모듈의 **롱폼 탭**(현재 id=`youtube`)에 등록한다. 유튜브 업로드가 목적이므로 화질·fps·썸네일·다국어 자막을 갖춘다.

현재 롱폼 탭(`YoutubePanel`)은 AI 대본/씬 타임라인 편집기(`mkt_youtube_cards`)다. 이 씬 편집기를 **제거**하고, 롱폼 탭을 **렌더된 오디오북 영상 + 자동 메타 + 다국어 자막 + 디자인 썸네일** 패널로 교체한다.

### 목표

- 동화책 1권의 (artStyle × language) 조합마다 1080p/30fps 롱폼 mp4 렌더
- 제목·설명(캡션)·태그를 Gemini로 자동 생성
- 그 책 보유 언어 전체(예: ko·en·vi·zh·th)로 자막(SRT) 자동 생성
- 디자인된 16:9 썸네일 렌더
- 마케팅 롱폼 탭에 등록·표시, 유튜브 발행(영상 + 다국어 자막)
- **첫 산출물 = 샘플 1개**: 개구리 왕자 × paper-craft × ko

### 비목표 (이번 범위 밖)

- 51개 명작 전권 일괄 렌더 (샘플 검증 후 별도)
- 새로운 오디오북 컴포지션/애니메이션 (기존 `Audiobook` 컴포지션 재사용)
- 마케팅 발행 스케줄러 연동 (기존 유튜브 업로드 경로 재사용, 자동 예약 발행은 추후)

## 2. 확정된 결정

| 항목 | 결정 |
|---|---|
| 샘플 범위 | 개구리 왕자(`1772009873865`) × paper-craft × ko = 영상 1개. dry-run(로컬 mp4) → 전체(R2+등록) 순서 |
| 화질/fps | 1080p 30fps — 기존 오디오북 설정(base 1280×720 × `scale:1.5`, `imageFormat:'png'`, `crf:16`, faststart) 재사용 |
| 등록 대상 | 롱폼 탭 = `mkt_youtube_contents`. (artStyle × language) 조합당 1행 |
| 자막 언어 | 그 책 `languages[]` 전체 자동 생성 |
| 썸네일 | 디자인 템플릿(16:9 Remotion still): 그림체 대표 일러스트 + 언어별 제목 + 탱고북 브랜딩 |
| 롱폼 패널 나열 | 상단 언어 탭(기존) + 그림체 서브탭 2단 |
| 씬 편집기 | 제거 (`mkt_youtube_cards` UI 삭제, 테이블은 미사용 보존) |

## 3. 데이터 구조 (검증 완료)

개구리 왕자 실측:

- 그림체별 페이지 이미지: `storybook.styleAssets[artStyle].pageIllustrations["<n>"].illustrationUrl` — **페이지번호(문자열) 키 맵**
- 언어별 텍스트/음성: `storybook.pages[n].translations[lang].{text, ttsUrl}` (ko는 base `page.text`/`page.ttsUrl`)
- 언어별 표지: `storybook.styleAssets[artStyle].primaryCoverByLang[lang]` (폴백: `styleAssets[artStyle].coverImage` → `storybook.coverImage`)
- 그림체 목록: `storybook.availableStyles` (없으면 `styleAssets` 키 또는 `[artStyle]`)
- 마케팅 콘텐츠 행: `mkt_contents` 에 `memo = 'storybook:<bookId>'` 로 1행 존재 (개구리 왕자 확인됨)

핵심: **그림체 = 이미지 선택 축**, **언어 = 텍스트·TTS·표지·자막 축**으로 완전 분리된다.

## 4. 아키텍처 / 컴포넌트

### 4.1 스타일 인식 렌더 빌더 (shared, 순수 함수)

`packages/shared/src/utils/audiobook-props.ts` 에 추가:

```
buildStyledAudiobookRenderData(
  storybook: Storybook,
  opts: { artStyle: string; language: string;
          subtitle/bgm/cover 기본값(선택) }
): AudiobookRenderData
```

- 페이지 이미지 = `styleAssets[artStyle].pageIllustrations[String(pageNumber)].illustrationUrl`
- 텍스트/TTS = `translations[language]` (ko=base)
- 표지 = `styleAssets[artStyle].primaryCoverByLang[language]` → 폴백 체인
- 반환 타입은 기존 `AudiobookRenderData` 그대로 → **기존 `Audiobook` 컴포지션 무변경 재사용**
- 그림체에 해당 페이지 이미지가 없으면 그 페이지는 스킵(빈 슬라이드 방지). 유효 슬라이드 0개면 호출부가 에러 처리
- **순수 함수 + 단위 테스트**: 이미지/텍스트 축 분리, ko/비-ko, 폴백, 결측 페이지 스킵 케이스

기존 `buildAudiobookRenderData(storybook, project)` 는 보존(오디오북 탭이 사용 중).

### 4.2 디자인 썸네일 컴포지션 (Remotion still)

`packages/remotion/src/compositions/LongformThumbnail.tsx` (1280×720, `durationInFrames:1`).

- 입력 props(zod schema): `{ title, heroImageUrl, styleLabel?, lang }`
- 레이아웃: 배경 = hero 일러스트(그림체 대표 페이지 또는 클린 표지) blur/scale 채움, 전경 = 반투명 패널 + 언어별 제목 큰 글자(폰트 = 언어별, `cover-fonts` SSOT 참조) + 탱고북 로고
- `Root.tsx` 에 Composition 등록 (`AdThumbnail`/`ReelThumbnail` 선례 그대로)
- 렌더 = `renderStill` → PNG

### 4.3 배치 렌더 파이프라인 (server 스크립트)

`packages/server/scripts/render-book-audiobooks.ts` (`render-book-reels.ts` 미러).

인자: `--book=<id> --style=<artStyle> --lang=<code> [--dry-run] [--owner-email=<email>]`

절차 (1개 조합):
1. `fetchStorybook(bookId)`
2. `buildStyledAudiobookRenderData(storybook, {artStyle, lang})` → renderData
3. TTS 길이 probe (기존 `probeTtsDurations` 로직 재사용) + BGM 길이 probe
4. bundle → `selectComposition('Audiobook', renderData)` → `renderMedia`(codec h264, imageFormat png, scale 1.5, crf 16, timeout 600s, concurrency 1, `gl:'angle'`) → faststart
5. `selectComposition('LongformThumbnail', thumbProps)` → `renderStill` → PNG
6. `--dry-run` 이면 로컬 mp4/png 경로만 출력하고 종료
7. 아니면: R2 업로드(`mkt/{projectId}/longform/{bookId}-{style}-{lang}-{ts}.mp4`, 썸네일 `...-thumb-...png`)
8. 자동 메타 생성(§4.5) + 다국어 자막 생성(§4.5)
9. 마케팅 등록(§4.4)

Remotion lazy import·`withTimeout` 네트워크 가드는 reels 파이프라인 패턴 그대로.

**멱등성/재실행**: 같은 (book, style, lang) 재실행 시 §4.4 매칭으로 기존 행을 update(중복 행 X). `--force` 없으면 이미 `video_url` 있는 조합은 렌더 스킵(썸네일/메타만 갱신 옵션 `--meta-only`는 추후 배치 확장에서). 향후 51권 일괄 배치의 resume 근거.

### 4.4 마케팅 등록 서비스 (server)

`packages/server/src/services/reel/` 옆에 `longform-publish.ts` (또는 `audiobook-publish.ts`). `reel-publish.ts` 의 `resolveMarketingTarget`(memo=`storybook:<id>`)·`resolveOwnerUserId` 재사용.

```
connectLongformToMarketing({
  bookId, artStyle, language, aspectRatio,
  videoUrl, thumbnailUrl, meta, captions, ownerUserId
}): 'updated' | 'inserted' | 'skipped'
```

- `mkt_contents`(memo=`storybook:<bookId>`) 없으면 `'skipped'`
- **행 매칭/중복 방지 (명시)**: `mkt_youtube_contents` 에서 `content_id` 로 전 행을 fetch(조합 수 적음, 책당 최대 그림체×언어) 후 **`video_settings->>'artStyle' === artStyle && video_settings->>'language' === language`** 로 JS 매칭. 매칭 행 있으면 update, 없으면 insert (**조합당 1행** — 중복 생성 금지). JSONB 필터를 SQL로 밀지 않고 JS 매칭하는 이유: supabase-js 로 `->>'key'` eq 필터가 되지만 조합 수가 작아 fetch-후-매칭이 단순·안전.
- 저장 컬럼:
  - `video_url` = mp4 URL
  - `thumbnail_url` = 썸네일 URL
  - `video_title` = meta.title, `video_description` = meta.description, `video_tags` = meta.tags, `video_category` = meta.categoryId
  - `target_duration` = `'long'`
  - `status` = `'draft'`
  - `video_settings`(신규 컬럼, §5) = `{ bookId, artStyle, language, aspectRatio, captions: { [lang]: srt } }`
  - `user_id` 스탬프 필수(RLS)

### 4.5 메타·자막 생성 (기존 로직 재사용, 순수화)

`AudiobookService` 에 이미 존재하는 로직을 순수 헬퍼로 추출해 파이프라인과 오디오북 서비스가 공유:

- **메타**: `generateYouTubeMeta` 의 프롬프트 조립을 `buildYoutubeMetaPrompt(storybook, { language, aspectRatio })` 로 추출(순수). 파이프라인이 `generateTextWithGemini` 호출 후 JSON 파싱(기존 파싱 로직 재사용). 반환 = `{ title, description, tags, categoryId, privacy, language }` — **`privacy` 필드 유지**(기존 오디오북 탭이 `YouTubeGeneratedMeta.privacy` 의존, 동작 불변 위해). 롱폼 마케팅 경로는 privacy 미저장. 프롬프트가 쓰는 `getPageText`(현재 audiobook.service 모듈 private)도 헬퍼 옆으로 이동.
- **자막**: `generateSrt(renderData)`(기존, renderData 기반) + `translateSrt(baseSrt, baseLang, targetLang)`(기존) 재사용. base 언어 = 렌더 언어, 타깃 = 책 `languages[]` 전체. 반환 = `{ [lang]: srt }`
  - 🔴 **선행 수정**: `translateSrt` 의 `LANGUAGE_NAMES` 맵에 현재 ko/en/ja/zh/es/fr/de 만 있어 **vi/th 누락**. 미등재 언어는 프롬프트에 raw 코드가 들어가 번역 품질 저하 → **vi(Vietnamese)·th(Thai) 추가**(및 향후 책 언어 커버). 이 수정 없이는 "as-is 재사용"이 성립 안 함.
- 추출 후 `AudiobookService.generateYouTubeMeta`/`generateCaptions` 는 추출된 헬퍼를 호출하도록 리팩터(동작 불변, 기존 오디오북 탭 회귀 없음)

### 4.6 롱폼 패널 재작성 (client)

`YoutubePanel.tsx` → 렌더 영상 패널로 교체(파일 대체 또는 신규 `LongformPanel.tsx` + `ContentTabs` id 매핑 유지).

제거: 씬 카드 타임라인, AI 대본 생성, `mkt_youtube_cards` 관련 훅 사용, `YoutubeCardItem`/`YoutubePreviewDialog` 마운트.

표시(현재 언어 탭 + 그림체 서브탭 기준 셀 1개):
- **영상 플레이어** (`<video>` `video_url`) — 없으면 "아직 영상이 없어요" 안내(reels 패널의 빈 상태 패턴)
- **디자인 썸네일** 미리보기(`thumbnail_url`)
- **자동 메타** 편집 폼: 제목(`video_title`)·캡션/설명(`video_description`)·태그(`video_tags`) — `useUpdateYoutubeContent` 로 저장(디바운스)
- **다국어 자막** 목록: `video_settings.captions` 의 언어별 SRT 유무 뱃지 + 다운로드/복사. (생성은 파이프라인이 이미 채움; 패널은 표시·수정 위주)
- **발행** 액션: 유튜브 업로드(영상) + 다국어 자막 업로드 — 기존 `AudiobookService.uploadToYouTube`/`uploadCaptions` 경로 재사용(§7). 발행은 사용자 트리거

데이터: `fetchContentGraph` 가 `mkt_youtube_contents` 를 이미 로드. `video_settings` 컬럼을 그래프/타입에 추가.

## 5. DB 마이그레이션

`supabase/migrations/2026-07-13-youtube-video-settings.sql`:

```sql
ALTER TABLE mkt_youtube_contents
  ADD COLUMN IF NOT EXISTS video_settings jsonb;
```

- 단일 컬럼 추가. 기존 RLS(owner) 그대로 적용. 기존 행은 NULL(하위호환).
- `art_style`/`language`/`captions` 를 별도 컬럼으로 두지 않고 `video_settings` JSONB 로 묶는다: 마이그 최소화 + reels(`mkt_instagram_contents.video_settings`) 패턴과 일관.
- client `types/database.ts` `YoutubeContent` 에 `video_settings: Record<string, unknown> | null` 추가.

## 6. 렌더 스펙 (유튜브)

- 해상도: 컴포지션 base 1280×720 × `scale:1.5` = **1920×1080**
- fps: 30 (renderData.fps=30, 컴포지션 calculateMetadata 반영)
- 코덱: h264, `imageFormat:'png'`, `crf:16`, `-movflags +faststart`
- 썸네일: 1280×720 PNG (`renderStill`)
- 근거: 정지 일러스트 + Ken Burns 슬라이드라 30fps로 충분, 1080p는 유튜브 권장 기준 충족. 4K/60fps는 비용 대비 이득 낮아 비채택(추후 필요 시 `scale:3`).

## 7. 유튜브 발행 (재사용)

- 영상 업로드: `AudiobookService.uploadToYouTube` 는 audiobookProject 기반. 롱폼 탭 발행은 `mkt_youtube_contents.video_url` 을 R2에서 받아 `YouTubeProvider.uploadVideo` + 썸네일 세팅 하는 **얇은 마케팅 발행 경로**를 신설(기존 provider 재사용). 결과 `youtube_video_id`/`published_at`/`status='published'` 저장.
- 자막 업로드: `video_settings.captions[lang]` 를 `YouTubeProvider.uploadCaption(videoId, lang, srt, channelId)` 로 순회 업로드(기존 provider 재사용).
- 이번 샘플은 **등록·표시까지 필수**, 발행 버튼은 배선하되 실제 업로드는 사용자 트리거(선택).

## 8. 샘플 실행 계획 (개구리 왕자 × paper-craft × ko)

1. `render-book-audiobooks.ts --book=1772009873865 --style=paper-craft --lang=ko --dry-run` → 로컬 mp4 + 썸네일 png. 화질·타이밍·썸네일 눈으로 확인.
2. OK면 dry-run 제거 재실행 → R2 업로드 + 메타 자동생성 + 5개 언어 SRT + `mkt_youtube_contents` 등록.
3. 롱폼 패널(재작성)에서 영상·제목·캡션·자막 뱃지·썸네일 확인.

## 9. 테스트

- **순수 함수 단위 테스트(vitest)**:
  - `buildStyledAudiobookRenderData`: 이미지=스타일축/텍스트=언어축 분리, ko=base, 비-ko=translations, 표지 폴백 체인, 결측 페이지 스킵, 유효 슬라이드 0 처리
  - `buildYoutubeMetaPrompt`: 언어·페이지 요약 포함 여부
  - `connectLongformToMarketing` 의 순수 부분(행 매칭·upsert 분기)은 가능하면 supabase-admin 목으로 분리, 어려우면 조합키 결정 로직만 순수화해 테스트
- **회귀**: 추출 리팩터 후 기존 오디오북 탭 메타/자막 생성 동작 불변 확인(기존 테스트 있으면 통과, 없으면 스냅샷)
- **수동 검증**: dry-run mp4 재생, 롱폼 패널 렌더

## 10. 리스크 / 완화

- **그림체별 페이지 이미지 결측**: 일부 그림체가 일부 페이지 이미지 없음 → 페이지 스킵 + 경고 로그. 유효 슬라이드 0이면 그 조합 실패 처리하고 계속.
- **마케팅 콘텐츠 행 부재**: `memo='storybook:<id>'` 없으면 `'skipped'` + 로그(reels와 동일). 개구리 왕자는 존재.
- **씬 편집기 제거 파급**: `YoutubeCard` 훅/컴포넌트가 다른 곳에서 참조되는지 확인 후 제거. `mkt_youtube_cards` 테이블·훅은 미사용 보존(드롭 안 함)으로 롤백 여지 유지.
- **Chromium 렌더(Railway)**: 기존 audiobook.service 와 동일 `browserExecutable`/`CHROMIUM_PATH`/`gl:'angle'` 조건 사용.
- **비용**: Gemini 메타 1회 + 자막 번역 N-1회/조합. 샘플은 1조합이라 미미.

## 11. 파일 요약

신규:
- `packages/remotion/src/compositions/LongformThumbnail.tsx` (+ Root.tsx 등록)
- `packages/server/scripts/render-book-audiobooks.ts`
- `packages/server/src/services/reel/longform-publish.ts`
- `supabase/migrations/2026-07-13-youtube-video-settings.sql`
- `packages/client/src/features/marketing/components/content/LongformPanel.tsx` (YoutubePanel 대체)
- 테스트: `audiobook-props.test.ts`(styled builder), 메타 프롬프트 테스트

수정:
- `packages/shared/src/utils/audiobook-props.ts` (+ `buildStyledAudiobookRenderData`)
- `packages/server/src/services/audiobook.service.ts` (메타/자막 로직 순수 헬퍼 추출·재사용)
- `packages/client/src/features/marketing/types/database.ts` (`YoutubeContent.video_settings`)
- `ContentTabs`/`ContentPage` 라우팅(롱폼 탭 → LongformPanel)
- `api/queries.ts` fetchContentGraph (youtube `video_settings` 포함)
```
