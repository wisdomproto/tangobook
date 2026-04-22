# 뷰어 UI/UX 전면 리디자인 (유아 친화)

## 개요

탱고북의 **아이 전용 뷰어**(동화책 + 파닉스 + 게임 진입) 전체를 유아 친화 디자인으로 리빌드한다. 랜딩(LibraryPage), 책 상세(BookDetailPage), 뷰어 내부(ViewerContainer + PageView), 책 끝 보상(RewardScreen + YouTube 연동), 공통 디자인 시스템(토큰·폰트·기초 컴포넌트·마스코트 슬롯)을 한 스펙으로 다룬다.

**게임 내부(15종) UI/UX는 별도 후속 스펙**으로 분리한다. 본 스펙에서 확정된 디자인 시스템을 가져다 적용할 것.

## 맥락 · 문제

### 현재 문제
- **게임 15종이 톤 제각각**: violet / sky / emerald 임의 사용, 공통 컴포넌트 없음 (별도 스펙으로 이관)
- **뷰어가 "기능적으로만 돌아감"**: 페이지 전환 애니메이션 없음, 유아 친화 폰트 없음, 시스템 sans-serif만
- **랜딩(`LibraryPage`)가 심심함**: 스피너만 있고 스켈레톤 없음, 카드 메타데이터 빈약, 호버 피드백 약함
- **YouTube 애니메이션이 연결 안 됨**: `Storybook.audiobook.youtubeUpload?`에 이미 업로드 결과가 저장되지만 **뷰어에서 참조 안 함** — 백엔드는 80% 준비, 프론트 UI 0%
- **브랜드 톤/마스코트/감정 연결 요소 전무**: 아이가 "내 앱"이라고 느낄 요소 없음
- **애니메이션 라이브러리 미설치**: `framer-motion`, `lottie-react`, `canvas-confetti` 등 전부 없음

### 목표
1. **일관된 유아 친화 톤** — Warm & Cozy 베이스 + Clean 여백 + Playful 비비드 액센트. 공식: `Khan Academy Kids × 곰돌이 푸 × Duolingo`
2. **"아이 전용" UX** — 터치 타겟 48+px, 큰 타이포, 간단한 여정, 텍스트 최소화
3. **언어·모드 선택 도입** — 동화책은 여러 언어 버전·여러 경험(책/영상/게임)이 있을 수 있으므로 중간 상세 페이지로 선택
4. **YouTube 애니메이션 연동** — 라이브러리 카드 배지로 발견 + 책 끝 보상으로 감상
5. **마스코트(호랑이) 슬롯 확보** — 실 에셋은 사용자가 AI로 제작; 컴포넌트 인터페이스 먼저 확정
6. **배포 가능 단위로 쪼개기** — 매 Phase 끝이 배포 가능해야 함

### Non-goals (이번 스펙이 하지 않는 것)
- **게임 15종 내부 UI 리뉴얼** (별도 후속 스펙)
- **학부모/교사 관리 기능** — 학부모용은 별도 앱으로 분리 예정
- **오프라인 모드** — 네트워크 전제
- **책 읽기 진도 저장** (기존대로 진입 시 표지부터)
- **AI 스토리/이미지/TTS 생성** — 저작도구 쪽이므로 범위 밖
- **마스코트 일러스트 자체 제작** — 사용자가 AI로 별도 생성

## 결정 사항 (브레인스토밍 결과)

| 항목 | 결정 |
|------|------|
| 주 사용자 · 기기 | **아이 혼자, 태블릿 landscape** (반응형으로 폰/PC 대응) |
| 브랜드 톤 | **Warm & Cozy + Clean 여백 + Playful 비비드 액센트** |
| 참조 공식 | `Khan Academy Kids × 곰돌이 푸 × Duolingo` |
| YouTube 연동 방식 | **B + A 조합**: 라이브러리 카드 `📺` 배지(발견) + 책 끝 보상(감상) |
| 영상 있는 책 필터·섹션 | **α**: 배지만. 필터 토글·전용 섹션 없음. 후속 과제로 보류 |
| 마스코트 | **호랑이 1마리** (친구 확장 가능 구조). 에셋 AI 생성, 사용자 제작 |
| 마스코트 자산 포맷 | **Hybrid** — 정적 포즈 PNG/WebP 5개 + Lottie 5개 |
| Lottie 생성 | **`lottiefiles-creator` MCP로 직접 생성** (Claude가 구현 중 만듦) |
| 언어/모드 선택 위치 | **책 상세 페이지(`/library/:id`)**에서 선택. 책으로 읽기가 default |
| 영상·게임 없는 경우 | **해당 모드 카드 개별 숨김** (잠금 표시 X) |
| 접근법 | **Hybrid (Phase A ~ E)** — Foundation 후 여정 순서 |

