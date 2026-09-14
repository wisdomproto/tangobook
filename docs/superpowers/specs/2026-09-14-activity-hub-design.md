# 활동 모음 `/activity` — 도안 · 워크지를 인쇄하고 온라인으로 한다

2026-09-14 · 상태: ✅ **구현·배포 완료**(2026-09-14) · 뒤이은 변경 = 기본 화면 온라인 놀이 · 책 단위 색칠책 인쇄 · 목록 갈래▸책▸낱말 · 숨은그림 갈래 라벨 · 색칠 뒤 동화책 쪽 리빌

## 왜

네이버 실측(2026-08-17, memory `coloring-print-seo-2026-08-17`): 「색칠도안」 17,390 · 「숨은그림찾기」 11,010 ·
「색칠공부도안」 8,980 · 「숨은그림찾기도안」 5,500 — 한글 본업 키워드보다 5~10배 크다. 활동 검색어에 서 있는 건
개인 블로그(프린트 도안)이고, 경쟁 앱(토도·소중)은 설치 전에 해볼 수 없어 검색에 없다. 우리는 **자체 삽화로 만든
도안**과 **설치 없이 도는 웹 게임**을 이미 갖고 있는데 둘 다 검색에 안 걸린다.

2026-08-17 결정: 도안 페이지가 검색을 받고 **그 자리에서 게임**을 한다 · 활동은 **로그인 없이** 연다.
2026-09-14 추가: **모든 페이지에 사이트로 잇는 버튼**(유입이 목적이다).

## 범위

| 종류 | 단위 | 수(대략) | 원천 |
|---|---|---:|---|
| 한글 워크지 | 단원 | 32 | `KOREAN_PHONICS_CURRICULUM` |
| 영어 워크지 | 단원 | 39 | `ENGLISH_PHONICS_CURRICULUM` |
| 색칠 도안 | 장 | ≤2,251 | `coloring/manifest.json` − 중국어(`zh`, dev-only) − 비공개 책 |
| 숨은그림 | 씬 | ≤285 | 공개 책의 `hiddenObjectScenes` 중 찾을 것 2개 이상 |

**안 하는 것**: PDF 파일 · 다국어(1차 한국어) · 틀린그림찾기 · 즐겨찾기/진척 기록 · 게임 규칙 변경.

## 1. 주소

```
/activity                          허브
/activity/hangul/:unitId           한글 워크지 단원     (unitId = 커리큘럼 id, 예 kr-h1-u02)
/activity/english/:unitId          영어 워크지 단원
/activity/coloring/:slug           색칠 도안 한 장      slug = <key>-<장식>
/activity/hidden-object/:slug      숨은그림 한 장       slug = <key>-<장식>
```

- **키 형식(고정)**: 색칠 `^(ph|bk)-\d{4}` · 숨은그림 `^(ho|jr|nt)-\d{4}`(씬 id `hobj_<key>` 에서 `hobj_` 를 뗀 것).
  서버·클라 모두 **정규식으로 앞의 키만** 읽는다. 장식이 없거나 달라도 같은 항목이다.
- **장식 = `slugify(표시 글자)`** (shared 한 곳): 색칠 = 낱말(`bk-*` 는 `낱말-책제목`), 숨은그림 = 책 표시 제목.
  규칙: `[가-힣a-zA-Z0-9]` 밖의 글자는 공백으로 → 공백 연속을 `-` 하나로 → 앞뒤 `-` 제거 → 40자 자름. 비면 장식 없이 키만.
  (예: 「01. 골고루 먹으면」 → `01-골고루-먹으면`)
- **정규화 301**: 요청 세그먼트를 `decodeURIComponent` 한 값이 `<key>-<현재 장식>`(장식이 비면 `<key>`)과 다르면 정규 주소로 301.
  비교는 디코드한 문자열끼리 한다(퍼센트 인코딩 대소문자 차이로 루프가 나지 않게). canonical 은 인코딩한 정규 주소.
- 없는 키·모르는 단원 → **404**(SPA 셸 200 금지).
- 🔴 `/worksheet`(허브) → `/activity` · `/worksheet/hangul` → `/activity/hangul/kr-h1-u01` · `/worksheet/english` → `/activity/english/en-b1-u01` **301**.
  「주소를 옮기면 다섯 곳이 한 벌」: 클라 라우터 Navigate · 서버 301 · useSeo canonical · sitemap · prerender 목록(`/worksheet*` 가 있으면 빼기).
  `PublicNav`·랜딩의 `/worksheet` 링크도 `/activity` 로. 인쇄물 파일(`/worksheet/ko_phonics.html`·`en_phonics.html`)은 그대로 — 저작도구 TopBar 의 인쇄물 직링크도 **일부러 그대로 둔다**.

