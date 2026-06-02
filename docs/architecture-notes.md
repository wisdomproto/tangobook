# Architecture Notes — 데이터/성능/자료실/마이그레이션

루트 CLAUDE.md 가 다루지 못하는 횡단 관심사. 작업 시 필요할 때만 참고.

## 목차
- [세계명작 커리큘럼](#세계명작-커리큘럼)
- [Book Variants V2 (폐기됨)](#book-variants-v2-폐기됨)
- [자료실 — TopBar 📁](#자료실--topbar-)
- [Performance & Caching](#performance--caching)
- [자산 압축 (TTS/이미지)](#자산-압축-ttsimage)
- [단어/이미지 데이터 매핑 (snake_case 혼용)](#단어이미지-데이터-매핑-snake_case-혼용)

---

## 세계명작 커리큘럼
- **49권 × 레벨 variation = 114 storybook** (no.1~50, 43 중복 제외). 기존 30권(L3 완성) + 신규 19권(bid `1773xxxxxxxxx`)
- 레벨 분포 (2026-04-30 4단계→3단계 통합 후): L1 37 · L2 236 · L3 47. Variation ID 규칙: `${bid}__${level}` (launch 레벨은 bid 그대로). 기존 `__L4` suffix doc은 호환을 위해 ID 보존, readingLevel 필드만 update.
- 각 책 base에 `parentGuide`(overview/lessons/readingTips) 저장 → `BookDetailPage`에서 부모 가이드 섹션 노출
- 저술 스크립트: `scripts/author-classics-*.mjs`, `scripts/add-parent-guides.mjs`. **모두 Claude 직접 저술** (Gemini 0%)
- 원전: Grimm · Andersen · Perrault · Aesop · Jacobs · Wilde · Tolstoy · Collodi · Carroll · Baum · Swift · Kipling · Tchaikovsky · Hoffmann · Saint-Exupéry · Burnett · Ouida · Montgomery
- 정서 완화 (원전과 다름): 성냥팔이 / 빨간구두 / 인어공주 / 백조의호수 / 플란다스
- 커리큘럼 마스터: `packages/client/public/curriculum-master.html` + 사본 `docs/books/curriculum-master.html`
- 상세: [memory/classics-curriculum.md](../memory/classics-curriculum.md), [memory/reading-level-3tier.md](../memory/reading-level-3tier.md)

---

## Book Variants V2 (폐기됨 → 2026-05-02 노출 레이어 청산)
별도 v2 R2 prefix tree + EditorPageV2 시도 — v1 기능(캐릭터/핵심단어/페이지 등) 빠진 채 만들어졌다고 사용자가 강하게 분노. 별도 시스템 폐기. **2026-05-02 Library/BookDetail/Viewer 모두 v1 단일화 완료** — 노출 레이어의 v2 BookIndex/manifest 의존 모두 제거. 후속 통합은 [/editor2 단일 구조](../packages/client/src/features/editor/CLAUDE.md) 참조.

잔존 부채: GameListViewer 의 v2 hook (`useGamesList`/`useRuntimeGame`), 19권 v2-only 책 (4-25 EditorPageV2 잔재), R2 `books/` prefix 통째 정리.

상세:
- 사료: [memory/book-variants-v2.md](../memory/book-variants-v2.md)
- 정리 작업: [memory/library-v1-unification.md](../memory/library-v1-unification.md)

---

## 자료실 — TopBar 📁
TopBar 우측 `ResourcesDropdown` (`components/TopBar.tsx`) — 정적 HTML 페이지 3개. 모두 `packages/client/public/` + `docs/books/` 양쪽 사본:

### 1. 📋 사업 전략서 (`/strategy.html`, 2026-05-01 v2)
- 18 섹션, ~350KB, Hero · Vision · 시장분석 · 자산 4 카테고리 · 차별점 9개 · 콘텐츠 아키텍처 · 시스템 아키텍처 · 학습 루프 · UX · 게이미피케이션 · BM · 마케팅 · 경쟁 · SWOT · 로드맵 · KPI · 재무 · 클로징
- 차별점 9개: 그림체 10종 + 3단계 글밥 + 한·영 매칭 + 마스터리 리포트 + 포인트 게이미 + 유튜브 깔때기 + 카드 콜렉션 270장 + 도감 (학습 인증 후 활성)
- 인포그래픽 (SVG/CSS): 3축 통합 Venn(동화·파닉스·어휘) · 어휘 3 카테고리 Venn · 마스터 어휘 학습 축 + 1,500단어 5 카테고리 · 망각 곡선 + Review Points · 친숙도 맵 1,500셀 (JS auto-fill) · 호리 놀이터 7 게임 mockup
- BM: 무료/유료/포인트 **3축 분배 룰** (포인트는 디지털만, 오프라인 굿즈 X, 유료 잠금해제 X, 광고 X). 4 플랜 (Free/Plus 9,900/Family 14,900/School 99k)
- 시각: 24개월 timeline · 경쟁사 2×2 · SWOT 4분면 · KPI 4 게이지 · 수익원 도넛
- Gemini 28장 sample: `packages/client/public/strategy-samples/`
- 생성 스크립트: `packages/server/scripts/generate-strategy-samples.mjs --only [style|card|cover|encyclopedia]`
- 60+ 용어 호버 툴팁 (TAM/CAC/LTV/Phonics/CVC 등)
- 상세: [memory/strategy-document-v2.md](../memory/strategy-document-v2.md)

### 2. 📚 커리큘럼 마스터 (`/curriculum-master.html`)
- 마스터 정적 리스트 + DB 동기화 (`/api/storybooks` fetch → bid/title 매칭 + sibling variant 검사)
- `Storybook.koCompletion` 필드로 완성도 자동 갱신
- DB-only 자동 등록: 마스터에 없는 DB 책을 `folder` 키워드로 분류해 자동 노출, `🆕 DB` 뱃지
- bid 자동 보충, 모달 그림체 갤러리, visibilitychange 자동 refresh

### 3. 🔤 어휘 마스터 (`/vocabulary-master.html`)
- Cambridge Pre A1 Starters ~381 단어. 토픽 16개 (Animals/Body/Food/... — 기능어 제외)
- 4 탭: ⭐ 마스터 / 📚 동화책 어휘 / 🔤 파닉스 어휘 / 🌐 전체
- `/api/vocabulary-db` (1,198 entries) + `/api/storybooks` 매칭
- 토픽별 진척률(%) + 색상 코딩, 검색 + 상태 필터

상세: [memory/master-pages.md](../memory/master-pages.md)

---

## YouTube Upload → R2 Auto-Cleanup (2026-05-01 정책)
YouTube 업로드 성공 시 R2 archive mp4 자동 삭제. YouTube 가 master copy. R2 비용 절약.

**구현 위치**:
- `audiobook.service.ts#uploadToYouTube` (line ~325)
- `longform.service.ts#uploadToYouTube` (line ~1170)

**패턴**:
```ts
const oldOutputUrl = project.outputUrl;
project.youtubeUpload = { videoId, ... };
project.outputUrl = undefined;
await R2Repository.saveStorybook(storybook);

if (oldOutputUrl) {
  deleteFromR2(urlToR2Key(oldOutputUrl)).catch(err => console.warn(...));
}
```

**UI 처리**: `RenderStep.tsx` 의 R2 preview/download 섹션은 `{project.outputUrl && ...}` 조건부 → outputUrl 사라지면 자동 hide. 사용자는 YouTube embed/link 로 영상 확인.

**1회 정리 스크립트**: `packages/server/scripts/cleanup-youtube-uploaded-mp4.mjs`
- dry-run (default) → list 만 / `--apply` → 실삭제
- 정책 변경 후 잔여 mp4 정리에 재사용 가능

**1회 정리 결과 (2026-05-01)**: 39 mp4 / 6.44 GB 회수.

상세: [memory/youtube-r2-cleanup-policy.md](../memory/youtube-r2-cleanup-policy.md)

---

## Storybook Copy — Deep Clone + 진행률 (2026-05-01)
동화책 복사 시 R2 객체를 zero-copy CopyObject 로 복제 (URL 분리). 영상 mp4 는 복사 X (용량). 공유 라이브러리(phonics-library/BGM/system-sounds/hori/mascot/strategy-samples/collection) 는 URL 그대로.

**JSON walker 5단계 패턴** (`storybook.service.ts#_copyImpl`):
1. fetch original + 복사번호 계산 (`-복사본(N)`)
2. strip `audiobookProjects`/`longformProjects` (영상 제거)
3. JSON.stringify → R2 public URL regex 추출 (uniqueUrls)
4. 공유 prefix 제외 → `dupTargets[]`
5. `Promise.all(CopyObject)` 병렬 + 매 객체마다 progress 갱신 → JSON 일괄 치환 → save

**API**:
- `POST /api/storybooks/:id/copy-async` → `{ taskId }` (fire-and-forget)
- `GET /api/storybooks/copy-progress/:taskId` → `{ current, total, status, newId?, error? }`

**클라**: `useCopyStorybookAsync` 훅 — 700ms polling + `CopyProgressModal` (스피너 → % → 체크). [features/storybook/CLAUDE.md](../packages/client/src/features/storybook/CLAUDE.md) 참조.

상세: [memory/storybook-copy-deep-clone.md](../memory/storybook-copy-deep-clone.md)

---

## Performance & Caching
- **서버 storybook list 캐시** (`r2.repository.ts`):
  - 5분 in-memory 캐시 + `stale-while-revalidate`
  - R2 동시 다운로드 30
  - 서버 기동 시 `prewarmStorybookListCache()` (fire-and-forget) → 첫 사용자 요청 23ms
  - **Stuck refresh recovery**: 90초 넘게 pending 이면 강제 재시도. R2 SDK `downloadFromR2` 에 timeout(20s/15s) 보호 (`withR2Timeout` 헬퍼)
- **R2 이미지 HTTP 캐시** (`r2.provider.ts` `cacheControlFor`):
  - 업로드 시 contentType 기반 `Cache-Control` 자동 분기 — 이미지/오디오/영상 = `public, max-age=31536000, immutable`, JSON = 헤더 없음 (고정 key 덮어쓰기라 캐시 금지). 호출처 수정 없이 전 업로드 자동 적용.
  - **immutable 안전 근거**: `buildR2Key`(`utils/r2-key.ts`)가 모든 자산 key 에 `Date.now()` 를 박아 콘텐츠 변경 시 URL 자체가 바뀜 → 같은 URL = 영원히 같은 바이트.
  - 기존 이미지 backfill: `scripts/backfill-cache-control.mjs` (dry-run 기본 / `--apply`, `CopyObject` + `MetadataDirective:REPLACE`, 본문 무변경·멱등). 2026-06 16,713장 적용 완료(실패 0). `.r2.dev` 는 Cloudflare CDN edge 캐시도 활용.
- **클라이언트 에셋 프리로드**:
  - `hooks/useAssetPreloadProgress(urls)` — 확장자로 audio/video/image 판별 후 `new Audio()`/`<video>`/`new Image()`. CORS 없이 브라우저 HTTP 캐시 hit. deps는 `[key]`만.
  - `features/audiobook/hooks/useTtsDurations` — 모듈 레벨 `durationCache` Map 영구 캐시
  - `components/AssetLoadingOverlay` — "X / Y · NN%" 큰 숫자 + 진행바
  - 사용처: `AudiobookProjectCard`, `TimelineEditorStep`
- **BookCard**: `loading="lazy"` + `decoding="async"` + 명시 `width/height` (640×360)

상세: [memory/perf-optimizations.md](../memory/perf-optimizations.md)

---

## 자산 압축 (TTS/이미지)
- **TTS**: Gemini PCM → `pcmToMp3()` → MP3 128kbps mono 24kHz (`audio/mpeg`)
- **이미지**: Gemini PNG → `imageToWebp()` → WebP quality 85 (`image/webp`)
- `packages/server/src/utils/transcode.ts` — `pcmToMp3`, `wavToMp3`, `imageToWebp`
- `R2Repository.uploadImage(base64, key)` — 내부에서 WebP 변환 + `.webp` 자동 치환
- 마이그레이션 1회성 완료 (211권, 3,369MB → 688MB, 79.6% 절감): `scripts/migrate-assets.ts` + `cleanup-old-assets.ts` + `restore-from-manifest.ts`
  - `_migrations/` R2 prefix 매니페스트 (롤백 가능)
  - `_backup/` R2 prefix 원본 백업

상세: [memory/asset-compression.md](../memory/asset-compression.md)

---

## 단어/이미지 데이터 매핑 (snake_case 혼용)
동화책·파닉스는 "핵심단어"라는 같은 개념을 다른 필드명으로 저장. R2 호환성 때문에 리팩토링 안 함.

| 데이터 | 동화책 | 파닉스 |
|--------|:------:|:------:|
| 핵심단어 + 학습어휘 (통합) | `key_objects[]` | `flashcards[]` |
| 핵심단어 이미지 | `keyObjectImages[]` (별도) | `flashcards[].imageUrl` (객체 내부) |
| ~~`educational_content.vocabulary[]`~~ | **deprecated 2026-04-30** — read 호환만 유지 | 동일 |
| 어휘 이미지 | `vocabularyImages[]` (별도) | N/A |
| 블렌딩/단어패밀리 | N/A | `phonicsLesson.blending[]` / `.wordFamilies[]` |

### 통합 지점
- `VocabularyDbService` — 모든 소스를 `VocabEntry { word, korean, sources[] }` 로 통합
- `collectStorybookImagePool()` → `{ word, korean, imageUrl, ttsUrl? }` (동화책용 게임)
- `collectPhonicsWordPool()` → `{ word, imageUrl, ttsUrl }` (파닉스용 게임)
- `getEffectiveVocabulary(sb)` — `key_objects` 우선 + 레거시 `vocabulary` 합집합 (lc 중복 제거). `VocabularyItem[]` 반환

### Phase 1+2 완료 (2026-04-30)
- AI 생성 prompt — `educational_content.vocabulary` 제거, `key_objects` 에 `definition/example` 직접 생성
- 9개 callsite 전환 (game.service / marketing-helpers / Speaking/WordWriting ConfigPanel / ConnectTheDotsPlayer / MetaView)
- 358권 마이그 (1,115 merge + 1,329 new). 마이그 스크립트 `scripts/migrate-vocabulary-to-keyobjects.mjs` 보관

### snake_case 혼용 (레거시)
- `key_objects`, `educational_content`, `scene_description` = snake_case (R2 기존 데이터)
- `keyObjectImages`, `vocabularyImages`, `illustrationUrl` = camelCase (나중 추가)
- 새 필드는 항상 camelCase

상세: [memory/data-structure-analysis.md](../memory/data-structure-analysis.md), [memory/vocabulary-unification.md](../memory/vocabulary-unification.md)

---

## 알려진 코드 중복 (허용 수준)
- flashcard 추출: `phonics-data-helpers.ts` + `game.service.ts` 내 3곳
- 한글/영어 단어 선택: `isKorean ? localWord : word` 패턴 4곳
- 향후 중복 심해지면 공통 `collectUnifiedWordPool()` 함수 도입 검토
