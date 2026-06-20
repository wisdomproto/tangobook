# 모기 그림책 인터랙티브 이북 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

> ✅ **구현 완료** (2026-06-20, `feat/mosquito-ebook`) — 전 Chunk(1~5) 완료. 상세 memory `mosquito-ebook-2026-06-20`.

**Goal:** 일본 그림책 「모기의 항변」을 한국어·일본어 인터랙티브 웹 이북(`/ebook/mosquito`) + 언어별 mp4로 만든다. 깨끗한 이미지 위에 의성어/키워드/제목/라벨을 만화톤 애니메이션 오버레이로, 나레이션은 하단 자막 + TTS 낭독으로.

**Architecture:** 단일 데이터(`mosquito.ts`)가 하나의 Remotion 컴포지션(`MosquitoEbookComposition`)을 구동한다. 컴포지션은 전 페이지를 `<Sequence>`로 배치한 단일 타임라인. 웹은 `@remotion/player`로 현재 페이지 구간을 seek 재생(페이지 넘김 = seek), mp4는 같은 컴포지션을 `renderMedia`로 전체 렌더. 자산(이미지·TTS)은 R2 절대 URL.

**Tech Stack:** Remotion v4, `@remotion/player`, React 18 + Vite + TanStack Router, Gemini TTS(`gemini-2.5-flash-preview-tts`), Cloudflare R2, ffmpeg-static.

**Spec:** [docs/superpowers/specs/2026-06-20-mosquito-ebook-design.md](2026-06-20-mosquito-ebook-design.md) (개정: 1차 = 한국어·일본어)

**검증 철학:** 순수 로직(데이터 변환·좌표 유틸·TTS 스크립트)은 vitest로 TDD. 시각 산출물(애니·자막·레이아웃)은 Remotion **프리뷰 + 렌더 확인**으로 검증(스냅샷 픽셀 테스트는 YAGNI).

---

## 자산/소스 위치 (참조용, 절대경로)

- 깨끗한 이미지 31장: `C:\Users\101024\Documents\카카오톡 받은 파일\모기의_항변_추출\images2\page 1.png` ~ `page 31.png`
- 추출 데이터(원본 텍스트): `C:\Users\101024\Documents\카카오톡 받은 파일\모기의_항변_추출\모기의_항변.json` (`narration.{ko,jp}`, `imageText[]{type, ko, jp, ...}`)
- 원본(글자 박힌) 이미지: 같은 폴더 `images/page01.jpg` ~ (오버레이 좌표 추정용 참조)

---

## File Structure

**Remotion (`packages/remotion/src/`)**
- `data/mosquito-ebook.ts` — **신규**. 이북 데이터(타입 + `MOSQUITO_PAGES`). canonical source.
- `compositions/MosquitoEbookComposition.tsx` — **신규**. 전 페이지 `<Sequence>` 타임라인.
- `components/ebook/EbookPageScene.tsx` — **신규**. 페이지 1장: 이미지(contain+켄번스) + 오버레이 + 자막 + Audio.
- `components/ebook/OverlayText.tsx` — **신규**. 오버레이 1개: `anim`(drop/pop/shake/fade) 분기.
- `components/ebook/EbookSubtitle.tsx` — **신규**. 하단 자막.
- `utils/ebook-timing.ts` — **신규**. 페이지별 프레임 길이 산출(지연+TTS길이+패딩).
- `Root.tsx` — **수정**. `MosquitoEbook` Composition 등록 + `calculateMetadata`.

**Client (`packages/client/src/features/ebook-mosquito/`)**
- `pages/MosquitoEbookPage.tsx` — **신규**. `@remotion/player` 임베드 + 네비 + 언어 토글 + 자동재생 + 좌표 디버그 토글.
- `index.ts` — **신규**. export.
- `packages/client/src/router/index.tsx` — **수정**. `/ebook/mosquito` 라우트(AppShell 밖).