## 섹션 1 — 디자인 시스템

### 색상 토큰

```css
/* Base — Warm 베이스 (배경, 카드) */
--color-cream-50: #FFF9F3;    /* 기본 배경 */
--color-peach-100: #FFF0E0;   /* 카드 서브 배경 */
--color-peach-200: #FFDDBF;   /* hover */
--color-peach-300: #FFC19B;
--color-peach-500: #FF9A5A;

/* Accent — Coral CTA */
--color-coral-100: #FFE4DC;
--color-coral-200: #FFBFA8;
--color-coral-400: #FF7A59;
--color-coral-500: #FF5E3A;   /* 주 CTA */
--color-coral-600: #E84B2A;

/* Semantic — 기능 */
--color-success: #5CC99F;     /* 정답 */
--color-info:    #6BAEE8;     /* 정보 */
--color-warn:    #FFC857;     /* 주의 */
--color-error:   #E75757;     /* 오류 (부드러운 레드) */
--color-fun:     #A78BFA;     /* 게임 CTA */

/* Ink — 텍스트 (갈흑색) */
--color-ink-900: #3A2B1F;
--color-ink-700: #6F5A48;
--color-ink-500: #9A8474;
--color-ink-300: #C9B8A8;
--color-ink-100: #EDE1D4;

/* Dark mode */
--color-dark-bg: #1F1611;     /* 웜 다크 (순검정 X) */
--color-dark-text: #FFF0E0;
```

### 타이포그래피

- **영문**: Nunito (Google Fonts) · weights 600 / 800 / 900
- **한글**: 학교안심둥근체 또는 카페24 아네모네 (무료 상업 가능, 유아 친화 둥근 글꼴)
- **사이즈 스케일 (px)**: 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48
- **뷰어 본문 기본 22px / 부제 16px** (유아 친화)

### Spacing · Radius

- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (8px 그리드)
- **Radius**: 8 (칩) / 16 (버튼) / 24 (카드) / 32 (대형 컨테이너) / 9999 (원형)
- **카드 간격 기본**: 24~32px
- **Touch target**: 최소 48×48, 주 액션 72+

### 기초 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `Button` | variants: primary(coral) / secondary / ghost / danger. sizes: sm/md/lg. |
| `Card` | radius-24, 흰 배경, 그림자 소프트 |
| `Skeleton` | shimmer 애니메이션 (로딩) |
| `Mascot` | 상태별 마스코트 (PNG + Lottie 자동 선택) |
| `FeedbackOverlay` | 정답/오답 피드백 (공통화 — 게임 후속 스펙에서도 재사용) |
| `Modal` (기존) | ESC 지원, 백드롭 블러 |
| `ErrorBoundary` (신규) | 라우트 레벨 감쌈 |

### 모션 원칙

- 기본 전환: **250~350ms, spring easing** (framer-motion 기본 spring)
- 큰 전환(페이지 넘김): 350ms
- 피드백(정답/오답): 150~250ms bounce
- `prefers-reduced-motion` 감지 시 모션 비활성화, fade만 유지

## 섹션 2 — 마스코트 시스템

### 컴포넌트 API

```tsx
<Mascot
  state="idle"              // 상태 enum 아래 참조
  size="md"                 // sm | md | lg | xl
  message="오늘은 뭐할까?"  // 선택, 말풍선
  loop={true}               // Lottie 반복 (기본 true)
  onClick={() => {}}        // 선택, 탭 액션
/>
```

내부 로직:
1. `state`를 받아 `MASCOT_MAP[state]`로 에셋 경로 결정
2. `.json` 확장자면 `<Lottie />`, `.webp/.png`면 `<img>`
3. 에셋 404 시 이모지 fallback (`🐯`)

### 상태 enum (MVP 10종)