## 2. 화면 — 네 종류가 한 틀

```
┌ PublicNav ─────────────────────────────────────────────────┐
│ [한글 워크지][영어 워크지][색칠 도안][숨은그림]   ← 종류 탭(링크) │
├──────────────┬─────────────────────────────────────────────┤
│ 🔍 검색       │ h1 제목                  [🎮 온라인으로] [🖨 인쇄] │
│ ▾ 갈래        │                                             │
│   · 항목 ●    │   오른쪽 패널: 미리보기 ↔ 온라인 활동            │
│   · 항목      │                                             │
│ ▸ 갈래        │ ActivityCta: [📖 동화책 읽기 / 🔤 앱에서 이어하기] [탱고북 둘러보기] │
└──────────────┴─────────────────────────────────────────────┘
```

컴포넌트 경계:
- `ActivityLayout({ kind, items, currentKey, children })` — 종류 탭 · 왼쪽 목록 · 오른쪽 자리. 목록은 `ActivityItem[]`(§3) 만 받는다.
- `ActivityList` — 갈래 접기·검색(낱말·제목 부분일치)·현재 항목 강조. 항목은 **`<a href>`**(크롤러가 따라간다). 썸네일 없음(도안 200KB × 2,000장).
- 패널 셋: `ColoringPanel` · `HiddenObjectPanel` · `WorksheetPanel` — 각자 `mode: 'preview'|'play'` 를 들고 미리보기와 온라인을 바꾼다.
- `ActivityCta({ item })` — §2-CTA.
- 모바일(<md): 목록은 위 `☰ 목록` 드로어(`hidden md:block` 토글), 패널이 아래.
- 온라인 활동 코드는 `lazy` — 「🎮」 누른 사람만 받는다.

| 종류 | 미리보기(=인쇄되는 것) | 온라인 |
|---|---|---|
| 색칠 | 도안 크게 + 낱말 | `ColoringPlayer items=[그 한 장]` — `colorSourceUrl = answerUrl ?? originalUrl`(ColoringDemoPage 와 같은 매핑) |
| 숨은그림 | 씬 + 찾을 낱말 체크리스트 | 책을 받아 `buildHiddenObjectSceneData(book, undefined, key)` → `HiddenObjectPlayer({ storybookId, gameData, difficulty: 'easy', onComplete, onBack })` |
| 워크지 | 단원 요약(배우는 글자 · 낱말 카드 4장) | `PhonicsTryIt({ unitId, language: 'korean'|'english' })` — 🔴 `language` 를 빼면 영어 단원이 조용히 `null` |

**게임에 필요한 최소 변경(규칙은 안 바꾼다)**:
- `buildHiddenObjectSceneData` 에 세 번째 인자 `sceneKey?` — 주면 `scene.id === 'hobj_' + sceneKey` 인 씬만(없으면 지금처럼 무작위). 그 씬이 필터에 걸리면 `null`(패널은 「이 그림은 지금 준비 중이에요」 + CTA).
- `ColoringPlayer` 에 선택 prop `onDone?: () => void` — 내부 `done` 이 true 가 되는 순간 한 번 부른다. 🔴 **`onDone` 이 있거나 `items.length === 1` 이면 플레이어 자체 「다음 그림」 버튼을 숨긴다**(한 장이면 `(i+1)%1` 로 제자리 — 죽은 버튼). 「다음 장」은 **CTA 옆 「다음 도안 →」 링크**(같은 갈래 다음 항목 주소)로 한다.

**인쇄**: 「🖨 인쇄」 = `window.print()`. `@media print` 에서 PublicNav·목록·버튼·CTA 를 숨기고 미리보기만 **A4 한 장**.
🔴 워크지만 예외 — 인쇄물이 여러 쪽 HTML 이라 `/worksheet/{ko,en}_phonics.html#<unitId>` 를 **새 탭**으로 연다(해시로 단원이 골라지는 것 확인됨).

### 2-CTA. 사이트로 잇는 버튼 — 모든 페이지