**Server scripts (`packages/server/scripts/`)**
- `mosquito-upload-images.mjs` — **신규**. `images2/*.png` → R2, URL 맵 출력.
- `mosquito-build-data.mjs` — **신규**. 추출 JSON + 이미지 URL 맵 → `mosquito-ebook.ts`의 `MOSQUITO_PAGES` 시드(좌표/애니는 빈값으로, 이후 수동 채움).
- `mosquito-tts.mjs` — **신규**. 페이지별 `narration.{ko,jp}` → Gemini TTS → R2, URL 맵 출력.
- `lib/mosquito-overlay-anim.test.mjs` 또는 vitest — 좌표/타이밍 유틸 테스트.

---

## Chunk 1: 자산 업로드 + 데이터 모델

**목표:** 이미지를 R2에 올리고, 추출 텍스트 + 이미지 URL로 데이터 골격을 만든다. (좌표/애니는 Chunk 3에서 프리뷰 보며 채움)

### Task 1.1: 이미지 px 측정 + 컴포지션 해상도 확정

**Files:** (조사만)

- [ ] **Step 1:** `images2`의 한 이미지 실제 px 측정.
  Run: `node -e "const s=require('sharp');s('이미지경로').metadata().then(m=>console.log(m.width,m.height))"` 또는 PowerShell `System.Drawing`.
  - sharp 미설치 시: `Add-Type -AssemblyName System.Drawing; [System.Drawing.Image]::FromFile($p).Size`
- [ ] **Step 2:** 전 페이지가 동일 비율인지 확인(서로 다르면 letterbox 정책 필요).
- [ ] **Step 3:** 컴포지션 해상도 결정 = 이미지 비율 × 적정 배율(예 1280×N). `data/mosquito-ebook.ts`에 `EBOOK_WIDTH`, `EBOOK_HEIGHT`, `EBOOK_FPS=30` 상수로 기록.
  Expected: 가로형(원본 ~√2:1) → letterbox 없이 contain.

### Task 1.2: 데이터 타입 정의

**Files:** Create `packages/remotion/src/data/mosquito-ebook.ts`

- [ ] **Step 1:** 타입 작성(아래). `MOSQUITO_PAGES`는 빈 배열 placeholder로 두고 다음 task에서 채움.

```typescript
export const EBOOK_FPS = 30;
export const EBOOK_WIDTH = 1280;   // Task 1.1 측정값으로 확정
export const EBOOK_HEIGHT = 905;   // Task 1.1 측정값으로 확정

export type EbookLang = 'ko' | 'ja';

export type OverlayAnim = 'drop' | 'pop' | 'shake' | 'fade';
export type OverlayKind = '의성어' | '키워드' | '제목' | '라벨';

export interface EbookOverlay {
  id: string;
  kind: OverlayKind;
  text: Record<EbookLang, string>;
  x: number;            // 0~1, 이미지 좌상단 기준 중심 위치
  y: number;            // 0~1
  anim: OverlayAnim;
  delaySec: number;     // 등장 지연
  fontSize: number;     // px (EBOOK_HEIGHT 기준)
  color: string;
  rotate?: number;      // deg
}

export interface EbookPage {
  page: number;
  imageUrl: string;                       // R2 절대 URL
  narration: Record<EbookLang, string>;   // 빈 문자열이면 자막/TTS 없음(표지 등)
  ttsUrl: Partial<Record<EbookLang, string>>;
  ttsDurationSec: Partial<Record<EbookLang, number>>; // TTS 오디오 길이(타이밍 산출용, Task 2.1에서 probe 저장)
  overlays: EbookOverlay[];
}

export const MOSQUITO_PAGES: EbookPage[] = []; // 시드 스크립트가 채움
```

- [ ] **Step 2:** `pnpm --filter @tangobook/remotion typecheck` (또는 루트 `pnpm typecheck`) → PASS.
- [ ] **Step 3:** Commit. `feat(ebook): mosquito ebook data types`

### Task 1.3: 이미지 R2 업로드 스크립트

