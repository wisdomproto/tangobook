# 탱고북 디자인 시스템 (Single Source of Truth)

> **목적**: 새 화면 시안을 코드로 옮길 때 통일감 유지. GPT 등으로 시안 만들 때 이 문서 reference 로 전달, Claude 가 시안 받을 때 매번 이 문서 참조.

## 1. 톤 & 정체성

- **공식**: Khan Academy Kids × 곰돌이푸 × Duolingo
- **타겟**: 4-5세 아동 (직접 사용) + 부모 (관리)
- **디바이스**: 태블릿 1024-1366 우선, 모바일 보조
- **느낌**: Warm & Cozy 메인 + Clean & Modern 여백 + Playful 비비드 포인트
- **금기**: 다크모드 (학습자 화면), 너무 작은 글자/터치, 광고 톤, 별/포인트 transactional UI

## 2. 색 팔레트

`packages/client/src/design-system/tokens/colors.ts` 가 single source. Tailwind 클래스로 `bg-coral-500`, `text-ink-900` 등 사용.

### Warm Base (배경/카드)
| 토큰 | HEX | 사용처 |
|---|---|---|
| `cream-50` | `#FFF9F3` | 메인 배경 (학습자 화면) |
| `peach-100` | `#FFF0E0` | 부드러운 카드 배경, 그라디언트 끝점 |
| `peach-200` | `#FFDDBF` | hover/active 상태 |
| `peach-300` | `#FFC19B` | 일러스트 fill |
| `peach-500` | `#FF9A5A` | 강조 배경 |

### Accent CTA (행동 유도)
| 토큰 | HEX | 사용처 |
|---|---|---|
| `coral-100` | `#FFE4DC` | 부드러운 coral 배경 (chip pastel) |
| `coral-200` | `#FFBFA8` | hover, ring |
| `coral-400` | `#FF7A59` | 그라디언트 끝점 |
| `coral-500` | `#FF5E3A` | **메인 CTA** (button, active chip, 동화책 axis) |
| `coral-600` | `#E84B2A` | text on coral-100 배경, 강한 강조 |

### Ink (텍스트)
| 토큰 | HEX | 사용처 |
|---|---|---|
| `ink-100` | `#EDE1D4` | border, divider, disabled fill |
| `ink-300` | `#C9B8A8` | 약한 보조 텍스트, "준비 중" 라벨 |
| `ink-500` | `#9A8474` | placeholder, 약한 본문 |
| `ink-700` | `#3F2F24` | 본문 강조 |
| `ink-900` | `#0B0805` | **메인 텍스트** (제목/본문) — 4-5세 가독성 우선 실질 검정 |

### Semantic
| 토큰 | HEX | 사용처 |
|---|---|---|
| `success` | `#5CC99F` | 성공 / 완료 / 파닉스 axis |
| `info` | `#6BAEE8` | 정보 / 영상 카드 |
| `warn` | `#FFC857` | 주의 / "읽는 중" 배지 / 어휘 axis (amber) |
| `danger` | `#E75757` | 위험 / 로그아웃 hover |
| `fun` | `#A78BFA` | 재미 / 영상 카드 violet |

## 3. 타이포그래피

`packages/client/src/design-system/tokens/typography.ts`. Tailwind 클래스로 `font-sans` (default), `font-display` (heading).

### 폰트 패밀리
- **`font-sans`** (Body / UI): **Pretendard Variable** — 한국 모던 앱 표준, 한글+Latin 조형 통일, 가변 38KB
- **`font-display`** (Heading): **NanumSquareRound** — 둥근 모서리 한글체, 4-5세 친화 가독성. `<h1>` `<h2>` 등 큰 제목, 페이지 타이틀, 카테고리 헤딩에 사용

### Weight
- `font-bold` (700) — 부제, 본문 강조
- `font-black` (900) — **모든 제목 / 라벨 / 버튼** (4-5세 가독성, 굵게 통일)

### 사이즈 스케일 (학습자 화면 기준 — 4-5세 + 태블릿)
| Tailwind | px | 사용처 |
|---|---|---|
| `text-xs` | 12 | "준비 중" 라벨, 보조 메타 |
| `text-sm` | 14 | 부제, 작은 본문 (지양 — 너무 작음) |
| `text-base` | 16 | 본문 기본, chip 라벨 |
| `text-lg` | 18 | 사이드바 axis 라벨, "더 보기" 버튼 |
| `text-xl` | 20 | 책 제목, 검색바 input |
| `text-2xl` | 24 | 보조 제목 |
| `text-3xl` | 30 | **카테고리 헤딩** (LibraryPage 섹션) |
| `text-4xl`+ | 36+ | 큰 hero 제목 (필요 시) |

**원칙**: 학습자 화면에서 `text-sm` 이하 지양. 메타/배지 외 본문/제목은 `text-base` 이상.

## 4. Spacing & Layout

Tailwind 기본 스케일 사용. 자주 쓰는 패턴:

| 클래스 | px | 사용처 |
|---|---|---|
| `gap-2` / `p-2` | 8 | 작은 chip 내부 |
| `gap-3` / `p-3` | 12 | 카드 내부 element |
| `gap-4` / `p-4` | 16 | 카드 padding |
| `gap-5` | 20 | chip row gap |
| `gap-6` | 24 | 큰 element 사이, 그리드 gap |
| `p-6` / `p-8` | 24 / 32 | section padding |
| `mb-14` | 56 | 카테고리 섹션 사이 vertical breath |

### Border Radius (`borderRadius` token)
| 토큰 / Tailwind | px | 사용처 |
|---|---|---|
| `rounded-xl` | 12 | 작은 button, 부모 nav 항목 |
| `rounded-2xl` | 16 | **표준 카드 / 검색바 / 책 카드 일러스트** |
| `rounded-3xl` | 24 | 큰 정사각 axis 박스 |
| `rounded-full` | 9999 | chip, 사용자 chip, icon button |

### Shadow (`boxShadow` token)
| 토큰 | 값 | 사용처 |
|---|---|---|
| `shadow-soft` | `0 2px 8px rgba(0,0,0,0.06)` | 카드 기본 |
| `shadow-card` | `0 4px 16px rgba(0,0,0,0.08)` | 떠 있는 카드 |
| `shadow-pop` | `0 6px 20px rgba(255,94,58,0.35)` | **활성 CTA**, hover, floating element (검색바 등) |

## 5. 디자인 시스템 컴포넌트

`packages/client/src/design-system/primitives/` — 새 컴포넌트 만들기 전에 **여기 있는 것 먼저 확인**.

| 컴포넌트 | 용도 | Props 핵심 |
|---|---|---|
| `<AppIcon>` | PNG/SVG 아이콘 (designed asset) | `src` (`category/animal.png` 등), `size` |
| `<Mascot>` | 호리 마스코트 | `character="hori"`, `state="waving"`, `size` |
| `<Chip>` | pill 토글 (필터/카테고리) | `variant: coral/warn/success/ink`, `active`, `icon`, `trailing` |
| `<Card>` | 일반 컨테이너 카드 | `interactive`, `padding`, `onClick` |
| `<Button>` | CTA 버튼 | (확인 — 현재 거의 안 씀, custom 가 더 흔함) |
| `<StateScreen>` | empty / error / loading 풀화면 | `mascotState`, `title`, `description`, `action` |
| `<SkeletonBookCard>` | 로딩 placeholder | (no props) |
| `<ErrorBoundary>` | 에러 catch | (children) |

**기본 원칙**: 새 화면 시안에 button/chip/card 등이 보이면 → 위 컴포넌트로 바로 매핑. 매핑 안 되면 → 진짜 신규 컴포넌트인지 사용자 확인 후 design-system/primitives 에 추가.

## 6. 자주 쓰는 패턴

### 사이드바 ([AppShell](../packages/client/src/components/AppShell.tsx))
- `w-44` (176px) sticky left, `h-screen`, `bg-cream-50`, 우측 `border-r border-ink-100/60`
- 좌상단 로고 (`logo-kr.png` h-16 64px)
- 3 axis 박스 (동화책 active / 파닉스·어휘 disabled "준비 중") — 정사각 `w-28 h-28` (112px) `rounded-3xl`
- 좌하단 호리 + 말풍선 + 부모 버튼

### 라이브러리 헤더 (`/library` 만)
- AppShell 헤더 = `position: absolute` transparent overlay (hero 일러스트가 헤더 영역까지 풀폭)
- 사용자 chip + 로그아웃 = `pointer-events-auto` floating

### Hero 배너 (LibraryPage)
- `aspect-[5/2] md:aspect-[4/1]` (모바일 5:2 / 데스크톱 4:1)
- `bg-[url(...)] bg-cover bg-center` watercolor 일러스트
- 검색바 floating: `absolute inset-x-0 bottom-6 max-w-2xl bg-white shadow-pop`

### 책 카드 ([BookCard](../packages/client/src/features/library/components/BookCard.tsx))
- 카드 배경 X — 일러스트 풀 (`aspect-video rounded-2xl shadow-soft`)
- 제목은 일러스트 아래 (`mt-2 px-1 text-lg md:text-xl font-black font-display`)

### 카테고리 섹션 ([CategorySection](../packages/client/src/features/library/components/CategorySection.tsx))
- 헤딩 `text-3xl font-black font-display` + 권수 배지 (흰 pill `text-base`)
- 그리드 `grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6`
- 카테고리당 9권 (3행), 초과 시 "더 보기 (N권)" 버튼 (coral pastel)

### Chip Row
- 가로 스크롤 `overflow-x-auto`
- 4-5세 가독성: `<Chip>` 에 `className="!text-base !px-5 !py-2"` 추가 (default 14px → 16px)
- "전체" = `variant="ink"` (검정), 카테고리 = `variant="coral"`, "읽는 중" = `variant="warn"` (amber)