| state | 타입 | 사용처 |
|---|---|---|
| `idle` | Lottie | 어디에나 기본 (숨쉬기) |
| `waving` | Lottie | LibraryPage 웰컴 |
| `thinking` | PNG | 빈/검색 결과 없음 |
| `reading` | PNG | 뷰어 로딩 |
| `pointing` | PNG | 튜토리얼/가이드 |
| `cheering` | Lottie | 페이지 완료·게임 정답 |
| `celebrating` | Lottie | 책 완독 RewardScreen |
| `dancing` | Lottie | BGM 재생 중 코너 |
| `sleeping` | PNG | 장시간 미활동 (3분+) |
| `sad` | PNG | 에러 화면 |

### 자산 경로

```
packages/client/public/mascot/tiger/
  ├── idle.json          # Lottie (MCP로 생성)
  ├── waving.json
  ├── cheering.json
  ├── celebrating.json
  ├── dancing.json
  ├── thinking.webp      # PNG (사용자가 AI 생성)
  ├── reading.webp
  ├── pointing.webp
  ├── sleeping.webp
  └── sad.webp
```

`tiger/` 래핑한 이유: 나중에 친구 캐릭터(panda, fox 등) 추가 대비. 컴포넌트는 추후 `<Mascot character="tiger" state="..." />`로 확장 가능.

### MVP 단계 동작 규칙

1. 실제 에셋이 없을 때 이모지 fallback으로 기능 검증
2. Lottie 먼저 제가 `lottiefiles-creator` MCP로 생성 (임시 placeholder 동물로)
3. PNG는 사용자가 AI 생성 (본 문서 마지막 Appendix의 프롬프트 가이드 사용)
4. Phase E에서 호랑이 최종본으로 전면 교체

## 섹션 3 — LibraryPage (뷰어 랜딩)

### 레이아웃 (태블릿 landscape 기준)

```
┌────────────────────────────────────────────────────┐
│  [웰컴 영역]  🐯  안녕! 오늘은 뭐 할까? 👋            │
│               211권이 너를 기다려                     │
├────────────────────────────────────────────────────┤
│  [📖 동화책 211] [🇰🇷 한글파닉스 42] [🇺🇸 영어파닉스]│
├────────────────────────────────────────────────────┤
│  [🔍 무슨 책 찾을까?]        [🆕 최신순 ▾]            │
├────────────────────────────────────────────────────┤
│  🐾 동물 이야기                              12권    │
│  ┌─────┬─────┬─────┬─────┐                           │
│  │📺 배지│     │📺 배지│     │ 책 카드 그리드       │
│  │ 🦊  │ 🐰  │ 🐻  │ 🦁  │                        │
│  └─────┴─────┴─────┴─────┘                           │
│                                                    │
│  🌳 자연 탐험                                8권     │
│  ...                                               │
└────────────────────────────────────────────────────┘
```

### 주요 변경

| 요소 | Before | After |
|---|---|---|
| 상단 | 검색·정렬·필터 혼재 | **웰컴 영역(마스코트 waving) + 탭** 고정 |
| 검색 | flex 안에 끼어있음 | **별도 컨트롤 바** (검색 + 정렬만) |
| 카테고리 필터 토글 | 동화책에만 있음 | **제거** — 카테고리 섹션으로 대체 |
| 카드 액션 | ring 선택 → "보기"/"게임" 버튼 | **카드 전체 = 클릭 영역** → BookDetailPage |
| YouTube 표시 | 없음 | **우상단 📺 배지** (coral-500 pill) |
| 로딩 | 스피너 | **카드 shimmer 스켈레톤** |
| 카드 그리드 | 3~5-col 혼재 | **md: 4-col / sm: 2-col / lg: 5-col** |

### 라우트

- 경로: `/library` (기존 유지)
- 카드 클릭 → `navigate('/library/:id')` (기존은 `/viewer/:id` 직행이었음)

### 조건부 UI

- YouTube 배지 표시 조건: `storybook.audiobook?.youtubeUpload?.videoId` **또는** `storybook.longformProjects?.some(p => p.youtubeUpload?.videoId)`
- 검색 결과 0건: Mascot `thinking` + "찾는 책이 없네 · 다른 말로 찾아볼까?" + 검색 초기화 버튼
- 콘텐츠 0건: Mascot `thinking` + "책이 아직 없어"

## 섹션 4 — BookDetailPage (신규 중간 페이지)

### 라우트

- 신규 경로: `/library/:id`
- LibraryPage 카드 탭 → 이 페이지 → 언어·모드 선택 후 뷰어/비디오/게임