**Files:** Create `packages/server/scripts/mosquito-upload-images.mjs`

- [ ] **Step 1:** 기존 R2 provider/스크립트 패턴 확인.
  Read: `packages/server/src/providers/r2.provider.ts` (또는 `*r2*`), 기존 backfill 스크립트(`packages/server/scripts/backfill-cache-control.mjs`)에서 R2 클라이언트 초기화·`buildR2Key`·Cache-Control 패턴 차용.
- [ ] **Step 2:** 스크립트 작성: `images2/page N.png` → webp 변환(`sharp().resize({ width:1536, withoutEnlargement:true }).webp({ quality:90 })` — 플랫 일러스트 밴딩 방지로 quality 명시) → R2 업로드. **키는 `buildR2Key`를 쓰지 말 것**(flat + `Date.now()` 접미사라 슬래시 경로 불가). **raw key** `ebook/mosquito/img/v1/page-NN.webp`를 직접 만들어 `uploadBufferToR2(buffer, key, 'image/webp')` 호출(`cacheControlFor`가 image→immutable 적용). 결과 `{page: url}` JSON 출력.
  - 키에 `v1` 버전 세그먼트 포함: 타임스탬프가 없어 immutable 캐시와 충돌하므로, **재업로드 시 `v2`로 버전업**해 캐시 버스트.
  - `--dry-run` 기본, `--apply`로 실제 업로드.
- [ ] **Step 3:** `--dry-run` 실행 → 31개 키 출력 확인.
- [ ] **Step 4:** `--apply` 실행 → R2 업로드, URL 맵을 `packages/server/scripts/_data/mosquito-image-urls.json`에 저장. curl 1건으로 200 확인.
- [ ] **Step 5:** Commit. `chore(ebook): upload mosquito clean images to R2`

### Task 1.4: 데이터 시드 스크립트(텍스트 + 이미지 URL → MOSQUITO_PAGES)

**Files:** Create `packages/server/scripts/mosquito-build-data.mjs`

- [ ] **Step 1 (test first):** vitest로 변환 함수 테스트 — 추출 JSON 한 페이지 객체 + URL 맵 입력 → 기대 `EbookPage`(narration ko/ja 매핑, overlays는 imageText에서 id/kind/text만, 좌표는 0/anim 기본 'fade'/delay 0) 산출.
  Run: `pnpm --filter server test mosquito-build` → FAIL.
- [ ] **Step 2:** 변환 함수 구현(`imageText[].type`→`kind`, `.ko/.jp`→`text`, narration 동일). 좌표/애니는 placeholder(추후 수동).
- [ ] **Step 3:** 테스트 PASS.
- [ ] **Step 4:** 스크립트가 `MOSQUITO_PAGES` 배열 리터럴을 `data/mosquito-ebook.ts`에 써넣음(코드 생성). `pnpm typecheck` PASS.
- [ ] **Step 5:** Commit. `feat(ebook): seed mosquito page data from extracted json`

---

## Chunk 2: TTS 생성 (한국어·일본어)

**목표:** 페이지별 나레이션을 Gemini TTS로 생성해 R2에 올리고 데이터에 URL 연결.

### Task 2.1: TTS 생성 스크립트

**Files:** Create `packages/server/scripts/mosquito-tts.mjs`

- [ ] **Step 1:** 기존 TTS provider 확인.
  Read: `packages/server/src/providers/gemini-tts.provider.ts` — **시그니처는 옵션 객체**: `generateGeminiTts({ text, voice, language }): Promise<Buffer>`. `language` 분기(`!== 'ko'`가 일반 경로) 확인.
- [ ] **Step 2:** 스크립트: 각 페이지 `narration.ko`(빈 문자열 제외) → `generateGeminiTts({ text, voice, language: 'ko' })` → raw key `ebook/mosquito/tts/v1/ko/page-NN.mp3`로 `uploadBufferToR2`. 동일하게 `narration.jp` → `language: 'ja'` → `tts/v1/ja/...`. (`buildR2Key` 사용 안 함 — Task 1.3과 동일 이유)
  - voice는 상수 1개(예: `Sulafat` warm). `--dry-run`/`--apply`.
  - 일본어 `language: 'ja'`는 provider의 `!== 'ko'` 일반 경로로 처리됨(확인). 안 되면 provider에 ja 보강.