- **1순위(원천)**: 색칠 `bk-*`·숨은그림 → 「📖 이 그림이 나오는 동화책 읽기」 `/library/<bookId>` · 색칠 `ph-*`·워크지 → 「🔤 탱고북 파닉스에서 이어 하기」 `/library/phonics/{korean,english}/<unitId>`.
- **2순위**: 「탱고북 둘러보기」 `/`.
- 온라인 활동을 **끝냈을 때**(색칠 `onDone` · 숨은그림 `onComplete`) 패널 위에 같은 CTA 를 한 번 더 띄운다.
- 허브에도 두 버튼. GA4 `activity_cta` `{ kind, key }`.

## 3. 데이터

### 3-1. 카탈로그 JSON 둘 (굽기 · 커밋)

`packages/server/scripts/build-activity-catalog.mjs` 가 R2 를 읽어 **`packages/client/public/activity-data/` 에 두 파일(+ `summary.json`)**을 굽고 **커밋한다**
(색칠 manifest 가 커밋인 것과 같다 — 작고, 운영 이미지에 들어가야 SSR 이 읽는다).

- `coloring.json` — manifest 에서 `language:'zh'` 를 빼고, `bk-*` 는 `unitId`(=책 id)가 **살아 있는 공개 책**인 것만 남긴다.
  🔴 그림체 분할 뒤라 옛 id 가 쪼갠 책을 못 가리킬 수 있다 → 공개 목록에 없으면 뺀다(조용히 빼지 말고 개수를 찍는다).
  항목: `{ key, group, section, word, bookId?|unitId?, bookTitle?, lineartUrl, originalUrl, answerUrl?, blurb? }`
  (`blurb` = 그 낱말의 `key_objects.description`, 파닉스는 없음).
- `hidden-object.json` — **공개 책**(`isPublic !== false`)의 top-level `hiddenObjectScenes` 중 찾을 것(이름 중복 제거) **2개 이상**.
  항목: `{ key, bookId, bookTitle(bookDisplayTitle), category, sceneImageUrl, words:[라벨], blurb(parentGuide.overview 앞 120자) }`.
  🔴 「찾을 것 2개 이상」은 **이름 중복을 뺀 개수** 한 규칙 — shared `playableHiddenWords(scene)` 를 스크립트와 클라 빌더(`buildHiddenObjectSceneData` 의 필터)가 같이 쓴다(지금 빌더는 박스 수로 센다 → 이름 기준으로 바꾼다).
  🔴 **원천은 R2 책이다 — `hidden-object-hotspots.json`·작업판은 안 쓴다**(원본 id 로 적혀 있어 쪼갠 책을 못 가리킨다).
  🔴 라벨 규칙(`korean || name`)은 **shared `hiddenObjectLabelOf(book, objectName)` 한 곳**으로 옮겨 클라 빌더와 스크립트가 같이 쓴다.

재생성 시점: 도안을 붙이거나 숨은그림을 링크하거나 책을 공개한 뒤. 스크립트는 `--dry-run` 이 기본이고 개수 차이를 찍는다.

### 3-2. 워크지

커리큘럼 상수 → `flattenPhonicsUnits`(shared, 파닉스 SEO 와 같은 함수).

### 3-3. 목록 파생 한 곳 — `shared/utils/activity-catalog.ts`

```ts
type ActivityKind = 'hangul' | 'english' | 'coloring' | 'hidden-object';
interface ActivityItem { kind; key; slug; title; group; section; path; sourceHref; blurb? }
buildActivityItems(kind, input): ActivityItem[]     // input = JSON 항목 배열 또는 커리큘럼
parseActivityKey(kind, segment): string | null      // 정규식으로 키만
activitySlug(item): string                          // <key>-<slugify(장식)>
```

클라 목록 · 서버 SSR · sitemap · IndexNow 가 **전부 이 함수**를 부른다. `shared/src/index.ts` 에서 export 하고,
sitemap/IndexNow 는 지금처럼 `../../shared/dist/...` 에서 import 한다 → **스크립트 실행 전 `pnpm --filter shared build`**(스크립트 머리 주석에 적는다).

### 3-4. 읽는 경로

- 서버 SSR: `path.join(clientDist, 'activity-data/*.json')` 을 첫 요청에 읽어 메모리에 둔다(프로세스 수명 캐시 — 파일은 배포 때만 바뀐다).
  개발(`dist` 없음)은 `packages/client/public/activity-data/` 로 폴백.