### 레이아웃

```
┌────────────────────────────────────────────────────┐
│  [← 뒤로]                               [⭐ 즐겨찾기]│
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────┐  토끼야 어디가니                    │
│  │             │  Rabbit, where are you going?     │
│  │   🐰 [📺]   │  [👶 만3-5세] [📄 10p] [🐾 동물]  │
│  │             │  궁금한 토끼가 숲 속 친구들을...   │
│  └─────────────┘                                   │
│                                                    │
├────────────────────────────────────────────────────┤
│  🌐 언어                                           │
│  [🇰🇷 한국어 ●] [🇺🇸 English]                       │
├────────────────────────────────────────────────────┤
│  🎯 어떻게 즐길까?                                  │
│  ┌──────────────────────┬─────────┬─────────┐      │
│  │    📖                │   🎬    │   🎮    │      │
│  │  책으로 읽기         │ 영상으로│ 게임    │      │
│  │  (coral primary)     │         │         │      │
│  │  [ → ]               │         │         │      │
│  └──────────────────────┴─────────┴─────────┘      │
└────────────────────────────────────────────────────┘
```

### 요소

- **상단 바**: 뒤로가기(원형 48px) + 즐겨찾기 토글 (즐겨찾기 기능은 이번 스펙 범위 X이나 UI 슬롯만 배치)
- **히어로**: 표지 300px + 제목/부제/메타/줄거리 2단
- **언어 탭**: 1개만 있으면 **섹션 전체 숨김**
- **모드 카드 3개**: grid `2fr 1fr 1fr` — "책으로 읽기"가 **default·coral 그라데이션 primary**, 영상·게임은 secondary 크기

### 조건부 렌더링

```tsx
// 의사 코드
const hasVideo = !!(storybook.audiobook?.youtubeUpload?.videoId);
const hasGame = (storybook.games?.length ?? 0) > 0;
const languages = getAvailableLanguages(storybook);  // [{code, label}]

{languages.length > 1 && <LanguageTabs />}
<ModeGrid>
  <ModeCard mode="read" primary />
  {hasVideo && <ModeCard mode="video" />}
  {hasGame && <ModeCard mode="game" />}
</ModeGrid>
```

### 진입 행동

- "📖 책으로 읽기" 탭 → `navigate('/viewer/:id?lang=ko')`
- "🎬 영상으로" 탭 → `navigate('/viewer/:id?mode=video&lang=ko')` (뷰어 안에서 모달로 영상 재생) **또는** 전용 `/video/:id` 라우트 (세부는 구현 단계에서 확정; 권장은 전용 라우트)
- "🎮 게임" 탭 → 기존 게임 진입 경로 재사용 (`navigate('/viewer/:id?mode=games&lang=ko')`)

## 섹션 5 — ViewerContainer + PageView (뷰어 내부)

### 레이아웃 (태블릿 landscape)

```
┌────────────────────────────────────────────────────┐
│  🏠 토끼야 어디가니          🌗 Aa 🌐 ⛶            │← 툴바 (Pill)
├────────────────────────────────────────────────────┤
│                                                    │
│              ┌──────────────┐                      │
│              │              │                      │
│              │    🐰 이미지  │  ← 중앙 60%          │
│              │              │                      │
│              └──────────────┘                      │
│       ┌────────────────────────────┐               │
│       │ 토끼야, 토끼야, 어디가니?  │  ← 반투명     │
│       │ Rabbit, where are you?     │  텍스트 카드  │
│       └────────────────────────────┘               │
│                   ● ● ●──── ● ● ●   ← 책 등뼈       │
│                                           🐯      │← 마스코트 코너
│                                          (BGM)    │
│  ⓐ                                           ⓑ     │
│ [←]           [🔊] [🎵] [⏯]              [→]     │← 네비 + 컨트롤
└────────────────────────────────────────────────────┘
```

### 핵심 변경