- [ ] **Step 3:** `--apply`로 2페이지만 먼저(예 `--only=2,9`) 생성 → R2 URL 청취 확인(한·일 발음 정상).
  Expected: 한국어·일본어 낭독 자연스러움.
- [ ] **Step 4:** 전량 생성. 각 오디오의 **길이(초)를 probe**(`packages/server/src/utils/audio-duration.ts` 패턴 재사용) → URL+길이 맵 `_data/mosquito-tts-urls.json`(`{page, lang, url, durationSec}`).
- [ ] **Step 5:** `data/mosquito-ebook.ts`의 각 페이지 `ttsUrl` + `ttsDurationSec` 채우기(시드 스크립트 재실행 또는 patch). `pnpm typecheck` PASS.
- [ ] **Step 6:** Commit. `feat(ebook): generate ko/ja TTS for mosquito pages`

---

## Chunk 3: Remotion 컴포지션 (핵심 — 시각)

**목표:** 데이터로 구동되는 컴포지션을 만들고 Remotion Studio 프리뷰로 애니/자막/타이밍을 확정. 오버레이 좌표를 여기서 채운다.

### Task 3.1: 타이밍 유틸

**Files:** Create `packages/remotion/src/utils/ebook-timing.ts`, Test `*.test.ts`

- [ ] **Step 1 (test):** `pageDurationFrames(page, lang)` = `round((TTS_DELAY_SEC + ttsDuration + PADDING_SEC) * fps)`, TTS 없으면 `MIN_PAGE_SEC`. 입력 TTS 길이는 인자로 받음(렌더 시 probe). 테스트로 경계 검증.
  Run: `pnpm --filter @tangobook/remotion test ebook-timing` → FAIL → 구현 → PASS.
- [ ] **Step 2:** Commit. `feat(ebook): page timing util`

### Task 3.2: OverlayText (애니 분기)

**Files:** Create `packages/remotion/src/components/ebook/OverlayText.tsx`

- [ ] **Step 1:** 구현 — `useCurrentFrame` + `spring`/`interpolate`로 `anim`별:
  - `drop`: y -30%→0 바운스(spring), opacity 0→1
  - `pop`: scale 0→1.15→1 (spring overshoot)
  - `shake`: 등장 후 rotate sin 진동 몇 프레임
  - `fade`: opacity 0→1
  위치 `left:${x*100}%, top:${y*100}%`, `transform: translate(-50%,-50%)`, `delaySec*fps`만큼 지연(그 전 opacity 0). `fontSize`, `color`, `rotate`, 만화톤 그림자/외곽선 스타일.
- [ ] **Step 2:** Remotion Studio에서 단독 확인(임시 Composition 또는 다음 task와 함께).
- [ ] **Step 3:** Commit. `feat(ebook): OverlayText component with anim variants`

### Task 3.3: EbookSubtitle

**Files:** Create `packages/remotion/src/components/ebook/EbookSubtitle.tsx`

- [ ] **Step 1:** 하단 자막 — 반투명 박스 + 큰 폰트, `narration[lang]`, 페이지 진입 페이드 인. 빈 문자열이면 렌더 안 함. (RTL 불필요 — 한·일 LTR)
- [ ] **Step 2:** Commit. `feat(ebook): EbookSubtitle`

### Task 3.4: EbookPageScene

**Files:** Create `packages/remotion/src/components/ebook/EbookPageScene.tsx`

