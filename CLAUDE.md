# 탱고북 저작도구 — Claude Code 프로젝트 가이드

AI 기반 유아동 동화책 + 파닉스 + 어휘 저작도구. Gemini로 스토리/이미지/TTS 자동 생성.

## 기술 스택
- **Monorepo**: pnpm workspaces (`packages/{client,server,shared,remotion}`)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3
- **Backend**: Express v5 + TypeScript + tsx
- **AI**: Google Gemini (텍스트/이미지) · Grok xAI (영상) · OpenAI Whisper (음성, optional)
- **Storage**: Cloudflare R2 (S3 호환)
- **Audio/Video**: ffmpeg-static · Remotion v4 (오디오북) · Pillow + ffmpeg (롱폼)
- **Auth**: Supabase (게스트 모드 graceful degradation)

## 폴더 구조
```
packages/
  shared/src/{types,constants,utils}/   # Storybook/Page/KeyObject 등 도메인 타입
  server/src/{routes,controllers,services,repositories,providers,utils,middleware}/
  remotion/src/                          # AudiobookComposition + entry.ts
  client/src/{lib,store,router,pages,features,components,design-system}/
docs/                                    # superpowers/specs, books, architecture-notes
memory/                                  # 사용자 auto-memory (장기 컨텍스트)
```

## 백엔드 레이어
```
Request → routes → controllers → services → repositories/providers
```
- routes: URL 매핑만 / controllers: req 파싱 + try/catch + next(err) / services: 비즈니스 로직 (AppError 던지기) / repositories: R2 / providers: Gemini/R2 SDK 싱글톤
- 응답 통일: `res.json({ success: true, data })` / 실패는 `throw new AppError(404, '메시지')` (errorMiddleware)

## 프론트엔드 상태관리
- **TanStack Query**: 서버 데이터 (storybooks, units, balance 등)
- **Zustand** (`store/editor.store.ts`): UI 상태만 (selectedId, activeTab, 모달)
- **금지**: Zustand에 서버 데이터 저장
- API 패턴: `apiGet/apiPost/apiDelete` (`lib/axios.ts`) → `features/{name}/api/*.api.ts` → `features/{name}/hooks/use*.ts`

## Feature 모듈 구조
```
features/{name}/{api,hooks,components,index.ts}
```

## 디자인 시스템 — single source of truth
**Reference**: [docs/design-system.md](docs/design-system.md) — 색/폰트/컴포넌트 + GPT 시안 prompt 템플릿 + Claude 가 시안 받을 때 protocol. 새 화면 시안 받을 때 매번 이 문서 참조.