| 요소 | Before | After |
|---|---|---|
| 툴바 | 작고 hover-hide | **Pill(알약) 반투명+blur, 항상 살짝 보임** (44px 아이콘) |
| 텍스트 | 반투명 검정 박스 | **흰 반투명 카드** + soft shadow + radius-20 (본문 22px) |
| 네비 | 작은 화살표 버튼 | **64px 원형 버튼**, "다음"은 coral CTA |
| 진행률 | "3/10" 숫자 | **책 등뼈 dot** (현재 dot 확장 + coral) |
| 페이지 전환 | 즉시 교체 | **framer-motion slide-fade 350ms spring** |
| 마스코트 | 없음 | **BGM 재생 시 우하단 dancing 56px** |
| 다크모드 | 검정 배경 | **웜 다크 #1F1611** + peach-100 텍스트 |
| 폰트 | sans-serif 기본 | **Nunito + 학교안심둥근체** |

### 페이지 전환 상세

```tsx
// framer-motion AnimatePresence
<AnimatePresence mode="wait" initial={false} custom={direction}>
  <motion.div
    key={pageIndex}
    custom={direction}
    variants={{
      enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:  (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
    }}
    initial="enter" animate="center" exit="exit"
    transition={{ type: 'spring', stiffness: 160, damping: 20 }}
  />
</AnimatePresence>
```

- 자동 넘김(TTS 종료 + 800ms delay) 시에도 같은 전환 애니메이션
- 책 첫 페이지 진입 시에는 fade-in만 (슬라이드 X)
- 마지막 페이지 **다음** 호출 → RewardScreen 라우팅 (섹션 6)

### 다크모드

- 설정에서 토글 (localStorage 유지)
- 자동 전환(시간대 감지)은 **후속 과제**
- 색: bg `--color-dark-bg`, 텍스트 `--color-dark-text`, 카드 `rgba(255,240,224,0.08)` + blur

### 자동재생 정책

- 첫 진입 시 TTS 자동재생 **X** (사용자 탭 후 시작) — iOS policy 준수 + 예고 없는 사운드 방지
- 설정 "자동재생 ON" → 다음 페이지부턴 자동
- BGM은 첫 탭 이후에만 시작

## 섹션 6 — RewardScreen + YouTube + 게임 연동

### 등장 조건

뷰어의 마지막 페이지에서 "다음 →" 또는 자동 진행이 호출되면 RewardScreen 라우트(`/viewer/:id/reward`)로 이동하거나, 내부 state로 overlay.

**권장**: 오버레이 방식 (라우트 추가 없이 `ViewerContainer` 안에서 `<RewardScreen />` 조건부 렌더)

### 4가지 케이스

| | 영상 | 게임 | Primary | Secondary |
|---|:---:|:---:|---|---|
| **A** | O | O | 🎬 영상 (coral) + 🎮 게임 (fun) 나란히 | 🏠 / ↻ |
| **B** | O | X | 🎬 애니메이션으로 한번 더! (coral, 크게) | 🏠 / ↻ |
| **C** | X | O | 🎮 게임 하러 가기 (fun, 크게) | 🏠 / ↻ |
| **D** | X | X | 🏠 다른 책 보러 가기 (coral) | ↻ |

### 색상 규칙

- **영상 CTA** = coral 그라데이션 (`#FF7A59 → #FF5E3A`)
- **게임 CTA** = fun 그라데이션 (`#A78BFA → #7C3AED`)
- 아이가 두 경험이 다른 것임을 시각적으로 구분

### 레이아웃

```
┌────────────────────────────────────────────────────┐
│    ✨             🎊            🌟                  │
│                                                    │
│                     🐯                             │← celebrating Lottie
│              📖 완독 축하 (label-bar)              │
│         끝까지 다 읽었어! 🎉 (34px · bold 900)     │
│                다음엔 어떻게 더 놀까?              │
│                                                    │
│    ⭐            🎉              ✨                 │
│   ┌──────────────────┬──────────────────┐          │← Primary (2개 or 1개)
│   │ 🎬 애니메이션    │ 🎮 게임 하러 가기│          │
│   └──────────────────┴──────────────────┘          │
│        [🏠 다른 책]   [↻ 다시 읽기]                │← Secondary
└────────────────────────────────────────────────────┘
```

### 애니메이션

- 등장 시:
  1. 배경 그라데이션 fade-in (500ms)
  2. canvas-confetti 폭발 (1회)
  3. 마스코트 `celebrating` Lottie 재생 + bounce-in
  4. 텍스트 stagger (타이틀 → 서브 → 버튼)

### YouTube 재생

- **방식**: 모달 (풀스크린 별도 화면 X) — 축하 씬 위에 오버레이
- **구현**:
  - `<YouTubePlayer videoId={...} onClose={...} onEnd={...} />`
  - `react-youtube` 라이브러리 또는 iframe 직접 (privacy-enhanced-mode URL: `https://www.youtube-nocookie.com/embed/:id`)
