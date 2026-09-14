# 활동 모음 `/activity` — 도안 · 워크지를 인쇄하고 온라인으로 한다

2026-09-14 · 상태: 설계 승인(사용자 「ㄱㄱ」)

## 왜

네이버 실측(2026-08-17, memory `coloring-print-seo-2026-08-17`): 「색칠도안」 17,390 · 「숨은그림찾기」 11,010 ·
「색칠공부도안」 8,980 · 「숨은그림찾기도안」 5,500 — 한글 본업 키워드보다 5~10배 크다. 활동 검색어에 서 있는 건
개인 블로그(프린트 도안)이고, 경쟁 앱(토도·소중)은 설치 전에 해볼 수 없어 검색에 없다. 우리는 **자체 삽화로 만든
도안**과 **설치 없이 도는 웹 게임**을 이미 갖고 있는데 둘 다 검색에 안 걸린다.

2026-08-17 결정: 도안 페이지가 검색을 받고 **그 자리에서 게임**을 한다 · 활동은 **로그인 없이** 연다.

## 범위

| 종류 | 단위 | 수 | 원천 |
|---|---|---:|---|
| 한글 워크지 | 단원 | 32 | `KOREAN_PHONICS_CURRICULUM` |
| 영어 워크지 | 단원 | 39 | `ENGLISH_PHONICS_CURRICULUM` |
| 색칠 도안 | 장 | 약 2,250 | `public/coloring/manifest.json` (중국어 파닉스 `language:'zh'` 제외 — dev-only) |
| 숨은그림 | 씬 | 285 | R2 책의 `hiddenObjectScenes` → 새 목록 |

**안 하는 것**: PDF 파일 · 다국어(1차 한국어) · 틀린그림찾기 · 즐겨찾기/진척 기록.

## 1. 주소

```
/activity                                  모음(허브)
/activity/hangul/:unitId                   한글 워크지 단원
/activity/english/:unitId                  영어 워크지 단원
/activity/coloring/:slug                   색칠 도안 한 장   slug = <key>-<낱말>   예) ph-0389-아이
/activity/hidden-object/:slug              숨은그림 한 장    slug = <sceneKey>-<책 표시 제목>
```

- **키가 주인**이다. slug 의 낱말·제목은 검색용 장식이라 서버·클라 모두 **앞의 키만** 읽는다(`ph-0389-아무거나` 도 같은 페이지).
  낱말 부분이 현재 값과 다르면 서버가 **정규 slug 로 301**(canonical 한 벌).
- 섹션 첫 화면(`/activity/coloring` 등)은 따로 만들지 않는다 — 허브의 각 칸이 그 섹션 첫 항목으로 간다.
- 🔴 `/worksheet/hangul`·`/worksheet/english`(현재 소개 페이지)는 `/activity/hangul`·`/activity/english` 첫 단원으로 **301**.
  「주소를 옮기면 다섯 곳이 한 벌」 규칙: 라우터 Navigate · 서버 301 · useSeo canonical · sitemap · prerender 목록.
  인쇄물 파일(`/worksheet/ko_phonics.html`·`en_phonics.html`)은 그대로 둔다.

## 2. 화면 — 네 종류가 한 틀

`ActivityLayout`(새 컴포넌트) 하나가 틀을 잡고, 종류마다 **목록 공급자 + 오른쪽 패널**만 다르다.

```
┌ PublicNav ─────────────────────────────────────────────┐
│ [한글 워크지][영어 워크지][색칠 도안][숨은그림]  ← 종류 탭 │
├──────────────┬─────────────────────────────────────────┤
│ 🔍 검색       │ 제목 h1              [🎮 온라인으로] [🖨 인쇄] │
│ ▾ 갈래        │                                         │
│   · 항목 ●    │   오른쪽 패널 (미리보기 ↔ 온라인 활동)      │
│   · 항목      │                                         │
│ ▸ 갈래        │ 하단: 이 그림이 나오는 동화책 읽기 / 앱에서 이어하기 │
└──────────────┴─────────────────────────────────────────┘
```