- 클라: `fetch('/activity-data/coloring.json')` 등(TanStack Query, `staleTime` 길게).
- 허브·종류 탭은 900KB 목록을 받지 않고 셋째 파일 **`summary.json`**(`{count, firstKey, firstPath}`)만 본다 — 같은 스크립트가 굽는다. `firstPath` 는 정규 slug 경로라 탭 링크가 한 번 튕기지 않는다.
- sitemap/IndexNow: `packages/client/public/activity-data/*.json`.
- 🔴 **JSON 폴더 이름을 페이지 주소와 겹치지 않게**(`activity-data`) — `public/activity/` 에 두면 `dist/activity/` 가 생겨 `express.static` 이 `/activity` 를 폴더로 보고 SSR 전에 `/activity/` 로 301 한다(`app.ts` 의 `/library` 주석과 같은 함정). 같은 이유로 **새 SSR 라우트와 `/worksheet*` 301 은 `express.static` 보다 앞에** 둔다(`dist/worksheet/` 가 이미 있다).

## 4. SEO

- 서버 `services/seo-activity.service.ts` + `app.ts` 라우트 5개. 기존 `sendSeo`/`AboutSeo`(`{redirect}` 지원) 형식:
  `<title>` · description · canonical · og(도안/씬 이미지 — `/api/r2-proxy?…` 는 상대 주소라 `SITE_URL` 을 앞에 붙인다) · h1 · **본문**(blurb + 활동 안내 2~3문장 + 찾을 낱말/배우는 글자 목록) ·
  같은 갈래 형제 링크(최대 40) · 허브 링크 · CTA 링크.
- React 짝 페이지 `pages/ActivityPage.tsx`. 🔴 클라 라우트는 **정적 세그먼트 네 줄**(`activity/coloring/:slug` …) — `:kind` 로 두면 점수 경합.
- 제목(네이버 실측 낱말):
  - 색칠: `{낱말} 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북` (`bk-*` 는 `{낱말} 색칠도안 — {책 제목} | 탱고북`)
  - 숨은그림: `{책 제목} 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북`
  - 워크지: `{단원 제목} 한글 학습지 무료 인쇄 | 탱고북` / `… 영어 파닉스 학습지 무료 인쇄 | 탱고북`
  - 허브: `무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북`
- sitemap(`generate-sitemap.mjs`)·IndexNow(`submit-indexnow.mjs`) 에 카탈로그 전부. 🔴 sitemap 은 코드 커밋과 별개로 **다시 굽는다**.
- 구조화 데이터: 허브 `CollectionPage`, 항목 `CreativeWork`(`isAccessibleForFree: true`).

## 5. 접근 · 측정

- **게이트 없음** — 이 경로는 `ActivityGate`·`PhonicsUnitGate`·`EntryGate` 를 타지 않는다(`BETA_OPEN` 이 꺼져도 열림).
  `PhonicsTryIt` 는 게이트 밖 컴포넌트다(랜딩에서 로그인 없이 돈다).
- GA4: `activity_print` · `activity_play` · `activity_cta` `{ kind, key }`.

## 6. 검증

- 단위: `activity-catalog`(키 파싱 · slugify 예시 · 정규 slug · 404 판정) · `hiddenObjectLabelOf` · `buildHiddenObjectSceneData(sceneKey)` · `seo-activity`(제목 · canonical · 301 · 404).
- 굽기: `build-activity-catalog.mjs --dry-run` 개수(색칠 ≤2,251 · 숨은그림 ≤285)와 뺀 이유별 개수를 눈으로 확인.
- 브라우저: 네 종류 한 장씩 — 목록 이동 · 온라인 · 끝낸 뒤 CTA · 인쇄 미리보기(`emulateMedia('print')`) · 375px.
- SSR: `curl` 로 받아 태그 벗긴 본문 글자 수 > 0 · canonical · 301/404 코드.
- 배포 전: 빌드된 서버를 `node packages/server/dist/server/src/server.js` 로 띄워 새 라우트 확인(`prompt_guide.md` 복사 포함).
- `game-reviewer` 로 색칠·숨은그림 한 장씩 플레이(붙인 자리가 새롭다).

## 열린 것

- 허브 첫 화면 구성(종류 네 칸 + 대표 이미지)은 구현 때 화면으로 확인.