- **종료 처리**: 영상 끝나거나 ✕ 누르면 모달 닫고 RewardScreen 유지 (다시 선택 가능)
- **에러 fallback**: "영상을 불러올 수 없어. 책으로 다시 볼래?" + 다시 읽기 버튼

### 데이터 기반 조건

```tsx
const hasVideo = !!storybook.audiobook?.youtubeUpload?.videoId
              || storybook.longformProjects?.some(p => p.youtubeUpload?.videoId);
const hasGame  = (storybook.games?.length ?? 0) > 0;

const caseType = hasVideo && hasGame ? 'A'
               : hasVideo ? 'B'
               : hasGame  ? 'C' : 'D';
```

### 게임 진입 경로

- Reward의 🎮 버튼 → 기존 `navigate('/viewer/:id?mode=games&lang=...')` 재사용
- 게임 완료 후 복귀: 기존 플로우 그대로 (이번 스펙에서 건드리지 않음)

## 섹션 7 — 상태 화면 (빈 / 에러 / 로딩)

### 공통 패턴

```tsx
<StateScreen
  mascotState="thinking" | "sad"
  title="..."             // 큰 문구
  description="..."       // 보조 문구 (선택)
  action={{
    label: "↻ 다시 시도",
    onClick: () => {}
  }}
/>
```

### 적용 상황별

| 상황 | 마스코트 | 문구 | 액션 |
|---|---|---|---|
| 책 0건 | thinking | 책이 아직 없어 · 선생님이 곧 준비해 줄 거야 | 🏠 홈으로 |
| 검색 0건 | thinking | 찾는 책이 없네 · 다른 말로 찾아볼까? | 🔎 다시 검색 |
| 네트워크 에러 | sad | 연결이 안 돼 · 와이파이를 확인해줘 | ↻ 다시 시도 |
| 책 데이터 이상 | sad | 이 책이 이상해. 다른 책 볼까? | 🏠 홈으로 |
| YouTube 로드 실패 | sad | 영상을 불러올 수 없어. 책으로 다시 볼래? | ↻ 다시 읽기 |
| 로딩 (카드 목록) | — | — | **스켈레톤 shimmer** (카드 모양) |
| 로딩 (뷰어) | reading | — | — (잠깐 표시) |

### 에러 처리 규칙

- 모든 문구: **아이 친화 언어** ("네트워크 오류 404" 따위 금지)
- 라우트 레벨 `<ErrorBoundary />`로 렌더 에러 감쌈
- TanStack Query: `retry: 1` → 실패 시 StateScreen
- 에셋 로드 실패(마스코트): 이모지 auto-fallback (Mascot 컴포넌트 내부)

## 섹션 8 — 반응형 · 접근성

### 브레이크포인트

| 이름 | 너비 | 비고 |
|---|---|---|
| `sm` | 640 ~ 1024 | 폰·작은 태블릿 portrait |
| `md` (base) | 1024+ | **태블릿 landscape 기본 타겟** |
| `lg` | 1440+ | PC, 큰 태블릿 |

### 레이아웃 변형

| 화면 | sm | md | lg |
|---|---|---|---|
| LibraryPage 카드 | 2-col | 4-col | 5-col |
| BookDetailPage 히어로 | 세로 스택 | 좌/우 2단 | 좌/우 2단 + 여백 ↑ |
| 뷰어 이미지 | 85% 이미지 + 하단 텍스트 | 60% 이미지 + 텍스트 카드 | 동일, 여백 ↑ |
| 툴바 | 컴팩트 아이콘만 | 제목+아이콘 | 동일 |

- 모든 breakpoint에서 터치 타겟 48+ 유지
- max-width 1440px (lg에서 무한 확장 방지)

### 접근성 체크리스트

- [x] 터치 타겟 48×48+ / 주 액션 72+
- [x] 대비 WCAG AA (ink-900 on cream-50 = 12.5:1)
- [x] Focus ring (키보드 Tab 네비 가능)
- [x] `prefers-reduced-motion` 지원 (Lottie · framer-motion 비활성화, fade만)
- [x] `alt` 텍스트 모든 `<img>`에
- [x] 마스코트는 장식용 → `aria-hidden="true"`
- [x] TTS 자동재생 X (첫 진입) — iOS 정책
- [x] 에러 메시지 아이 친화 언어