- **왼쪽 목록**: 갈래(색칠=manifest `group`→`section`, 숨은그림=카테고리→책, 워크지=레벨→단원)로 접고 편다.
  검색은 낱말·제목 부분일치. 현재 항목은 강조 + 그 갈래는 펼친 채. 항목은 **`<a href>` 링크**(크롤러가 따라간다).
  🔴 목록 썸네일 없음 — 도안 한 장 200KB 라 2,000장을 걸면 첫 화면이 죽는다(ColoringDemoPage 교훈).
- **모바일(<md)**: 목록이 위에 접힌 드로어(`☰ 목록`), 패널이 아래. 드로어는 `hidden md:block` 토글(반응형 규칙).
- **오른쪽 패널 기본 = 미리보기**, 「🎮 온라인으로 하기」를 누르면 활동이 뜬다(누른 사람만 게임 코드를 받는다 — `lazy`).

| 종류 | 미리보기(=인쇄되는 것) | 온라인 |
|---|---|---|
| 색칠 | 도안 크게 + 낱말 | `ColoringPlayer` 한 장(다음 장 = 같은 갈래 다음 항목으로 **주소 이동**) |
| 숨은그림 | 씬 + 찾을 낱말 체크리스트 | `HiddenObjectPlayer`(책을 받아 `buildHiddenObjectSceneData`) |
| 워크지 | 단원 요약(배우는 글자·낱말 카드 몇 장) | `PhonicsTryIt`(그 단원 활동) |

- **인쇄**: 「🖨 인쇄」 = `window.print()`. `@media print` 에서 PublicNav·목록·버튼·하단을 숨기고 미리보기만 **A4 한 장**.
  🔴 워크지만 예외 — 인쇄물이 여러 쪽 HTML 이라 `/worksheet/{ko,en}_phonics.html#<unitId>` 를 **새 탭**으로 연다(이미 해시로 단원이 골라진다).
- 🔴 **사이트로 잇는 버튼 — 모든 페이지에 있어야 한다**(사용자 2026-09-14). 이 페이지들의 목적이 유입이라,
  검색으로 온 사람이 활동만 하고 나가지 않게 한다. 패널 아래 `ActivityCta` 한 덩어리(눈에 띄는 코랄 버튼):
  - **1순위 = 이 활동의 원천으로**: 색칠(동화책 도안)·숨은그림 → 「📖 이 그림이 나오는 동화책 읽기」 `/library/<bookId>` ·
    색칠(파닉스 도안)·워크지 → 「🔤 탱고북 파닉스에서 이어 하기」 그 단원 앱 주소.
  - **2순위 = 탱고북 전체로**: 「탱고북 둘러보기」 `/`(소개 페이지).
  - 온라인 활동을 **끝냈을 때**(게임 결과 화면 뒤)도 같은 CTA 를 한 번 더 띄운다 — 가장 붙잡기 좋은 순간이다.
  - 허브 페이지에도 같은 두 버튼. GA4 `activity_cta` `{ kind, key, target }`.

## 3. 데이터

- **색칠**: `coloring/manifest.json` 그대로(키·group·section·unitId·word·lineartUrl·originalUrl). 도안·원본은 이미 `/api/r2-proxy`.
- **숨은그림**: 새 `public/activity/hidden-object.json` = `scripts/build-activity-hidden-object.mjs` 가 R2 책을 훑어
  `{ key(scene.id 에서 hobj_ 뗀 것), bookId, title(bookDisplayTitle), category, sceneImageUrl, words:[ko] }` 로 굽는다.
  🔴 원천은 **책의 top-level `hiddenObjectScenes`**(작업판 아님 — 작업판은 원본 id 로 적혀 있어 쪼갠 책을 못 가리킨다).
  온라인 게임은 `bookId` 로 책을 받아 기존 빌더를 그대로 쓴다.