- [ ] **Step 1:** 구현 — `AbsoluteFill` 위에:
  1. 배경(크림색 `#f4f6ee` 또는 이미지 평균색)
  2. 이미지: `<Img>` `objectFit: contain` + 은은한 켄번스(scale 1.0→1.05). **`KenBurnsSlide` 컴포넌트는 재사용 불가**(cover·검은 배경 하드코딩) → `utils/ken-burns.ts`의 `getKenBurnsParams`만 재사용해 transform을 EbookPageScene 안에서 직접 구현. **cover 아님**(좌표 정합 필수)
  3. `overlays.map(OverlayText)`
  4. `<EbookSubtitle>`
  5. `narration[lang]` 있으면 `<Audio src={ttsUrl[lang]} startFrom={TTS_DELAY}>`
  - `lang`, `page`, `debugCoords?` props.
  - `debugCoords`면 좌표 그리드(10% 격자 + 오버레이 id 라벨) 표시.
- [ ] **Step 2:** Commit. `feat(ebook): EbookPageScene`

### Task 3.5: MosquitoEbookComposition + Root 등록

**Files:** Create `compositions/MosquitoEbookComposition.tsx`, Modify `Root.tsx`

- [ ] **Step 1:** 컴포지션 — props `{ lang: EbookLang, debugCoords?: boolean }`. `MOSQUITO_PAGES`를 **`<Series>`**로 연결(가변 길이 페이지 자동 시퀀싱), 각 `<Series.Sequence durationInFrames>` = `pageDurationFrames(page, lang, page.ttsDurationSec[lang])`.
- [ ] **Step 2:** `Root.tsx`에 `MosquitoEbook` Composition 등록 + `calculateMetadata`(전 페이지 길이 합, width/height = EBOOK_*). `defaultProps={{ lang:'ko' }}`.
- [ ] **Step 3:** `pnpm --filter @tangobook/remotion dev`(Remotion Studio) → 전 페이지 재생 확인.
- [ ] **Step 4:** Commit. `feat(ebook): MosquitoEbookComposition + register`

### Task 3.6: 오버레이 좌표/애니 채우기 (수동 + 프리뷰)

**Files:** Modify `data/mosquito-ebook.ts`

- [ ] **Step 1:** 원본(글자 박힌) 이미지 `images/pageNN.jpg`를 참조해 각 오버레이의 `x,y`(중심), `fontSize`, `color`, `rotate`, `anim`, `delaySec` 추정 입력. (의성어=drop/shake, 키워드=pop, 제목=fade 큰 글씨, 라벨=fade)
- [ ] **Step 2:** Studio에서 `debugCoords` 켜고 페이지별 위치 정합 확인 → 미세조정. 글자 많은 페이지(2,9,10,11,14,22,26,29,30,31) 우선.
- [ ] **Step 3:** Commit. `feat(ebook): overlay coordinates & anim per page`

---

## Chunk 4: 웹 이북 UI

**목표:** `/ebook/mosquito`에서 Player로 보고 페이지 넘김·언어 토글.

### Task 4.1: 라우트 + 페이지 골격

**Files:** Create `features/ebook-mosquito/pages/MosquitoEbookPage.tsx`, `index.ts`; Modify `router/index.tsx`

- [ ] **Step 1:** 기존 라우트 패턴 확인(Read `router/index.tsx`, AppShell 밖 풀스크린 라우트 예: `/vocabulary/:unitId`, `/library/:id`).
- [ ] **Step 2:** 빈 페이지 + 라우트 `/ebook/mosquito` 등록(AppShell 밖). `pnpm --filter client dev` → 라우트 200.
- [ ] **Step 3:** Commit. `feat(ebook): /ebook/mosquito route skeleton`

### Task 4.2: Player 임베드 + 페이지 seek 네비 + 언어 토글

**Files:** Modify `MosquitoEbookPage.tsx`