## 섹션 9 — 데이터 · API

### 타입 변경 (최소)

- **추가 없음** — 기존 `Storybook` 타입으로 모두 판별 가능
- 활용 필드:
  - `storybook.audiobook?.youtubeUpload?.videoId` — 영상 유무
  - `storybook.longformProjects?.[].youtubeUpload?.videoId` — 영상 대체 소스
  - `storybook.games?.length` — 게임 유무
  - `storybook.type` — 'storybook' | 'phonics' 등
  - `storybook.languages` 또는 `page.translations` — 언어 (기존 구조 그대로 활용)

### API 변경

- **서버 엔드포인트 변경 없음**
- 클라이언트에서 TanStack Query 훅 추가:
  - `useStorybookDetail(id)` — BookDetailPage용 (이미 `useStorybook` 있으면 재사용)

## 섹션 10 — 구현 Phase (Hybrid 접근)

| Phase | 범위 | 기간 | 배포 가능 |
|---|---|---|:---:|
| **A** Foundation | 디자인 토큰·폰트·패키지·기초 컴포넌트·Mascot 스텁·Lottie 초안 | 4일 | ❌ |
| **B** 진입 플로우 | LibraryPage 리뉴얼 + BookDetailPage 신설 + 스켈레톤 + 조건부 UI | 5일 | ✅ |
| **C** 뷰어 내부 | ViewerContainer·PageView·전환·툴바·컨트롤·마스코트 코너·다크모드 | 6~7일 | ✅ |
| **D** 보상 + YouTube + 게임 연동 | RewardScreen (4 케이스) · YouTube 모달 · 게임 진입 경로 | 3일 | ✅ |
| **E** 폴리시 | 상태 화면 · 반응형 · 접근성 · 실 마스코트 에셋 통합 · QA | 4일 | ✅ |
| **합계** | | **~22일 (약 4주)** | |

### Phase 간 의존성

- A → B: 토큰·기초 컴포넌트 있어야 B 자연스러움
- B → C: 병렬 가능하나 순서대로가 체감 좋음
- C → D: Reward는 뷰어 마지막 다음 등장 → C 완료 후
- D → E: E는 전반 폴리시
- 각 Phase는 끝나면 **배포 가능한 단위**

## 섹션 11 — 추가할 패키지

```bash
pnpm add framer-motion lottie-react canvas-confetti clsx tailwind-merge -F client
pnpm add react-youtube -F client  # YouTube 임베드 (또는 iframe 직접)
```

- `framer-motion` — 페이지 전환, 마스코트 bounce, 모션 전반
- `lottie-react` — 마스코트 Lottie 렌더
- `canvas-confetti` — RewardScreen 폭발 파티클
- `clsx` + `tailwind-merge` — `cn()` 헬퍼
- `react-youtube` — iframe embed (또는 직접 iframe · 가벼움 택)

## 섹션 12 — 테스트 전략

### 시각 회귀
- 주요 화면(LibraryPage, BookDetailPage, PageView, RewardScreen · 4 case, StateScreen · 4 종)을 수동 QA 체크리스트로
- 태블릿 실기(iPad landscape) 테스트 필수

### 단위 · 컴포넌트
- Mascot fallback (404 에셋 → 이모지) 테스트
- RewardScreen case 분기 (A/B/C/D) 렌더링 테스트
- BookDetailPage 조건부 UI (영상/게임/언어 조합) 테스트

### E2E (선택, 후속)
- Playwright로 주요 여정 1회: 라이브러리 → 책 상세 → 뷰어 → 보상 → 영상 모달

### 성능
- 첫 뷰어 진입 < 2초 (책 1권 데이터 + 첫 페이지 이미지)
- Lottie 파일 각 100KB 이하
- PNG는 WebP 변환, 1024×1024 이하

## 섹션 13 — 남은 질문 · 후속 과제

### 후속 과제 (본 스펙 범위 밖)
- **게임 15종 내부 UI/UX 리뉴얼** — 별도 스펙 예정
- **영상 있는 책 전용 섹션 (γ)** — 영상 많아지면 도입
- **즐겨찾기 기능** — UI 슬롯만 준비, 기능 미구현
- **완독 진도 추적** (복독 시 스킵 제안, 완독 뱃지)
- **다크모드 자동 전환** (시간대 감지)
- **오프라인 모드** — PWA 캐싱 정책