### 모드 카드 (BookDetailPage 책읽기/영상/단어 익히기)
- 가로 긴 형태 — 좌 제목+부제 / 우 흰 동그라미 워시 (`bg-white/85 ring-2 ring-white`) 안 PNG / 우끝 → 화살표
- tone:
  - **coral** (책읽기) — `bg-gradient-to-br from-coral-400 to-coral-500`
  - **violet-blue** (영상) — disabled 음영 (영상 없는 책)
  - **yellow→amber** (단어) — `bg-gradient-to-br from-yellow-400 to-warn`
- 일러스트: `public/icons/mode/{book,video,word}.png` (soft 3D rendered, 그림체 독립)

## 7. 화면별 reference

| 화면 | 파일 | 노트 |
|---|---|---|
| LibraryPage | [pages/LibraryPage.tsx](../packages/client/src/pages/LibraryPage.tsx) | 메인 진입. hero 배너 + 카테고리 섹션 |
| BookDetailPage | [pages/BookDetailPage.tsx](../packages/client/src/pages/BookDetailPage.tsx) | AppShell **밖**. 풀폭 정방형 표지 + 모드 카드 3 |
| VocabularyStudyPage | [features/vocabulary-unit/components/VocabularyStudyPage.tsx](../packages/client/src/features/vocabulary-unit/components/VocabularyStudyPage.tsx) | AppShell **밖**. 단어 미리보기 + 게임 카드 4 |

## 8. GPT 등으로 시안 그릴 때 — 사용자 측 prompt 템플릿

GPT/Midjourney 등에 시안 요청할 때 함께 보내면 톤 매칭 잘 됨:

```
탱고북 (4-5세 한국 동화책 학습 앱) 의 [화면 이름] 디자인 시안.

디자인 시스템:
- 톤: Khan Academy Kids × 곰돌이푸 × Duolingo. Warm & Cozy + Playful.
- 타겟: 4-5세 + 태블릿 1024-1366 (큰 글자, 큰 터치)
- 메인 색: coral #FF5E3A (CTA), cream #FFF9F3 (배경), peach #FFF0E0, ink-900 #0B0805 (텍스트)
- 보조: success #5CC99F, warn #FFC857, fun (violet) #A78BFA, info #6BAEE8
- 폰트: NanumSquareRound (제목, 둥근 한글체), Pretendard (본문)
- 카드 라운드: 16px (rounded-2xl), 큰 박스: 24px (rounded-3xl), pill: full
- shadow: soft 부드러운 그림자
- 일러스트: watercolor 톤 또는 paper-craft, soft 3D rendered

화면 의도: [예: 부모가 책 상세 보고 어떤 모드로 학습 시작할지 고르는 화면]
강조: [예: 모드 카드 3개를 한 눈에]
변경: [기존 화면과 다른 점]

포함:
- 사이드바 (없으면 명시)
- 헤더 (있으면 어떤 요소)
- 메인 컨텐츠
```

## 9. Claude 가 시안 받을 때 — 매번 도는 protocol

새 시안 받으면 **Step 1 부터 순서대로**:

### Step 1 — 시안 분석 보고서 (사용자 확인)
- 화면 이름 + 의도 파악
- 시안에서 보이는 색 → 디자인 시스템 토큰 매핑 (예: 시안의 주황 → `coral-500`)
- 시안에서 보이는 폰트 사이즈 → Tailwind 클래스 매핑
- 시안에서 보이는 컴포넌트 → 기존 primitive 매핑 (예: pill 버튼 → `<Chip>`)
- **신규 토큰/컴포넌트 필요한 것 별도 표시**
- 사용자에게 매핑 보고 + 확인

### Step 2 — 신규 토큰/컴포넌트 분리 (필요 시)
- 신규 색 토큰 → `tokens/colors.ts` + Tailwind config + 이 문서 반영
- 신규 컴포넌트 → `primitives/` 에 추가
- 분리 PR 또는 별도 commit

### Step 3 — 화면 구현
- **100% 토큰 + 기존 컴포넌트** 사용
- 하드코딩 금지: 색은 항상 토큰 (`bg-coral-500`), 폰트는 Tailwind 클래스 (`text-xl`)
- pull request 시 이 문서 reference 명시

### 위반 시 자동 검출
- 하드코딩 색 (`bg-[#FF5E3A]` 같은 임의 값) → 토큰으로 교체
- 새 button/chip 컴포넌트 → primitive 사용 또는 추가
- 4-5세 화면 `text-sm` 이하 → 키우기

## 10. 문서 갱신 규칙

- 새 토큰/컴포넌트 추가 시 이 문서도 반영 (PR 에 같이)
- 색 팔레트 변경 시 — `colors.ts` + `tailwind.config.ts` + `index.css` (CSS 변수) + 이 문서 4곳 동기
- 폰트 변경 시 — `typography.ts` + `tailwind.config.ts` (inline 정의) + `index.css` (jsdelivr CDN @import) + 이 문서 4곳 동기