- [ ] **Step 1:** `@remotion/player` `<Player>`에 `MosquitoEbookComposition`, `inputProps={{lang}}`, `durationInFrames`=전체, fps=EBOOK_FPS, 컴포넌트 ref로 제어.
- [ ] **Step 2:** 페이지 경계 프레임 배열 계산(누적 길이). 이전/다음 버튼 = 해당 페이지 시작 프레임으로 `playerRef.seekTo()` + `play()`. 현재 프레임이 페이지 끝 도달 시 자동 일시정지(머무름).
- [ ] **Step 3:** 언어 토글(한국어/일본어) → `inputProps.lang` 교체(현재 페이지 유지). 다시듣기 버튼 = 현재 페이지 시작으로 seek+play. 페이지 인디케이터(n/31).
- [ ] **Step 4:** `preview_*` 도구로 `/ebook/mosquito` 로드 → 넘김·토글·자동재생 동작 확인(스크린샷).
- [ ] **Step 5:** Commit. `feat(ebook): player nav + language toggle`

### Task 4.3: 모바일 레이아웃 + 좌표 디버그 토글(dev)

**Files:** Modify `MosquitoEbookPage.tsx`

- [ ] **Step 1:** 반응형(태블릿/폰): Player 16:N 컨테이너 fit, 컨트롤 터치 크기. `preview_resize`로 확인.
- [ ] **Step 2:** dev 전용 `?debug=1`이면 `debugCoords` inputProp 전달(좌표 조정용).
- [ ] **Step 3:** Commit. `feat(ebook): responsive + coord debug toggle`

---

## Chunk 5: mp4 렌더

**목표:** 같은 컴포지션으로 언어별 mp4 출력.

### Task 5.1: 렌더 스크립트/명령

**Files:** Create `packages/server/scripts/mosquito-render.mjs` (또는 기존 렌더 서비스 재사용)

- [ ] **Step 1:** 기존 오디오북 렌더 경로 확인.
  Read: `packages/server/src/services/audiobook.service.ts`, `packages/server/src/utils/remotion-bundle.ts` — `bundle()` + `selectComposition()` + `renderMedia({ browserExecutable })` 패턴/Chromium 설정.
- [ ] **Step 2:** 스크립트: `selectComposition('MosquitoEbook', {lang})` → `renderMedia` → `out/모기_ko.mp4`, `모기_ja.mp4`. `browserExecutable`(CHROMIUM_PATH) 전달.
- [ ] **Step 3:** `lang:'ko'` 1건 렌더 → 영상 재생 확인(이미지·오버레이·자막·오디오 동기, 길이 정상).
- [ ] **Step 4:** `ja`도 렌더 확인.
- [ ] **Step 5:** Commit. `feat(ebook): render ko/ja mp4`

---

## 완료 기준 (Definition of Done)

- [ ] `/ebook/mosquito`에서 31페이지를 넘기며 본다. 페이지 진입 시 오버레이 애니 + 자막 + 낭독 자동재생, 끝에서 머무름.
- [ ] 한국어/일본어 토글 시 자막·오버레이·낭독이 해당 언어로 전환.
- [ ] 오버레이가 그림 위 올바른 위치에 만화톤으로 등장.
- [ ] `모기_ko.mp4`, `모기_ja.mp4` 정상 출력(동기·길이).
- [ ] 모바일(태블릿/폰) 레이아웃 정상.

## 리스크 / 메모

- **p11 도표 화살표**: 깨끗한 이미지에서 화살표도 지워짐 → 오버레이로 화살표 글리프/이미지를 추가하거나, 그 페이지만 화살표 포함 이미지 사용. Task 3.6에서 결정.
- **이미지 비율 불일치 페이지**가 있으면 letterbox 또는 페이지별 contain. Task 1.1에서 확인.
- **일본어 TTS voice**: 한 voice가 한·일 모두 자연스러운지 Task 2.1 청취로 확정(아니면 언어별 voice).
- **TTS 길이 캐시**: 렌더/타이밍에 필요하므로 Task 2에서 오디오 길이(초)도 데이터에 저장 권장(`ttsDurationSec`).
- **worktree**: 단발 작업이라 현재 브랜치에서 진행. 커밋은 사용자 워크플로우("업데이트/정리") 또는 명시 요청 시 push.