### 현 시점 남은 결정
1. 한글 폰트 최종 선택: 학교안심둥근체 vs 카페24 아네모네 vs 기타 — 구현 시 실제 렌더 비교
2. YouTube 임베드: `react-youtube` vs 직접 iframe — 번들 크기 체크 후 결정
3. BookDetailPage에서 "📺 영상으로" 모드 진입 방식: 별도 `/video/:id` 라우트 vs 뷰어 안 모달 — 구현 시 UX 검증

---

## Appendix A — 마스코트 AI 생성 프롬프트 가이드

사용자가 호랑이 마스코트를 AI 이미지 생성으로 만들 때 참고할 가이드.

### 권장 모델
- **Midjourney v6+** / **Imagen 3 / 4** / **Flux** / **Google Gemini 3 Pro Image**
- 투명 배경 요구 시: 생성 후 `remove.bg` 또는 PS로 처리

### 전체 베이스 프롬프트 (모든 포즈 공통)

```
cute baby tiger mascot, small round body, oversized head,
large expressive eyes, soft rounded orange fur with white belly,
subtle tiger stripes, friendly child-friendly design,
flat illustration style, soft pastel shading,
clean vector-like appearance, transparent background,
square 1:1 composition, centered, full body visible,
style: similar to Khan Academy Kids / Sago Mini characters,
warm cozy palette, appropriate for ages 3-6
```

### 포즈별 추가 프롬프트

| 파일명 | 추가 프롬프트 |
|---|---|
| `thinking.webp` | `, looking up with curious expression, paw on chin thinking, slight head tilt, thought bubble floating` |
| `reading.webp` | `, sitting, holding an open book with both paws, eyes focused on book, small smile, book cover orange` |
| `pointing.webp` | `, standing, one paw pointing to the right / upward, excited expression, inviting gesture` |
| `sleeping.webp` | `, curled up sleeping position, closed eyes, small z letter floating above head, relaxed smile` |
| `sad.webp` | `, slightly down, paws together, tear dripping below eye, worried but not scary, empathetic` |

### Lottie 3개는 제가 MCP로 생성

- idle, waving, cheering, celebrating, dancing — 구현 시 `lottiefiles-creator` MCP로 생성
- PNG 포즈 이미지(thinking, reading 등)를 **참조 프레임**으로 사용하면 일관성 확보

### 공통 규칙

- **모든 포즈에서 호랑이 형상 일관성**: 귀 위치, 줄무늬 패턴, 색감 동일
- **머리 크기 > 몸통** (super-deformed 비율) — 유아 친화 귀여움 공식
- **외곽선**: 부드러운 라인 또는 라인 없음 (날카롭지 않게)
- **색**: 오렌지(#FF9A5A 근처)는 우리 peach-500과 조화 — 너무 진한 주황 피하기
- **크기 / 해상도**: 1024×1024 px, 투명 배경 PNG → 구현 시 WebP 변환
- **문제 피하기**:
  - 사나운 표정, 날카로운 이빨, 포효 — 유아 친화 X
  - 옷 입은 모습 — 브랜드 캐릭터 통일성 떨어짐
  - 서명/워터마크 자동 제거 확인

### 결과 검증 체크리스트 (AI 생성 후)

- [ ] 7개 포즈 전부 같은 호랑이로 보이는가 (머리/몸/색 일관성)
- [ ] 배경 완전 투명인가 (어두운 배경에서 테스트)
- [ ] 테이블릿 크기로 축소 표시해도 귀여움 유지되는가
- [ ] 다크모드 배경(#1F1611) 위에서도 보이는가 (회색/갈색 톤 대비)

---

## 참고 (기존 코드)

- **현재 뷰어**: `packages/client/src/features/viewer/components/ViewerContainer.tsx`, `PageView.tsx`, `ViewerToolbar.tsx`, `ViewerControls.tsx`
- **현재 라이브러리**: `packages/client/src/pages/LibraryPage.tsx`
- **타입**: `packages/shared/src/types/storybook.ts` (`Storybook`, `YouTubeUploadResult`)
- **기존 공통 컴포넌트**: `packages/client/src/components/Button.tsx`, `Modal.tsx`
- **현재 Tailwind 설정**: `packages/client/tailwind.config.js`