- **워크지**: 커리큘럼 상수 → `shared/utils/phonics-units.ts` 의 `flattenPhonicsUnits`(파닉스 SEO 와 같은 함수).
- **목록 파생 한 곳**: `shared/utils/activity-catalog.ts` — 네 종류의 `{ kind, key, slug, title, group, section, path }` 를 만든다.
  클라 목록 · 서버 SSR · sitemap · IndexNow 가 **전부 이 함수**를 부른다(sitemap 과 IndexNow 가 각자 세다 파닉스 73개가 빠질 뻔한 교훈).
  JSON 두 개는 입력으로 받는다(순수 함수 — 서버는 파일을 읽고, 클라는 fetch).

## 4. SEO

- 서버 `services/seo-activity.service.ts` + `app.ts` 라우트 4개(+허브). 렌더러는 기존 `sendSeo`/`AboutSeo` 형식:
  `<title>`·description·canonical·og(도안/씬 이미지)·h1·본문 문단·**같은 갈래 형제 링크**(최대 40)·허브 링크.
  React 짝 페이지(`pages/ActivityPage.tsx`)가 같은 주소를 받는다(SSR 만 있으면 사람은 404 — 파닉스 교훈).
  🔴 클라 라우트 종류는 **정적 세그먼트**(`activity/coloring/:slug` 등 네 줄) — `:kind` 로 두면 점수 경합.
- 제목 규칙(네이버 실측 낱말):
  - 색칠: `{낱말} 색칠도안 무료 인쇄 · 온라인 색칠공부 | 탱고북`
  - 숨은그림: `{책 제목} 숨은그림찾기 도안 무료 인쇄 · 온라인 게임 | 탱고북`
  - 워크지: `{단원 제목} 한글 학습지 무료 인쇄` / `… 영어 파닉스 학습지 무료 인쇄`
  - 허브: `무료 색칠도안 · 숨은그림찾기 · 한글/영어 학습지 | 탱고북`
- 없는 키 → **404**(SPA 셸 200 금지 — soft-404 교훈). slug 장식 불일치 → 301.
- sitemap(`generate-sitemap.mjs`)·IndexNow(`submit-indexnow.mjs`) 에 카탈로그 전부. 🔴 sitemap 은 코드 커밋과 별개로 **다시 굽는다**.
- 구조화 데이터: 허브 `CollectionPage`, 항목 `CreativeWork`(isAccessibleForFree: true).

## 5. 접근 · 측정

- **게이트 없음** — `ActivityGate`·`PhonicsUnitGate`·`EntryGate` 를 이 경로에서 **안 탄다**. `BETA_OPEN` 이 꺼져도 열려 있다.
  `PhonicsTryIt` 는 게이트 밖 컴포넌트라 그대로 된다(랜딩에서 이미 로그인 없이 돈다).
- GA4 이벤트: `activity_print`·`activity_play` `{ kind, key }`. 「도안 수요 vs 게임 수요」를 우리 트래픽으로 판정한다(키워드 툴로는 안 가려짐).

## 6. 검증

- 단위: `activity-catalog`(개수·slug 파싱·zh 제외·키 유일) · `seo-activity`(제목·canonical·404·301 판정).
- 브라우저: 네 종류 한 장씩 — 목록 이동 · 온라인 게임 · `print` 미리보기(인쇄 CSS 는 `emulateMedia('print')` 스크린샷) · 375px.
- SSR: `curl` 로 받아 태그 벗긴 **본문 글자 수** > 0 · canonical · 404/301 코드.
- 배포 전: 빌드된 서버를 `node dist/.../server.js` 로 띄워 새 라우트 응답 확인(2026-09-14 `.js` import 배포 실패 교훈).
- 게임 화면을 바꾸지 않지만 붙인 자리가 새로우므로 `game-reviewer` 로 색칠·숨은그림 한 장씩 플레이.

## 열린 것

- 허브 첫 화면 구성(종류 네 칸 + 대표 이미지)은 구현 때 시안으로 확인.
- 색칠 약 2,250장 중 「색이 안 맞는」 345장·「살펴볼 것」 44장은 게임 목록(`manifest`)이 이미 뺀 기준을 따른다 — 추가 필터 없음.