## 디자인 시스템 — 아이콘
- 프리미티브: `<AppIcon src="category/animal.png" size={48} />` (`design-system/primitives/AppIcon.tsx`)
- 자산 위치: `packages/client/public/icons/{category,section,tab}/*.{png,svg,webp}`
- AI 생성 일러스트 (coral #FF6F61 + peach #FFE4D6 톤) — Khan Kids × 곰돌이푸 × Duolingo
- **카테고리 sprite (2026-05-19)**: `/icons/category/sprite.webp` (1536×1536, 3×3, 512/cell). LibraryPage `CATEGORY_SPRITE_MAP` 으로 9개 카테고리 (세계명작/전래동화/공룡/곤충/육지/바다/하늘/식물/우주와 자연) inline background-position 렌더. 매핑 없는 카테고리(우리 몸 이야기 등)는 이모지 폴백.
- **학습 리포팅 아이콘**: `/icons/section/reports.webp` (AppShell 사이드바 부모 영역).
- Cambridge 토픽 매핑: `features/vocabulary-unit/lib/cambridge-icon-map.ts`
- 마스코트 호리: `public/mascot/hori/*.webp` 그대로 (Mascot 컴포넌트)
- 미사용 슬롯 (호리 게임·뷰어 툴바 등) 은 이모지 폴백 유지

## 디자인 시스템 — 폰트 (2026-05-03)
- **Body / UI**: Pretendard Variable (한국 모던 앱 표준, 한글+Latin 조형 통일, 가변 38KB)
- **Display / Heading (`font-display`)**: NanumSquareRound (둥근 한글체, 4-5세 친화)
- 정의: `tailwind.config.ts` 안에 inline (typography.ts import 캐시 이슈 우회). `index.css` 에 jsdelivr CDN @import.

## 디자인 시스템 — 그림체 (2026-05-03)
- 책마다 `Storybook.artStyle` (마지막 active, 자동 갱신) + `defaultStyle` (사용자 명시 대표) 분리
- `defaultStyle` = 라이브러리 표지 imageUrl 노출에 우선 사용 (없으면 artStyle fallback)
- /editor2 그림체 칩에 ⭐/☆ 토글로 대표 지정. `styleAssets[styleId]` 가 그림체별 표지·캐릭터·페이지 일러스트 분리 보관

## 학습자 화면 헤더 통일 (2026-05-10)
- **`<PageHeader>`** (`design-system/primitives/PageHeader.tsx`) — 학습자 화면 공용 헤더. 흰 wash 카드 (`bg-white/60 backdrop-blur shadow-soft rounded-3xl`) + 좌 ← 뒤로 가기 (peach pill `bg-peach-100 text-xl`) + 가운데 children + 우 right slot. 사용처: BookDetailPage / VocabularyStudyPage.
- **`<GameHeader>`** (`features/games/components/GameHeader.tsx`) — 게임 전용. 동일 wrapper 톤 + 가운데 ★ title current/total ★ 형식. 사용처: LineMatching / KoreanBlock / EnglishBlock / ConnectTheDots / WordWriting.
- **메인 페이지 (LibraryPage)** 와 **AppShell 내부 페이지** 는 별도 (LibraryPage = absolute overlay / AppShell = sticky 자체 헤더).

## MVP 출시 정책 (2026-05-09)
- **사이드바**: 동화책 axis 만 active (alwaysActive). 파닉스/어휘 axis = `comingSoon` 음영 + "준비 중" sub-label (코드/라우트 보존). `AppShell.PRIMARY_AXES`. `/library` 일 때 헤더 = `position: absolute` transparent overlay (hero 일러스트가 헤더 영역까지 풀폭) + 사용자 chip / 로그아웃은 `pointer-events-auto` floating.
- **LibraryPage** (`/library`): hero 배너 (`aspect-[5/2] md:aspect-[4/1]`) `bg-[url('/images/library-hero.png')] bg-cover`. 큰 제목/권수 텍스트 X (일러스트와 충돌). 검색바 hero 하단 floating (`absolute inset-x-0 bottom-6` + `bg-white shadow-pop`). 책 카드 = 일러스트 풀 (`aspect-video rounded-2xl`) + 아래 제목만 (Card 배경/패딩 X).
- **BookDetailPage** (`/library/:id`): AppShell **밖** 라우트 (사이드바 X, 풀폭). 헤더 right = 기본 정보 chip 들 (🌍 카테고리 / 📖 타입 / 📕 페이지 / Aa 단어 / 🌱 타겟 연령 — `readingLevel` 우선, 없으면 `targetAge` `'4-5'` → `'4~5세'` 폴백). hero = 좌 column(그림체·언어 선택 바 + 정방형 표지) + 우 column(모드 카드 3개 stack). **그림체·언어 선택 바**는 표지 위 한 줄: 좌측 `flex-1` 그림체 바(← / "🎨 그림체 고르기" / → — 그림체 이름 미노출, ≥2일 때만) + 우측 `shrink-0` 둥근 깃발 토글(언어 ≥2일 때만). **부모 가이드 패널**(본문 접기/펴기) = 책 특징 + 교훈 + 읽어주는 법 + FAQ (`storybook.parentGuide.faq` details/summary). 외부 SEO 페이지 `/library/:id/about` (BookSeoPage) 는 헤더 링크 없이 SEO/JSON-LD 유입 채널로만 살아있음.
- **모드 카드 3개**: 책으로 읽기 (coral) / 영상으로 보기 (violet-blue, 영상 없는 책=disabled 음영) / 단어 익히기 (yellow→amber). 가로 긴 형태 — 좌 제목+부제 / 우 흰 동그라미 워시 (`bg-white/85 + ring-2 ring-white`) 안 PNG 일러스트 / 우끝 → 화살표.
- **모드 일러스트**: `public/icons/mode/{book,video,word}.png` (soft 3D rendered 톤, 그림체 독립적). PNG 베이크된 체크무늬 배경 → `packages/server/scripts/strip-checkerboard-bg.mjs` 로 4 모서리 floodfill 후처리.
- **VocabularyStudyPage** (`/vocabulary/:unitId`): AppShell **밖** (학습 풀화면). 메인 진입 = BookDetailPage 의 "단어 익히기" 카드. `VocabularyStudyContent` 컴포넌트 = 단어 미리보기 + 게임 카드 4 (Duolingo push button + 좌상단 번호 1·2·3·4) — BookDetailPage / VocabularyStudyPage 공용.

## 단어 마스터 표 (2026-05-11)
- **`/vocabulary-table-ko.html`** — 자료실 dropdown 📊 신규. 동화책 keyObject 만 source. 음절·받침·쌍자음·이중모음·복잡받침·ㅐㅔ 점수로 난이도 분류 (Lv1≤1.5 / Lv2≤3 / Lv3≤6 / Lv4>6).
- 비-명사 자동 필터: ~다/한/운/은/른/픈/쁜/인/던/의/히 어미 + 추상명사 + 고유명사 블랙리스트 + 4음절+ 복합명사 자동 분해 (2:N 양쪽 단일 명사) + 중간 ~의/과/와 조사 합성 + EXTRA_NOUNS 보조 사전.
- 표 12 컬럼 헤더 클릭 정렬. 영어 input · 카테고리 select 인라인 편집. ✏️ 한글 수정 / 🗑️ 제거. 행 클릭 → 출연 동화책 모달.
- **vocab-overrides API**: `GET/PUT /api/vocab-overrides` → R2 `_index/vocab-overrides.json`. localStorage X, dirty 플래그 + 명시 💾 저장 + beforeunload 경고.
- 영어 `vocabulary-master.html` 도 verbs/adj/adv 토픽 제거 + 어미 패턴 (~ly·ful·less·ous·ive·able·ish) 자동 필터.

## 한글 파닉스 학습 모드 (2026-05-20)
- **`/library/phonics/korean(/:unitId)?`** — AppShell **밖** 풀화면 study layout. `KoreanPhonicsStudyPage` 가 두 라우트 모두 처리. recent unit 자동 redirect (`localStorage` `phonics-recent-unit`).
- **레이아웃**: 상단 `PageHeader` (책 상세 / 어휘 학습과 동일 톤) + 좌측 전체 커리큘럼 스크롤 list (한글1~4 + 모든 units, level sticky h2) + 우측 `KoreanPhonicsUnitPage embedded` (back 링크 hide).
- **자음 단원 자동 생성**: `makeConsonantPlan(consonant)` ([korean-phonics-units.ts](packages/client/src/features/phonics-learner/lib/korean-phonics-units.ts)) — 한글1 u02 (ㄱ) ~ u15 (ㅎ) 13개. 4 learn (Tap/BlendListen×2/Write) + 4 game. subtitle 은 `syllablesFor(c, vowels)` 로 `composeHangul` 자동 생성 ("나 냐 너 녀 노 뇨" 등). 자음만 다르게, 컴포넌트 100% 재사용.
- **Block 게임 난이도 자동**: `unit.levelIndex >= 3 ? 'medium' : 'easy'`. 한글1/2 easy, 한글3 (쌍자음) / 한글4 (복잡 모음) medium picker.
- **익히기/게임하기 카드 시각**: 완료 시 success/15 + 큰 ✓ overlay (우상단 동그라미) + dim 텍스트. 게임하기는 완료 개념 없음 (showDone 시그널 무시).
- **점잇기 keypoints styleAssets sync** ⭐: KeyObjectTab keypoint 저장 시 top-level + `styleAssets[artStyle].keyObjectImages` 동시 mirror. 이전엔 top-level 만 update → 점잇기 게임 어댑터 (`derive-storybook-unit.ts`) 가 styleAssets[style] 에서 읽어 keypoints 못 찾던 버그. 기존 18권 마이그 (`packages/server/scripts/sync-keypoints-to-styleassets.mjs`).

## 핵심단어 영어 번역 일괄 적용 (2026-05-19)
- **스크립트 5종** (`packages/server/scripts/`): `scan-untranslated-keyobjects.mjs` (전 책 스캔 → `_data/untranslated-keyobjects.json` per-book ko+pages+pageTexts) · `condense-untranslated.mjs` (단어당 짧은 context 1줄 압축) · `prepare-batch.mjs N` (앞 N권 추출 + 기존 사전 reuse auto-fill + 잔여 manual list) · `apply-translations.mjs [file]` (번역 map `{ bookId: { tr: { ko: en } } }` 적용 → `POST /api/storybooks { storybook }`) · `merge-and-apply-batch.mjs` (auto+manual 머지 후 apply).
- **원칙**: 페이지 텍스트 context 기반 동음이의어 분리 (지팡이 wand vs cane / 다리 leg vs bridge / 바람 wind vs hope / 화가 anger vs painter).
- **POST /api/storybooks** body 는 `{ storybook: {...} }` wrapper 필수. raw object 보내면 500 "Cannot read properties of undefined (reading 'id')".
- **누적**: 95권 / 361단어 적용 (세계 명작 45권 + L variant/파닉스 50권). 남은 58권 / 252단어.

## 핵심단어 에디터 (2026-05-18)
- **`/key-object-editor.html`** — 저작도구 자료실 dropdown ✏️. 페이지 텍스트 기반 keyObject 재분류 + 책별 편집기.
- **분석**: `packages/server/scripts/classify-by-page-text.mjs` — 모든 책의 page.text 를 한국어 토큰화 (조사 strip) → Wiktionary REST API 로 Noun 만 필터 → 책별 `keep` (텍스트에 있는 기존 keyObject) / `delete` (텍스트에 없음) / `add` (텍스트에서 새로 발견된 명사) 산출. Wiktionary cache `_data/wiktionary-cache.json` (재실행시 즉시).
- **UI**: 좌측 책 list (검색·카테고리 필터·DEL/ADD chip·"DEL/ADD 있는 책만" 토글). 우측 (1) ADD 후보 grid (+ 개별/모두 추가) (2) 직접 추가 input (3) 기존 keyObjects 표 (텍스트 없는 단어 자동 빨간색 + 일괄 삭제 버튼) (4) 💾 저장.
- **데이터 source**: 정적 분석 결과 `packages/client/public/_analysis/text-based-classify.json` (스크립트 매번 갱신, gitignored). 저장 시 `POST /api/storybooks` 로 R2 직접 반영.
- **그림체 dropdown swap (LevelEditCard)**: 활성 chip 옆 `▼ 그림체 변경` select — 라이브러리 16 preset 전체 노출 (현재 ✓ / 추가됨 표기). 선택 시 availableStyles 에 있으면 즉시 swap, 없으면 추가 확인 모달. `findArtStylePreset(value, lib?)` 시그니처 변경 — R2 라이브러리 라벨 우선 (사용자 편집 이름 적용).
- **server fix (r2.repository.ts normalizeStorybook)**: `keyObjectImages[]` 에 `null` entry 있던 일부 책 (e.g. 헨젤과 그레텔*) 이 silent catch 로 404 → null 필터링 추가. `getStorybook` catch 에 error log 추가 (silent swallow 방지).

## 블록 게임 레벨 선택 + 공유 (2026-05-11)
- 사이드바 sub-button: "한글 블록 게임" / "알파벳 블록 게임" 라벨 + 옆에 📤 공유 버튼 (Web Share API + clipboard fallback).
- `/games/{korean,alphabet}-block` → 레벨 선택 화면 (🌱 쉬움 / 🌿 보통 / 🌳 어려움, 각 단어 수 표시) → 그 레벨 단어에서 랜덤 N개 → 플레이어.
- 한글 레벨: vocab table 점수 공식 그대로. 영어 레벨: 단어 길이 (≤3/4-5/6+).
- 게임 어댑터 (`game-data-adapter.ts#unitTo{Korean,English}BlockData`): 이미지 없는 단어도 후보 포함 (player 가 conditional render).

## 라이브러리 마스터 (2026-05-10, 카테고리 편집 2026-05-16)
- **`/library-master`** — 라이브러리 노출 순서 + 카테고리 CRUD + 책 메타 편집 페이지 (저작도구 진입점 only). TopBar 우상단 📁 자료실 ▾ dropdown 첫 항목 "📚 라이브러리 마스터". AppShell (학습자) 에서는 노출 X.
- 좌-우 split: 좌측 카테고리 패널 (DnD reorder + ✏ 인라인 rename + 🗑 삭제 + ＋ 추가 input) + 우측 활성 카테고리 책 grid (DnD reorder, 카드 = aspect-3/4 표지 + 좌상단 ① 순서 chip · 카테고리 chip 드롭다운 + 우상단 👁 isPublic 토글 · 🎨 표지 변경) + 🎨 표지 변경 모달.
- **DnD scope (2026-05-18 단순화)**: 카테고리 reorder + 같은 카테고리 안 책 reorder **2종만**. 카테고리 변경은 카드 좌상단 `CategoryChipDropdown` 으로만 (책 카드 드래그 시 "순서 변경 모드"와 헷갈리는 UX 제거).
- **카테고리 CRUD**: 빈 카테고리만 즉시 삭제 가능. 책 있으면 `MoveBooksModal` 로 target 카테고리 선택 후 일괄 이동 + 카테고리 삭제. 이름 변경 = 그 카테고리의 모든 책 `category` 필드 일괄 patch (`useCategoryActions`).
- **/library-master 만 비공개 책 표시** (편집 대상). 학습자 `/library` 는 기존처럼 isPublic=true 만 노출.
- **backup 카테고리 (2026-05-18)**: 비공개 책(variant `__L*` / 사본 / 자연관찰 prefix 등) 격리용. 일괄 이관 스크립트 `packages/server/scripts/migrate-private-to-backup.mjs` (`--dry`/`--apply`). 학습자 `/library` 는 isPublic=false 라 어차피 안 보임 — 마스터에서 backup 카테고리로 모아 시야 정리.
- **언어 토글 (2026-05-16)**: 부제목 줄 우측 "표지 언어: [🇰🇷 한글][🇺🇸 영어]" chip → defaultStyle 기준 `coversByLang[lang]` 으로 카드 표지 swap. 해당 언어 표지 없으면 📭 placeholder + "한글/영어 표지 없음". 서버 `StorybookSummary.coversByLang` 신규 필드 (defaultStyle 의 `styleAssets.primaryCoverByLang` 추출, ko 는 top-level `primaryCoverByLang`/`coverImage` fallback).
- **카테고리 (2026-05-16 재분류, 233권)**: 🌟 세계 명작 68 / 📜 전래 동화 14 / 🦕 공룡 친구들 24 / 🐛 곤충 친구들 18 / 🐯 육지 동물 친구들 46 / 🐬 바다 동물 친구들 18 / 🦅 하늘 동물 친구들 16 / 🌸 식물 친구들 18 / 🌌 우주와 자연 7 / 🫀 우리 몸 이야기 4. 마이그: `propose-recategorize.mjs` (룰 + 세계 명작/전래 동화 보호 + 수동 override) → `recategorize-proposal.json` 사람 검토 → `migrate-recategorize.mjs --apply` (R2 PutObject + library-config.json 갱신).
- 저장: `_index/library-config.json` (`LibraryConfig` shared type — `categoryOrder[]` + `bookPriority[cat] = string[]` + `categoryList[]` 빈 카테고리 보관). 서버 `GET/PUT /api/library-config`. LibraryPage 가 config 적용해서 카테고리/책 순서 정렬 (빈 카테고리는 학습자 화면 자동 hide). **카테고리 chip 클릭 후 전체 보기**도 `bookPriority` 순서 우선 (단 사용자가 "제목순" 명시 선택 시 그건 존중) — 첫 화면 카테고리 섹션 9권 미리보기와 일관성.

## 동일 title 동화책 차단 (2026-05-10)
- `R2Repository.saveStorybook` 진입점에 validation. **신규 또는 title 변경 시에만** 체크 (audiobook 생성 등 부수 update 통과). variant `__L\d+$` (같은 baseId) / storybook ↔ phonics 는 충돌 X.
- 충돌 시 `AppError(409, '같은 이름의 동화책이 이미 있어요: "..."')`. 클라 `useStorybookMutations` 의 save/patch/generate(/Phonics) `onError` 가 `alert("⚠️ ...")`.
- 마이그 (룰 A 콘텐츠 우선): `pages` desc → `key_objects` desc → `characters` desc → `createdAt` asc 1위 keep, 나머지 `-1`/`-2` suffix. 21 그룹 / 23권 적용 완료. 스크립트 `packages/server/scripts/{dump-duplicate-titles,migrate-rename-duplicate-titles}.mjs`.

## 모듈별 가이드 (해당 폴더 작업 시 자동 로드)
- 동화책 (CRUD/사이드바/복사) → [features/storybook/CLAUDE.md](packages/client/src/features/storybook/CLAUDE.md)
- 학습 게임 → [features/games/CLAUDE.md](packages/client/src/features/games/CLAUDE.md)
- 롱폼 영상 → [features/longform-video/CLAUDE.md](packages/client/src/features/longform-video/CLAUDE.md)
- /editor2 (3축 variation) → [features/editor/CLAUDE.md](packages/client/src/features/editor/CLAUDE.md)
- 뷰어 + 디자인 시스템 → [features/viewer/CLAUDE.md](packages/client/src/features/viewer/CLAUDE.md)
- 오디오북 (Remotion) → [features/audiobook/CLAUDE.md](packages/client/src/features/audiobook/CLAUDE.md)
- 파닉스 (저작) → [features/phonics/CLAUDE.md](packages/client/src/features/phonics/CLAUDE.md)
- 파닉스 학습자 (/library/phonics) → [features/phonics-learner/CLAUDE.md](packages/client/src/features/phonics-learner/CLAUDE.md)
- 마케팅 (블로그/카드뉴스) → [features/blog/CLAUDE.md](packages/client/src/features/blog/CLAUDE.md)
- Auth (Supabase) → [features/auth/CLAUDE.md](packages/client/src/features/auth/CLAUDE.md)
- Learning Reports → [features/learning/CLAUDE.md](packages/client/src/features/learning/CLAUDE.md)
- 별/호리/놀이터 → [features/rewards/CLAUDE.md](packages/client/src/features/rewards/CLAUDE.md)
- Hori 아케이드 → [features/arcade-games/CLAUDE.md](packages/client/src/features/arcade-games/CLAUDE.md)
- 어휘 단원 → [features/vocabulary-unit/CLAUDE.md](packages/client/src/features/vocabulary-unit/CLAUDE.md)
- 횡단 (커리큘럼/자료실/캐싱/자산/snake_case) → [docs/architecture-notes.md](docs/architecture-notes.md)

## 자주 쓰는 커맨드
```bash
pnpm dev              # client + server 동시
pnpm typecheck        # 모든 패키지
pnpm build / lint
pnpm --filter {server|client|shared} {dev|build|...}
```

## 환경변수
`packages/server/.env` (template: `.env.example`).
- 선택: `OPENAI_API_KEY` (Whisper fallback) / `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (`packages/client/.env.local`, 없으면 게스트 모드)
- Supabase 셋업: `scripts/supabase-setup.sql` 을 SQL Editor 에 실행

## Gemini 모델
- Default 텍스트: `gemini-3.1-pro-preview` (`DEFAULT_TEXT_MODEL` shared / `config.gemini.textModel` server, `GEMINI_TEXT_MODEL` env override)
- 자동 폴백: overload(503/UNAVAILABLE/429/overloaded/RESOURCE_EXHAUSTED) 시 `gemini-2.5-flash-lite`
- retry 래퍼 `withGeminiRetry`: 5회, exp backoff + jitter, 시도당 120s 타임아웃
- 배치 작업(seed 등)은 `--model gemini-2.5-flash-lite` 권장

## 새 Feature 추가
1. `features/{name}/api/{name}.api.ts` (apiGet/apiPost)
2. `features/{name}/hooks/use{Name}.ts` (TanStack Query)
3. `features/{name}/components/`
4. `features/{name}/index.ts` (exports)
5. 라우트 `client/src/router/index.tsx`

## 코딩 컨벤션
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸/API)
- 컴포넌트: named export (pages는 default)
- 에러: `AppError(status, message)` 사용. console.error 대신 throw
- 주석: 자명한 코드에 X. 복잡한 로직만
- import: `@tangobook/shared` (shared 타입), `@/` (client 내부)

## R2 데이터 호환성
- 기존 동화책 211+권이 R2에 저장됨. `Storybook` 인터페이스 호환 유지
- 새 필드는 `optional`로 추가 (하위 호환성)
- snake_case 혼용은 [docs/architecture-notes.md](docs/architecture-notes.md) 참조

## 주요 타입 위치
- `Storybook`, `Character`, `Page`, `KeyObject`, `BlendingExercise`, `ParentGuide`, `ReadingLevel`, `VocabularyUnit`, `BookManifest` → `@tangobook/shared`
- `ApiResponse<T>` → `@tangobook/shared`
- `AppError` → `packages/server/src/middleware/error.middleware.ts`

## PRD 문서
`docs/PRD_*.md` (Master / AuthorTool_Storybook / AuthorTool_Phonics / Viewer / Marketing / v2 / UIUX_AuthorTool)

## 마케팅 자료 (2026-05-14, 확장 2026-05-16)
`docs/marketing/` — 키워드 리서치·통합·전략 시각화 풀 파이프라인. 자세한 가이드는 `docs/marketing/README.md`.

**데이터 소스 4종**:
- `data/naver-keywords-raw.json` + `naver-analyzed.json` (네이버 카테고리 시드 4,024)
- `data/naver-content-raw.json` (네이버 콘텐츠 시드 200+ → 22,289, rate-limit 적용) + `naver-discovered-bonus.json` (보너스 20,602)
- `data/dataforseo-kr.json` (Google Ads KR) + `dataforseo-en.json` (Google Ads US)
- `data/consolidated-keywords.json` + `consolidated-summary.md` (4개 소스 통합 + 교차검증 + 골든)

**스크립트** (`scripts/`): `content-seeds.mjs` (시드 단일 진실원천, KR/EN × 13 카테고리) · `naver-content-keyword-research.mjs` · `dataforseo-keyword-research.mjs` · `consolidate-keywords.mjs` · `audit-noise-and-mine.mjs` · `generate-seo-html.mjs`.

**자격증명 환경변수**: `NAVER_AD_API_KEY/SECRET/CUSTOMER_ID` · `DATAFORSEO_LOGIN/PASSWORD`. 절대 하드코딩 X.

**자료실 등록 HTML 3종** (저작도구 TopBar 📁 자료실 ▾):
- `/seo-strategy.html` 🔍 SEO 전략 — `generate-seo-html.mjs` 가 자동 생성. consolidated-keywords.json 갱신 후 재빌드 필요
- `/operations-playbook.html` 🎯 운영 플레이북 — 본질 베타 → 점진 확장 + 비즈니스 모델(무료·광고 / 유료·광고제거 + ⭐포인트 통합) + 8-Pronged 알림 작전 + 듀얼 블로그(자체+네이버) + 5종 바이럴 자석
- `/viral-magnets-wireframes.html` 🚀 바이럴 자석 UI — 5종 자석 모바일 와이어프레임 (디자인·개발 발주서)

**전략 핵심 결정** (operations-playbook.html 에 모두 반영):
- 명작 동화 플랫폼 브랜딩 (AI 양산 사이트와 정반대 포지셔닝)
- 베타 = 오픈 베타 + 바이럴 자석 + 본질 검증 (게임화·AI 자녀동화·별·호리 모두 제외)
- 풀스펙 9개 + 라이트 31 + 자연관찰 30~40 → 주 2개 풀스펙 보강 (16주)
- 정식 런칭(M3+) 시 ⭐ 포인트 시스템 통합 — 무료/유료 중간 화폐 + 바이럴 보상 + 결제 명분
