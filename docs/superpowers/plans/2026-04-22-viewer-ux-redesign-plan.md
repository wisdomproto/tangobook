# 뷰어 UI/UX 전면 리디자인 — 구현 플랜

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 탱고북의 아이 전용 뷰어(라이브러리 랜딩 → 책 상세 → 뷰어 → 책 끝 보상 + YouTube)를 유아 친화 디자인으로 전면 리빌드. 기존 저작도구·게임 내부는 건드리지 않음.

**Architecture:** Warm & Cozy 디자인 토큰 + Clean 여백 + Playful 비비드 액센트. 마스코트(호랑이) 시스템에 Hybrid 자산(PNG + Lottie) + fallback 체인. 진입 플로우: `/library` → `/library/:id` (신규 BookDetailPage) → `/viewer/:id`. 책 끝 RewardScreen은 ViewerContainer 내부 오버레이.

**Tech Stack:** React 18 + TypeScript + Vite · Tailwind v3 + CSS variables · framer-motion (전환) · lottie-react (마스코트) · canvas-confetti (파티클) · Nunito + 학교안심둥근체 · YouTube iframe (youtube-nocookie.com) · vitest (헬퍼 단위 테스트).

**Spec:** `docs/superpowers/specs/2026-04-22-viewer-ux-redesign-design.md`

---

## File Structure

### 신규 파일
```
packages/client/
  public/mascot/tiger/                      # 마스코트 자산
    idle.json                                # Lottie (MCP 생성)
    waving.json
    cheering.json
    celebrating.json
    dancing.json
    idle.webp                                # PNG 백업
    waving.webp
    thinking.webp                            # PNG only (AI 생성)
    reading.webp
    pointing.webp
    sleeping.webp
    sad.webp

  src/
    lib/
      cn.ts                                  # clsx + tailwind-merge wrapper
      storybook-accessors.ts                 # Data Access Helpers (§9 스펙)
      storybook-accessors.test.ts            # 단위 테스트

    components/                              # 공통 UI (기존 + 신규)
      Mascot.tsx                             # 마스코트 컴포넌트 (fallback 체인)
      Card.tsx                               # 공통 카드
      Skeleton.tsx                           # shimmer 로딩
      StateScreen.tsx                        # 빈/에러 공통 화면
      ErrorBoundary.tsx                      # 라우트 레벨 에러 경계
      Button.tsx                             # 수정 (variants 확장)

    features/
      library/                               # 신규 feature
        components/
          BookCard.tsx
          CategorySection.tsx
          WelcomeHeader.tsx
        index.ts

      viewer/
        components/
          RewardScreen.tsx                   # 신규
          YouTubeModal.tsx                   # 신규
          BookSpineProgress.tsx              # 신규 (페이지 등뼈 진행률)
          MascotCorner.tsx                   # 신규 (BGM 재생 중 마스코트)

    pages/
      BookDetailPage.tsx                     # 신규 (/library/:id)

    test/
      setup.ts                               # vitest 셋업

  vitest.config.ts                           # 신규
  tailwind.config.js                         # 수정 (토큰 확장)
  src/index.css                              # 수정 (폰트·CSS 변수)
  package.json                               # 수정 (패키지 + test 스크립트)
```

### 수정 파일
```
packages/client/src/
  pages/LibraryPage.tsx                      # 전면 리뉴얼
  router/index.tsx                           # /library/:id 라우트 추가
  features/viewer/components/
    ViewerContainer.tsx                      # 툴바/컨트롤/레이아웃 리뉴얼
    PageView.tsx                             # 페이지 전환 애니 + 텍스트 카드
    ViewerToolbar.tsx                        # Pill 스타일
    ViewerControls.tsx                       # 64px 원형 네비 + 플레이 컨트롤 그룹
```

---

## Chunk 1: Phase A — Foundation

**목표:** 디자인 토큰·폰트·패키지·테스트 인프라·공통 컴포넌트 스텁·Data Access Helpers·Mascot 컴포넌트. 끝나면 기존 화면이 깨지지 않고 새 토큰만 로드된 상태.

**기간:** 약 4일

**스코프 주의:**
- **Button 주요 톤이 violet → coral로 전환됨** (색만 변경, variant 이름 동일). 저작도구 페이지의 primary 버튼들도 자동으로 coral로 보이게 됨 — **이는 의도된 전 영역 톤 통일**. 저작도구는 이번 스펙 범위 밖이지만 Button 공유이므로 톤이 한 번에 바뀜. 어색한 특정 저작도구 화면이 있으면 후속 PR로 해당 버튼만 다른 variant로 바꾸면 됨.
- **`FeedbackOverlay`와 `Modal` 리팩토링은 본 Chunk 범위 밖**. FeedbackOverlay는 Phase D(RewardScreen) 또는 후속 게임 스펙에서. Modal은 기존 것 재사용.
- **Lottie 5개 생성(MCP 필요)은 Chunk 1.5로 분리** — 아래 별도 섹션 참조. MCP 가용 시 진행하고, 없어도 Chunk 1 본체는 이모지 fallback으로 동작하므로 다음 Phase 진행 가능.

### Task A1: 의존성 설치 + vitest 인프라

**Files:**
- Modify: `packages/client/package.json` (dependencies 추가, scripts 추가)
- Create: `packages/client/vitest.config.ts`
- Create: `packages/client/src/test/setup.ts`

- [x] **Step 1: 런타임 의존성 설치**

```bash
pnpm add framer-motion lottie-react canvas-confetti clsx tailwind-merge --filter @tangobook/client
```

Expected: `packages/client/package.json`의 `dependencies`에 5개 추가.

- [x] **Step 2: 테스트 도구 설치**

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom --filter @tangobook/client
```

- [x] **Step 3: `packages/client/package.json`의 scripts에 test 추가**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

- [x] **Step 4: `packages/client/vitest.config.ts` 생성**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [x] **Step 5: `packages/client/src/test/setup.ts` 생성**

```ts
import '@testing-library/jest-dom/vitest';
```

- [x] **Step 6: `packages/client/tsconfig.json`에 vitest 타입 추가**

`"types": ["vite/client"]` 항목이 있으면 `"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]`로 변경. 없으면 `compilerOptions`에 추가.

- [x] **Step 7: sanity 테스트 확인**

```bash
pnpm --filter @tangobook/client test
```

Expected: "No test files found" 또는 0개 테스트 통과 (테스트 아직 없음).

- [x] **Step 8: 커밋**

```bash
git add packages/client/package.json packages/client/vitest.config.ts packages/client/src/test/setup.ts packages/client/tsconfig.json pnpm-lock.yaml
git commit -m "chore(client): add framer-motion/lottie/confetti deps + vitest testing infra"
```

### Task A2: cn() 유틸리티

**Files:**
- Create: `packages/client/src/lib/cn.ts`
- Create: `packages/client/src/lib/cn.test.ts`

- [ ] **Step 1: Write the failing test (`cn.test.ts`)**

```ts
import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-3')).toBe('px-2 py-3');
  });

  it('dedupes conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('ignores falsy values', () => {
    expect(cn('px-2', false, null, undefined, 'py-3')).toBe('px-2 py-3');
  });

  it('handles conditional objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});
```

- [ ] **Step 2: Verify fail**

```bash
pnpm --filter @tangobook/client test src/lib/cn.test.ts
```

Expected: FAIL (`cn` not defined).

- [ ] **Step 3: Implement (`cn.ts`)**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Verify pass**

```bash
pnpm --filter @tangobook/client test src/lib/cn.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/lib/cn.ts packages/client/src/lib/cn.test.ts
git commit -m "feat(client): add cn() className utility (clsx + tailwind-merge)"
```

### Task A3: Data Access Helpers (TDD)

**Files:**
- Create: `packages/client/src/lib/storybook-accessors.ts`
- Create: `packages/client/src/lib/storybook-accessors.test.ts`

- [ ] **Step 1: Write failing tests for `hasVideoUrl`**

```ts
// storybook-accessors.test.ts
import { describe, it, expect } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import {
  hasVideoUrl,
  getPrimaryVideoId,
  getAvailableLanguages,
  hasGames,
} from './storybook-accessors';

const makeStorybook = (overrides: Partial<Storybook> = {}): Storybook => ({
  id: 's1',
  title: 'Test',
  targetAge: '4-5',
  artStyle: 'flat',
  createdAt: '2026-04-22T00:00:00Z',
  characters: [],
  pages: [],
  educational_content: { vocabulary: [], quiz: [], learning_objectives: [], moral_lesson: '' },
  ...overrides,
});

describe('hasVideoUrl', () => {
  it('returns false for empty book', () => {
    expect(hasVideoUrl(makeStorybook())).toBe(false);
  });

  it('returns true when audiobookProjects has a youtubeUpload', () => {
    const book = makeStorybook({
      audiobookProjects: [
        { id: 'a1', title: 'v1', createdAt: '2026-01-01', youtubeUpload: { videoId: 'abc', videoUrl: 'u', uploadedAt: '2026-01-02' } } as any,
      ],
    });
    expect(hasVideoUrl(book)).toBe(true);
  });

  it('returns true when longformProjects has a youtubeUpload', () => {
    const book = makeStorybook({
      longformProjects: [
        { id: 'l1', title: 'v1', createdAt: '2026-01-01', scenes: [], youtubeUpload: { videoId: 'xyz', videoUrl: 'u', uploadedAt: '2026-01-02' } } as any,
      ],
    });
    expect(hasVideoUrl(book)).toBe(true);
  });

  it('returns false when projects exist but no youtubeUpload', () => {
    const book = makeStorybook({
      audiobookProjects: [{ id: 'a1', title: 'v1', createdAt: '2026-01-01' } as any],
    });
    expect(hasVideoUrl(book)).toBe(false);
  });
});
```

- [ ] **Step 2: Write failing tests for `getPrimaryVideoId`**

Append to the same file:

```ts
describe('getPrimaryVideoId', () => {
  it('returns null when no video', () => {
    expect(getPrimaryVideoId(makeStorybook())).toBeNull();
  });

  it('returns audiobook videoId when only audiobook exists', () => {
    const book = makeStorybook({
      audiobookProjects: [
        { id: 'a1', youtubeUpload: { videoId: 'A', videoUrl: 'u', uploadedAt: '2026-01-01' } } as any,
      ],
    });
    expect(getPrimaryVideoId(book)).toBe('A');
  });

  it('returns latest upload across projects by uploadedAt', () => {
    const book = makeStorybook({
      audiobookProjects: [
        { id: 'a1', youtubeUpload: { videoId: 'OLD', videoUrl: 'u', uploadedAt: '2026-01-01' } } as any,
      ],
      longformProjects: [
        { id: 'l1', youtubeUpload: { videoId: 'NEW', videoUrl: 'u', uploadedAt: '2026-03-01' } } as any,
      ],
    });
    expect(getPrimaryVideoId(book)).toBe('NEW');
  });
});
```

- [ ] **Step 3: Write failing tests for `getAvailableLanguages`**

```ts
describe('getAvailableLanguages', () => {
  it('returns [] for book with no pages', () => {
    expect(getAvailableLanguages(makeStorybook())).toEqual([]);
  });

  it('returns ["ko"] when pages exist but no translations', () => {
    const book = makeStorybook({
      pages: [{ pageNumber: 1, text: '안녕', scene_description: '', scene_structure: {} as any }],
    });
    expect(getAvailableLanguages(book)).toEqual(['ko']);
  });

  it('adds extra languages from translations keys', () => {
    const book = makeStorybook({
      pages: [
        { pageNumber: 1, text: '안녕', scene_description: '', scene_structure: {} as any, translations: { en: { text: 'Hi' }, ja: { text: 'こんにちは' } } },
      ],
    });
    expect(getAvailableLanguages(book).sort()).toEqual(['en', 'ja', 'ko']);
  });

  it('does not duplicate ko if translations somehow include ko', () => {
    const book = makeStorybook({
      pages: [
        { pageNumber: 1, text: '안녕', scene_description: '', scene_structure: {} as any, translations: { ko: { text: '안녕' }, en: { text: 'Hi' } } },
      ],
    });
    const langs = getAvailableLanguages(book);
    expect(langs.filter(l => l === 'ko')).toHaveLength(1);
    expect(langs).toContain('en');
  });
});

describe('hasGames', () => {
  it('returns false for undefined games', () => {
    expect(hasGames(makeStorybook())).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasGames(makeStorybook({ games: [] }))).toBe(false);
  });

  it('returns true when games array has items', () => {
    expect(hasGames(makeStorybook({ games: [{ id: 'g1' } as any] }))).toBe(true);
  });
});
```

- [ ] **Step 4: Verify tests fail**

```bash
pnpm --filter @tangobook/client test src/lib/storybook-accessors.test.ts
```

Expected: all FAIL (module not found).

- [ ] **Step 5: Implement `storybook-accessors.ts`**

```ts
import type { Storybook, YouTubeUploadResult } from '@tangobook/shared';

export type LangCode = 'ko' | 'en' | (string & {});

export function hasVideoUrl(storybook: Storybook): boolean {
  const audio = storybook.audiobookProjects?.some(p => !!p.youtubeUpload?.videoId);
  const lf    = storybook.longformProjects?.some(p => !!p.youtubeUpload?.videoId);
  return !!(audio || lf);
}

export function getPrimaryVideoId(storybook: Storybook): string | null {
  const all: YouTubeUploadResult[] = [
    ...(storybook.audiobookProjects ?? []).flatMap(p => p.youtubeUpload ? [p.youtubeUpload] : []),
    ...(storybook.longformProjects  ?? []).flatMap(p => p.youtubeUpload ? [p.youtubeUpload] : []),
  ];
  if (all.length === 0) return null;
  all.sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''));
  return all[0].videoId ?? null;
}

export function getAvailableLanguages(storybook: Storybook): LangCode[] {
  const pages = storybook.pages ?? [];
  if (pages.length === 0) return [];
  const result: LangCode[] = ['ko'];
  const extraSet = new Set<string>();
  for (const p of pages) {
    if (p.translations) for (const key of Object.keys(p.translations)) extraSet.add(key);
  }
  for (const k of extraSet) if (!result.includes(k as LangCode)) result.push(k as LangCode);
  return result;
}

export function hasGames(storybook: Storybook): boolean {
  return (storybook.games?.length ?? 0) > 0;
}
```

- [ ] **Step 6: Verify tests pass**

```bash
pnpm --filter @tangobook/client test src/lib/storybook-accessors.test.ts
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/lib/storybook-accessors.ts packages/client/src/lib/storybook-accessors.test.ts
git commit -m "feat(client): add storybook accessors (hasVideoUrl/getPrimaryVideoId/getAvailableLanguages/hasGames)"
```

### Task A4: Tailwind 토큰 확장

**Files:**
- Modify: `packages/client/tailwind.config.js`

- [ ] **Step 1: 현재 config 읽기**

`packages/client/tailwind.config.js`를 읽고 기존 `theme.extend` 내용을 확인.

- [ ] **Step 2: 색상·radius·spacing·fontFamily 토큰 추가**

`theme.extend`에 다음을 추가(기존 확장 유지):

```js
theme: {
  extend: {
    colors: {
      // Warm base
      cream: { 50: '#FFF9F3' },
      peach: {
        100: '#FFF0E0',
        200: '#FFDDBF',
        300: '#FFC19B',
        500: '#FF9A5A',
      },
      // Accent CTA
      coral: {
        100: '#FFE4DC',
        200: '#FFBFA8',
        400: '#FF7A59',
        500: '#FF5E3A',
        600: '#E84B2A',
      },
      // Semantic
      success: '#5CC99F',
      info:    '#6BAEE8',
      warn:    '#FFC857',
      danger:  '#E75757',   // CSS 변수 --color-error와 쌍 (Button variant 'danger'와 의미 통일)
      fun:     '#A78BFA',
      // Ink (텍스트)
      ink: {
        100: '#EDE1D4',
        300: '#C9B8A8',
        500: '#9A8474',
        700: '#6F5A48',
        900: '#3A2B1F',
      },
      // Dark
      darkbg:   '#1F1611',
      darktext: '#FFF0E0',
    },
    borderRadius: {
      'xs': '8px',
      'md': '16px',
      'lg': '24px',
      'xl': '32px',
    },
    fontFamily: {
      sans: ['Nunito', '학교안심둥근체', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      display: ['Nunito', '학교안심둥근체', 'sans-serif'],
    },
    boxShadow: {
      'soft': '0 2px 8px rgba(0,0,0,0.06)',
      'card': '0 4px 16px rgba(0,0,0,0.08)',
      'pop':  '0 6px 20px rgba(255,94,58,0.35)',
    },
  },
},
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: 통과 (설정 파일은 typecheck 영향 없음, 방어적으로 확인).

- [ ] **Step 4: 기존 화면 sanity 체크**

```bash
pnpm dev
```

수동 확인: http://localhost:5174 뜨고 기존 LibraryPage 깨짐 없이 보이는지. 토큰이 "추가"만 됐으므로 기존 클래스는 그대로여야.

- [ ] **Step 5: Commit**

```bash
git add packages/client/tailwind.config.js
git commit -m "feat(client): add warm&cozy design tokens to tailwind config"
```

### Task A5: 폰트 로드 + CSS 변수

**Files:**
- Modify: `packages/client/src/index.css`

- [ ] **Step 1: `index.css` 상단에 폰트 + 변수 블록 추가**

`@tailwind base;` 위에 다음을 추가:

```css
/* Google Fonts — Nunito */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap');

/* 학교안심둥근체 (우아한형제들 배민 CDN 또는 공식 eduFont CDN)
   로컬 fallback 체인: Nunito → sans-serif
   학교안심둥근체가 상업 무료라 공식 배포처 확인 후 교체 가능. MVP는 Google Fonts의 둥근 한글 대체로 'IBM Plex Sans KR' 사용 가능. */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@500;700&display=swap');

:root {
  /* Base */
  --color-cream-50: #FFF9F3;
  --color-peach-100: #FFF0E0;
  --color-peach-200: #FFDDBF;
  --color-peach-300: #FFC19B;
  --color-peach-500: #FF9A5A;
  /* Coral */
  --color-coral-100: #FFE4DC;
  --color-coral-400: #FF7A59;
  --color-coral-500: #FF5E3A;
  --color-coral-600: #E84B2A;
  /* Semantic */
  --color-success: #5CC99F;
  --color-info:    #6BAEE8;
  --color-warn:    #FFC857;
  --color-danger:  #E75757;  /* Tailwind 'danger' 토큰과 쌍 */
  --color-fun:     #A78BFA;
  /* Ink */
  --color-ink-900: #3A2B1F;
  --color-ink-700: #6F5A48;
  --color-ink-500: #9A8474;
  /* Dark */
  --color-dark-bg:   #1F1611;
  --color-dark-text: #FFF0E0;
}

/* prefers-reduced-motion — Lottie/애니 끄고 fade만 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: 기본 body 스타일 보강**

기존 `@tailwind` 지시문 아래에 추가 (있으면 기존 것 확장):

```css
@layer base {
  body {
    font-family: 'Nunito', 'IBM Plex Sans KR', 'ui-sans-serif', system-ui, sans-serif;
    color: var(--color-ink-900);
    background: var(--color-cream-50);
  }
}
```

- [ ] **Step 3: 폰트 로드 수동 확인**

```bash
pnpm dev
```

브라우저 dev tools → Network → Fonts 탭에 Nunito와 IBM Plex Sans KR 로드 확인.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/index.css
git commit -m "feat(client): load Nunito + IBM Plex Sans KR fonts, add CSS variables"
```

> **Note:** 학교안심둥근체는 Phase E에서 공식 CDN 확인 후 교체할 수 있음. IBM Plex Sans KR은 Google Fonts에서 바로 쓰기 쉽고 유아 친화 둥근 글꼴이라 MVP 대체로 적합.

### Task A6: Button 리팩토링 (variants 확장)

**Files:**
- Modify: `packages/client/src/components/Button.tsx`

- [ ] **Step 1: 기존 Button 읽기**

현재 `Button.tsx` 내용 파악 (variants가 어떤 것들 있는지).

- [ ] **Step 2: variants 확장된 Button 재작성**

기존 prop 시그니처 유지하되 아래 스타일 맵을 적용:

```tsx
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:   'bg-gradient-to-br from-coral-400 to-coral-500 text-white shadow-pop hover:brightness-105 active:brightness-95',
  secondary: 'bg-white text-ink-900 shadow-soft hover:bg-cream-50 active:bg-peach-100',
  ghost:     'bg-transparent text-ink-700 hover:bg-peach-100 active:bg-peach-200',
  danger:    'bg-danger text-white shadow-soft hover:brightness-105',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-md min-h-[40px]',
  md: 'px-5 py-3 text-base rounded-lg min-h-[48px]',
  lg: 'px-7 py-4 text-lg rounded-lg min-h-[56px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, leftIcon, rightIcon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-bold font-display transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="animate-spin" aria-hidden>⟳</span> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
});
```

- [ ] **Step 3: 기존 Button 사용처에서 타입 문제 없는지 typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

Expected: 통과. variant 이름(primary/secondary/ghost/danger)은 기존과 동일하므로 call site 수정 없음.

- [ ] **Step 4: 수동 시각 확인 — 저작도구 포함 전 화면 sanity**

```bash
pnpm dev
```

확인 목록:
- 저작도구 홈(`/`), 저작도구 상세 페이지들 → **primary 버튼이 coral 그라데이션으로 변경됨 (의도된 변화)**
- 뷰어 라이브러리(`/library`) → 기존 레이아웃 유지 + 버튼만 coral
- 콘솔 에러 없음

**예상됨**: 저작도구 페이지들이 원래 violet primary였다면 이제 coral이 됨. 이건 전 영역 톤 통일 목적의 의도된 변화. 이상한 레이아웃 파손은 없어야 함.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/components/Button.tsx
git commit -m "refactor(client): switch Button primary to coral (unifies tone across app)"
```

### Task A7: Card 컴포넌트

**Files:**
- Create: `packages/client/src/components/Card.tsx`

- [ ] **Step 1: Card 작성**

```tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive, padding = 'md', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-soft',
        interactive && 'transition-all hover:-translate-y-0.5 hover:shadow-card cursor-pointer active:translate-y-0',
        paddingClass[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/Card.tsx
git commit -m "feat(client): add Card component"
```

### Task A8: Skeleton (shimmer 로딩)

**Files:**
- Create: `packages/client/src/components/Skeleton.tsx`
- Modify: `packages/client/src/index.css` (shimmer keyframes)

- [ ] **Step 1: index.css에 shimmer keyframes 추가**

```css
@keyframes sk-slide {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #EDE1D4 0%, #F9F0E4 50%, #EDE1D4 100%);
  background-size: 200% 100%;
  animation: sk-slide 1.4s infinite;
}
```

- [ ] **Step 2: Skeleton.tsx 작성**

```tsx
import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className, rounded }: SkeletonProps) {
  return <div className={cn('skeleton-shimmer', rounded ? 'rounded-md' : '', className)} />;
}

export function SkeletonBookCard() {
  return (
    <div className="bg-white rounded-lg p-3 shadow-soft">
      <Skeleton className="aspect-[3/4] rounded-md" />
      <Skeleton className="h-4 mt-3 w-3/4 rounded" />
      <Skeleton className="h-3 mt-2 w-1/2 rounded" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/Skeleton.tsx packages/client/src/index.css
git commit -m "feat(client): add Skeleton shimmer component"
```

### Task A9: Mascot 컴포넌트 (fallback 체인)

**Files:**
- Create: `packages/client/src/components/Mascot.tsx`
- Create: `packages/client/src/components/Mascot.test.tsx`
- Create: `packages/client/public/mascot/README.md` (자산 설명 noting)

- [ ] **Step 1: 자산 폴더 준비**

```bash
mkdir -p packages/client/public/mascot/tiger
```

`packages/client/public/mascot/README.md` 작성:

```markdown
# Mascot Assets

호랑이 마스코트 자산. Phase A에선 fallback(이모지) 동작. Phase E에 최종 호랑이 에셋 통합.

- Lottie (5): idle.json, waving.json, cheering.json, celebrating.json, dancing.json
- PNG (7): idle.webp, waving.webp, thinking.webp, reading.webp, pointing.webp, sleeping.webp, sad.webp
- Fallback: 파일 없으면 이모지 (🐯 기본, 상태별 매핑)
```

- [ ] **Step 2: Mascot.test.tsx 작성 (failing)**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Mascot, MASCOT_EMOJI_FALLBACK } from './Mascot';

describe('Mascot', () => {
  it('renders PNG img for PNG-only state immediately (thinking)', () => {
    // thinking은 Lottie 아니므로 초기 stage='png' → <img> 동기 렌더
    render(<Mascot state="thinking" />);
    const img = document.querySelector('img[aria-hidden="true"]');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toContain('thinking.webp');
  });

  it('renders message bubble when message prop is set', () => {
    render(<Mascot state="waving" message="안녕!" />);
    expect(screen.getByText('안녕!')).toBeInTheDocument();
  });

  it('exports emoji fallback map with all states', () => {
    expect(MASCOT_EMOJI_FALLBACK.idle).toBe('🐯');
    expect(MASCOT_EMOJI_FALLBACK.thinking).toBe('🤔');
    expect(MASCOT_EMOJI_FALLBACK.sleeping).toBe('😴');
    expect(MASCOT_EMOJI_FALLBACK.sad).toBe('😿');
  });
});
```

**왜 idle은 테스트 안 하나?** Lottie 상태는 초기 `stage='lottie'`로 시작해 fetch 해결까지 DOM에 아무것도 없음. jsdom에서 fetch 모킹 없이는 불안정. 수동 QA(Step 7)로 검증.

- [ ] **Step 3: Verify fail**

```bash
pnpm --filter @tangobook/client test src/components/Mascot.test.tsx
```

Expected: FAIL (module not found).

- [ ] **Step 4: Mascot.tsx 작성**

```tsx
import { useEffect, useState, type CSSProperties } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/cn';

export type MascotState =
  | 'idle' | 'waving' | 'thinking' | 'reading' | 'pointing'
  | 'cheering' | 'celebrating' | 'dancing' | 'sleeping' | 'sad';

export type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

export const MASCOT_EMOJI_FALLBACK: Record<MascotState, string> = {
  idle: '🐯', waving: '👋', thinking: '🤔', reading: '📖', pointing: '👉',
  cheering: '👏', celebrating: '🎉', dancing: '💃', sleeping: '😴', sad: '😿',
};

const LOTTIE_STATES = new Set<MascotState>(['idle', 'waving', 'cheering', 'celebrating', 'dancing']);
const SIZE_PX: Record<MascotSize, number> = { sm: 48, md: 80, lg: 120, xl: 200 };

interface MascotProps {
  state: MascotState;
  size?: MascotSize;
  message?: string;
  loop?: boolean;
  onClick?: () => void;
  className?: string;
  character?: 'tiger';
}

type Stage = 'lottie' | 'png' | 'emoji';

export function Mascot({
  state, size = 'md', message, loop = true, onClick, className, character = 'tiger',
}: MascotProps) {
  const [stage, setStage] = useState<Stage>(LOTTIE_STATES.has(state) ? 'lottie' : 'png');
  const [lottieData, setLottieData] = useState<object | null>(null);

  const px = SIZE_PX[size];
  const basePath = `/mascot/${character}`;

  // Lottie 로드 — useEffect로 이동 (render 중 fetch 방지, StrictMode 안전)
  useEffect(() => {
    if (stage !== 'lottie' || lottieData) return;
    let cancelled = false;
    fetch(`${basePath}/${state}.json`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('lottie 404')))
      .then(data => { if (!cancelled) setLottieData(data); })
      .catch(() => { if (!cancelled) setStage('png'); });
    return () => { cancelled = true; };
  }, [stage, state, lottieData, basePath]);

  // state 바뀌면 stage 재평가 + lottie 데이터 초기화
  useEffect(() => {
    setStage(LOTTIE_STATES.has(state) ? 'lottie' : 'png');
    setLottieData(null);
  }, [state]);

  const sizeStyle: CSSProperties = { width: px, height: px };

  const content = (() => {
    if (stage === 'lottie' && lottieData) {
      return <Lottie animationData={lottieData} loop={loop} style={sizeStyle} />;
    }
    if (stage === 'png') {
      return (
        <img
          src={`${basePath}/${state}.webp`}
          alt=""
          aria-hidden="true"
          style={sizeStyle}
          onError={() => setStage('emoji')}
        />
      );
    }
    // stage === 'emoji' or lottie still loading
    return (
      <span
        role="img"
        aria-hidden="true"
        style={{ ...sizeStyle, fontSize: px * 0.85, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {MASCOT_EMOJI_FALLBACK[state]}
      </span>
    );
  })();

  return (
    <div
      className={cn('inline-flex items-center gap-3', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {content}
      {message && (
        <div className="relative bg-white px-4 py-2 rounded-lg rounded-bl-sm shadow-soft text-ink-900 font-bold text-sm max-w-xs">
          {message}
        </div>
      )}
    </div>
  );
}
```

**설계 포인트:**
- fetch는 `useEffect` 안. cancelled flag로 unmount 시 stale setState 방지.
- state prop 변경 시 두 번째 useEffect가 stage/lottieData 리셋 → 새로운 Lottie 로드 트리거.
- Lottie 로딩 중(stage='lottie' && lottieData=null)엔 이모지 fallback을 잠깐 보여주는 게 기본. 전환 깜빡임 싫으면 추후 `<Mascot hideUntilReady />` 옵션 추가 검토 (Phase C+).

- [ ] **Step 5: Verify tests pass**

```bash
pnpm --filter @tangobook/client test src/components/Mascot.test.tsx
```

- [ ] **Step 6: 수동 sanity — 빈 자산 상태에서 이모지 fallback 동작 확인**

임시로 아무 페이지에 `<Mascot state="idle" />` 넣고 `pnpm dev` 실행. Network 탭에서 `/mascot/tiger/idle.json` 404 → `/mascot/tiger/idle.webp` 404 → 🐯 이모지 표시되는지.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/Mascot.tsx packages/client/src/components/Mascot.test.tsx packages/client/public/mascot/README.md
git commit -m "feat(client): add Mascot component with 3-stage fallback (Lottie→PNG→emoji)"
```

### Task A10: StateScreen (빈/에러 공통)

**Files:**
- Create: `packages/client/src/components/StateScreen.tsx`

- [ ] **Step 1: 작성**

```tsx
import type { ReactNode } from 'react';
import { Mascot, type MascotState } from './Mascot';
import { Button } from './Button';

interface StateScreenProps {
  mascotState: MascotState;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function StateScreen({ mascotState, title, description, action, children }: StateScreenProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
      <Mascot state={mascotState} size="lg" />
      <h2 className="text-2xl font-black text-ink-900 font-display">{title}</h2>
      {description && <p className="text-ink-700 text-base max-w-md">{description}</p>}
      {action && (
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 2: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/StateScreen.tsx
git commit -m "feat(client): add StateScreen for empty/error/loading states"
```

### Task A11: ErrorBoundary (라우트 레벨)

**Files:**
- Create: `packages/client/src/components/ErrorBoundary.tsx`

- [ ] **Step 1: 작성**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StateScreen } from './StateScreen';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info); }

  render() {
    if (this.state.hasError) {
      return (
        <StateScreen
          mascotState="sad"
          title={this.props.fallbackMessage ?? '뭔가 이상해'}
          description="다시 시도해볼까?"
          action={{ label: '↻ 다시', onClick: () => location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: typecheck + Commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/components/ErrorBoundary.tsx
git commit -m "feat(client): add ErrorBoundary with StateScreen fallback"
```

### Task A12: Phase A 마무리 — dev 기동 sanity

- [ ] **Step 1: 전체 타입체크 & 테스트**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

Expected: 모두 통과.

- [ ] **Step 2: dev 서버 기동**

```bash
pnpm dev
```

수동 확인:
- 기존 LibraryPage / Viewer 깨지지 않고 여전히 동작
- 저작도구 primary 버튼이 coral로 변환됨 (의도)
- 새 폰트(Nunito, IBM Plex Sans KR) 로드됨
- 콘솔 에러 없음
- 임시 페이지에 `<Mascot state="thinking" />` 붙여서 이모지 fallback 정상 확인 (PNG 404 → 🤔)

- [ ] **Step 3: Phase A 완료 메모**

Phase A는 "뷰어 경험 자체 변화 거의 없음, 토큰·인프라만 구축"이 의도. Phase B부터 실제 UI 변경 시작.

---

**🏁 Chunk 1 (Phase A) 완료 기준:**
- [ ] `pnpm test` 통과 (cn, storybook-accessors, Mascot 테스트)
- [ ] `pnpm typecheck` 통과
- [ ] 기존 레이아웃 깨짐 없음, Button 톤만 coral로 전환
- [ ] Mascot fallback 체인 동작 (PNG 404 → 이모지)
- [ ] 토큰(Tailwind config + CSS 변수) · 폰트 로드 · 6개 기초 컴포넌트(Button, Card, Skeleton, Mascot, StateScreen, ErrorBoundary) · 2개 lib(cn, storybook-accessors) · 테스트 인프라 완료

---

## Chunk 1.5: Lottie 마스코트 5개 생성 (MCP)

**목표:** `lottiefiles-creator` MCP로 호랑이 마스코트 Lottie 5개를 placeholder로 생성. Phase A 본체와 분리한 이유는 MCP 가용성·출력 검증이 별도 리스크라서. MCP가 실패해도 이모지 fallback으로 뷰어 계속 진행 가능.

**기간:** 1~2일 (MCP 상호작용 반복 감안)

### Task L1: MCP 도구 파악

**Files:** (읽기만)

- [ ] **Step 1: `mcp__lottiefiles-creator__get_rules` 호출**

반환되는 규칙 확인 — 파일 포맷(Bodymovin v5.x JSON), 크기 제약, 지원 피처.

- [ ] **Step 2: `mcp__lottiefiles-creator__get_api_doc` 호출**

생성 API 시그니처 파악.

- [ ] **Step 3: 결과를 플랜 파일에 주석으로 기록**

만약 출력 포맷이 예상과 다르면 이 스텝에서 플랜을 조정.

### Task L2: 5개 Lottie 생성

**Files:**
- Create: `packages/client/public/mascot/tiger/idle.json`
- Create: `packages/client/public/mascot/tiger/waving.json`
- Create: `packages/client/public/mascot/tiger/cheering.json`
- Create: `packages/client/public/mascot/tiger/celebrating.json`
- Create: `packages/client/public/mascot/tiger/dancing.json`

- [ ] **Step 1: idle.json 생성**

`mcp__lottiefiles-creator__run_script` 프롬프트:
```
Create a Lottie animation: a simple cute baby tiger mascot (super-deformed, oversized head, soft orange fur with white belly, subtle tiger stripes, large expressive eyes, friendly smile) in a breathing loop. Scale 1.0 → 1.03 → 1.0 over 2 seconds, smooth ease-in-out. Transparent background. 512x512. Output Bodymovin JSON.
```

저장: `packages/client/public/mascot/tiger/idle.json`

- [ ] **Step 2: waving.json 생성**

```
Same tiger character as idle.json. Standing front-facing, waving right paw hello. 2-second loop. Gentle wave motion, friendly expression, mouth slightly open smiling. Transparent background. 512x512. Bodymovin JSON.
```

저장: `packages/client/public/mascot/tiger/waving.json`

- [ ] **Step 3: cheering.json 생성**

```
Same tiger character. Clapping both paws together while doing a small jump in place. 1.5-second loop. Energetic and excited. Transparent background. 512x512. Bodymovin JSON.
```

- [ ] **Step 4: celebrating.json 생성**

```
Same tiger character. Both arms raised in victory pose, small confetti/sparkles around. 3-second loop (with initial impact then gentle bobbing). Transparent background. 512x512. Bodymovin JSON.
```

- [ ] **Step 5: dancing.json 생성**

```
Same tiger character. Swaying side to side rhythmically, paws near hips, happy expression. 2-second loop. Transparent background. 512x512. Bodymovin JSON.
```

- [ ] **Step 6: 파일 크기 · 검증**

```bash
ls -la packages/client/public/mascot/tiger/*.json
```

Expected:
- 5개 파일 모두 존재
- 각 파일 **100KB 이하** (스펙 §12)
- 만약 어떤 파일이 초과하면 MCP에 단순화 요청 ("reduce layer count to <15, use vector shapes only")

- [ ] **Step 7: 수동 재생 검증**

임시 페이지에 각 상태의 Mascot을 배치하고 `pnpm dev`로 렌더. 5개 모두 재생 확인. 루프 매끄러움, 전환 깜빡임 없음.

- [ ] **Step 8: Commit**

```bash
git add packages/client/public/mascot/tiger/
git commit -m "feat(client): add 5 Lottie mascot placeholders (idle/waving/cheering/celebrating/dancing)"
```

---

**🏁 Chunk 1.5 완료 기준:**
- [ ] 5개 Lottie JSON 파일 존재, 각 100KB 이하
- [ ] Mascot 컴포넌트에서 Lottie 재생 동작 확인
- [ ] 실패 시 이모지 fallback 여전히 동작

> **참고:** MCP 실패·품질 부족 시 이번 Chunk 전체를 skip하고 Chunk 2로 진행 가능. Phase E에서 사용자 AI 생성 호랑이 PNG를 참조 프레임으로 넘겨 재생성할 수 있음. 지금은 placeholder이므로 완벽할 필요 없음.

---

## Chunk 2: Phase B — 진입 플로우 (Library + BookDetail)

**목표:** 라이브러리 랜딩 페이지를 새 디자인으로 리빌드하고, 책 상세 페이지(`/library/:id`)를 신설. 카드 클릭 → 상세 → 뷰어 진입까지 새 플로우 완성.

**기간:** 약 5일

### Task B1: 라우터에 `/library/:id` 추가

**Files:**
- Modify: `packages/client/src/router/index.tsx`

- [x] **Step 1: 기존 라우터 내용 확인**

`router/index.tsx`를 열어 현재 라우트 구조를 파악.

- [x] **Step 2: BookDetailPage 임시 placeholder 생성**

```tsx
// packages/client/src/pages/BookDetailPage.tsx (임시 스텁)
export default function BookDetailPage() {
  return <div>Book Detail (Coming Soon)</div>;
}
```

- [x] **Step 3: 라우트 추가 (eager import, lazy X)**

기존 LibraryPage·ViewerPage가 eager로 import돼 있다면 BookDetailPage도 동일하게 eager. 400줄 이내 페이지라 code-split 가치 낮음 + Suspense 필요성 제거.

```tsx
import BookDetailPage from '@/pages/BookDetailPage';

// 기존 /library 라우트 아래에 추가
{ path: '/library/:id', element: <BookDetailPage /> },
```

- [x] **Step 4: `ErrorBoundary`로 라우트 감싸기**

라이브러리·뷰어 라우트들을 `<ErrorBoundary>`로 감쌈:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

{ path: '/library',     element: <ErrorBoundary><LibraryPage /></ErrorBoundary> },
{ path: '/library/:id', element: <ErrorBoundary><BookDetailPage /></ErrorBoundary> },
{ path: '/viewer/:id',  element: <ErrorBoundary><ViewerPage /></ErrorBoundary> },
```

- [ ] **Step 5: 수동 확인** (사용자 담당)

```bash
pnpm dev
```

- `/library` 여전히 동작
- `/library/test-id` 접속 → "Book Detail (Coming Soon)" 표시
- 다른 라우트 깨짐 없음

- [x] **Step 6: Commit**

```bash
git add packages/client/src/router/index.tsx packages/client/src/pages/BookDetailPage.tsx
git commit -m "feat(client): add /library/:id route + wrap viewer routes with ErrorBoundary"
```

### Task B2: StorybookSummary에 `hasVideo` 필드 추가 (서버)

**배경:** `/library` 목록은 `StorybookSummary[]`를 받음 (빠른 리스트 응답을 위해 축약). 현재 summary엔 `audiobookProjects`/`longformProjects`가 없어 **라이브러리 카드에서 YouTube 배지를 판별할 데이터가 없음**. 서버에서 미리 계산한 `hasVideo?: boolean`을 summary에 담아 전달.

**Files:**
- Modify: `packages/shared/src/types/storybook.ts` (StorybookSummary에 `hasVideo?: boolean` 추가)
- Modify: `packages/server/src/services/storybook.service.ts` (list 엔드포인트에서 계산)

- [ ] **Step 0: 필드명 검증 (grep)**

```bash
grep -n "youtubeUpload\|audiobookProjects\|longformProjects" packages/shared/src/types/storybook.ts
```

Expected:
- `audiobookProjects?: AudiobookProject[]` (line ~672)
- `longformProjects?: LongformProject[]` (line ~681)
- `youtubeUpload?: YouTubeUploadResult` on `AudiobookProject` (line ~729) and `LongformProject` (line ~877)
- `videoId` on `YouTubeUploadResult`

이 필드명들이 다르면 Step 3의 코드 수정 필요.

- [ ] **Step 1: shared 타입에 필드 추가**

`packages/shared/src/types/storybook.ts`의 `StorybookSummary` 타입 확장:

```ts
export type StorybookSummary = Pick<
  Storybook,
  | 'id' | 'title' | 'type' | 'targetAge' | 'artStyle' | 'createdAt'
  | 'coverImage' | 'category' | 'folder' | 'isPublic'
> & {
  pageCount?: number;
  phonicsLanguage?: 'korean' | 'english';
  hasVideo?: boolean;   // 추가
};
```

- [ ] **Step 2: shared 패키지 빌드**

```bash
pnpm --filter @tangobook/shared build
```

- [ ] **Step 3: 서버 storybook.service.ts에서 계산**

list 반환 부분에서 각 storybook을 summary로 변환하는 로직을 찾아 `hasVideo` 추가:

```ts
// 기존 패턴 예:
// const summary: StorybookSummary = { id, title, ...etc, pageCount, phonicsLanguage };
// 여기에 한 줄 추가:
hasVideo:
  (sb.audiobookProjects?.some(p => !!p.youtubeUpload?.videoId)) ||
  (sb.longformProjects?.some(p => !!p.youtubeUpload?.videoId)) ||
  false,
```

- [ ] **Step 4: 서버 빌드 + typecheck**

```bash
pnpm --filter @tangobook/server typecheck
```

- [ ] **Step 5: 수동 API 확인**

dev 환경에서 `/api/storybooks` 응답 확인 (브라우저 devtools 또는 curl):

```bash
curl http://localhost:3500/api/storybooks | head -c 500
```

Expected: 각 아이템에 `hasVideo: true` 또는 `hasVideo: false` 포함.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types/storybook.ts packages/server/src/services/storybook.service.ts
git commit -m "feat(shared,server): add hasVideo flag to StorybookSummary for library badge"
```

### Task B3: library feature — BookCard 추출

**Files:**
- Create: `packages/client/src/features/library/components/BookCard.tsx`
- Create: `packages/client/src/features/library/index.ts`

- [ ] **Step 1: BookCard.tsx 작성 (StorybookSummary 기반)**

```tsx
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { cn } from '@/lib/cn';
import type { StorybookSummary } from '@tangobook/shared';

interface BookCardProps {
  book: StorybookSummary;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  return (
    <Card
      interactive
      padding="sm"
      onClick={() => navigate(`/library/${book.id}`)}
      className="relative"
    >
      {book.hasVideo && (
        <span className="absolute top-3 right-3 bg-coral-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-pop flex items-center gap-1 z-10">
          📺 영상
        </span>
      )}
      <div
        className={cn(
          'aspect-[3/4] rounded-md overflow-hidden mb-3',
          !book.coverImage && 'bg-gradient-to-br from-peach-200 to-peach-300 flex items-center justify-center text-5xl',
        )}
      >
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          '📖'
        )}
      </div>
      <h3 className="font-black text-sm text-ink-900 truncate font-display">{book.title}</h3>
      <p className="text-[11px] text-ink-500 font-bold mt-1">
        만 {book.targetAge}세{book.pageCount ? ` · ${book.pageCount}페이지` : ''}
      </p>
    </Card>
  );
}
```

- [ ] **Step 2: index.ts export**

```ts
// packages/client/src/features/library/index.ts
export { BookCard } from './components/BookCard';
```

- [ ] **Step 3: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/library/
git commit -m "feat(client): extract BookCard with YouTube badge from summary flag"
```

### Task B4: CategorySection 컴포넌트

**Files:**
- Create: `packages/client/src/features/library/components/CategorySection.tsx`
- Modify: `packages/client/src/features/library/index.ts`

- [ ] **Step 1: CategorySection.tsx 작성**

```tsx
import { BookCard } from './BookCard';
import type { StorybookSummary } from '@tangobook/shared';

interface CategorySectionProps {
  icon: string;
  title: string;
  books: StorybookSummary[];
  limit?: number; // 기본 8
  onShowMore?: () => void;
}

export function CategorySection({ icon, title, books, limit = 8, onShowMore }: CategorySectionProps) {
  const visible = books.slice(0, limit);
  const hasMore = books.length > limit;
  return (
    <section className="mb-8">
      <header className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-black text-ink-900 font-display flex items-center gap-2">
          <span>{icon}</span><span>{title}</span>
        </h2>
        <span className="text-xs text-ink-500 font-bold">{books.length}권</span>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {visible.map(b => <BookCard key={b.id} book={b} />)}
      </div>
      {hasMore && onShowMore && (
        <button
          onClick={onShowMore}
          className="mt-4 w-full py-3 bg-white rounded-lg shadow-soft text-ink-700 font-bold hover:bg-peach-100"
        >
          더 보기 ({books.length - limit}권)
        </button>
      )}
    </section>
  );
}
```

- [ ] **Step 2: export + typecheck + Commit**

```ts
// index.ts
export { BookCard } from './components/BookCard';
export { CategorySection } from './components/CategorySection';
```

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/library/
git commit -m "feat(client): add CategorySection for library grouping"
```

### Task B5: WelcomeHeader (마스코트 + 인사)

**Files:**
- Create: `packages/client/src/features/library/components/WelcomeHeader.tsx`

- [ ] **Step 1: 작성**

```tsx
import { useState } from 'react';
import { Mascot } from '@/components/Mascot';

const GREETINGS = [
  '안녕! 오늘은 뭐 할까? 👋',
  '다시 왔네, 반가워!',
  '어떤 책이 기다릴까?',
  '오늘도 즐겁게 읽어보자!',
];

function pickGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

interface WelcomeHeaderProps {
  bookCount: number;
}

export function WelcomeHeader({ bookCount }: WelcomeHeaderProps) {
  const [greeting] = useState(pickGreeting); // 마운트 시 한 번만 선택 (상태 변경해도 고정)
  return (
    <div className="bg-gradient-to-br from-peach-100 to-peach-200 rounded-lg p-6 flex items-center gap-5 mb-6">
      <Mascot state="waving" size="lg" />
      <div>
        <h1 className="text-2xl font-black text-ink-900 font-display">{greeting}</h1>
        <p className="text-ink-700 font-semibold mt-1">{bookCount}권이 너를 기다려</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: index.ts에 추가 export + Commit**

```bash
git add packages/client/src/features/library/
git commit -m "feat(client): add WelcomeHeader with mascot waving"
```

### Task B6: LibraryPage 리뉴얼

**Files:**
- Modify: `packages/client/src/pages/LibraryPage.tsx`

**확정된 사실:**
- `StorybookType = 'storybook' | 'phonics'` 만 존재 (확인: `packages/shared/src/types/storybook.ts:2`)
- `StorybookSummary`에 `phonicsLanguage?: 'korean' | 'english'` 있음 → **한글/영어 파닉스 구분은 type이 아닌 phonicsLanguage로**

- [ ] **Step 1: 기존 LibraryPage 읽기 · 구조 파악**

state·hook·API 파악. 카테고리 이모지 매핑은 기존 코드에 있을 수 있으니 재사용.

- [ ] **Step 2: 카테고리 이모지 맵 + 새 LibraryPage 작성**

```tsx
import { useMemo, useState } from 'react';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { WelcomeHeader, CategorySection, BookCard } from '@/features/library';
import { StateScreen } from '@/components/StateScreen';
import { SkeletonBookCard } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import type { StorybookSummary } from '@tangobook/shared';

type TabId = 'storybook' | 'korean-phonics' | 'english-phonics';

// 전체 Summary를 받아 해당 탭에 속하는지 판별
const TABS: Array<{ id: TabId; icon: string; label: string; match: (b: StorybookSummary) => boolean }> = [
  { id: 'storybook',       icon: '📖', label: '동화책',      match: b => !b.type || b.type === 'storybook' },
  { id: 'korean-phonics',  icon: '🇰🇷', label: '한글 파닉스', match: b => b.type === 'phonics' && b.phonicsLanguage === 'korean' },
  { id: 'english-phonics', icon: '🇺🇸', label: '영어 파닉스', match: b => b.type === 'phonics' && b.phonicsLanguage === 'english' },
];

const CATEGORY_ICON: Record<string, string> = {
  '동물': '🐾', '가족': '👪', '자연': '🌳', '친구': '👫', '음식': '🍎',
  '모험': '🗺️', '직업': '🧑‍⚕️', '감정': '❤️', '일상': '🏠',
};
const getCategoryIcon = (cat: string) => CATEGORY_ICON[cat] ?? '📚';

export default function LibraryPage() {
  const { data: all, isLoading, isError } = useStorybooks();
  const [activeTab, setActiveTab] = useState<TabId>('storybook');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');

  const filtered = useMemo<StorybookSummary[]>(() => {
    if (!all) return [];
    const tab = TABS.find(t => t.id === activeTab)!;
    const result = all.filter(tab.match);
    const q = search.trim().toLowerCase();
    const searched = q ? result.filter(b =>
      b.title.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q)
    ) : result;
    return [...searched].sort((a, b) =>
      sortBy === 'recent'
        ? (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        : a.title.localeCompare(b.title, 'ko'),
    );
  }, [all, activeTab, search, sortBy]);

  const showCategories = activeTab === 'storybook';
  const grouped = useMemo(() => {
    if (!showCategories) return null;
    const map = new Map<string, StorybookSummary[]>();
    filtered.forEach(b => {
      const key = b.category || '기타';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return [...map.entries()];
  }, [filtered, showCategories]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabId, number> = { storybook: 0, 'korean-phonics': 0, 'english-phonics': 0 };
    all?.forEach(b => TABS.forEach(t => { if (t.match(b)) counts[t.id]++; }));
    return counts;
  }, [all]);

  if (isError) {
    return <StateScreen mascotState="sad" title="연결이 안 돼" description="와이파이를 확인해줘" action={{ label: '↻ 다시 시도', onClick: () => location.reload() }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1440px] mx-auto p-5 md:p-7">
        <WelcomeHeader bookCount={all?.length ?? 0} />

        {/* 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-5 py-2.5 rounded-md font-black text-sm whitespace-nowrap flex items-center gap-2 transition-all',
                activeTab === t.id
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'bg-transparent text-ink-500 hover:bg-peach-100',
              )}
            >
              <span>{t.icon}</span><span>{t.label}</span>
              <span className={cn(
                'text-[11px] px-2 py-0.5 rounded-md',
                activeTab === t.id ? 'bg-white/30' : 'bg-ink-100 text-ink-700',
              )}>{tabCounts[t.id]}</span>
            </button>
          ))}
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px] bg-white rounded-md px-5 py-3 shadow-soft flex items-center gap-2">
            <span>🔍</span>
            <input
              type="text"
              placeholder="무슨 책 찾을까?"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'recent' | 'title')}
            className="bg-white rounded-md px-4 py-3 shadow-soft font-bold text-sm text-ink-700"
          >
            <option value="recent">🆕 최신순</option>
            <option value="title">🔤 제목순</option>
          </select>
        </div>

        {/* 콘텐츠 */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonBookCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <StateScreen
            mascotState="thinking"
            title={search ? '찾는 책이 없네' : '책이 아직 없어'}
            description={search ? '다른 말로 찾아볼까?' : '선생님이 곧 준비해 줄 거야!'}
            action={search ? { label: '🔎 다시 검색', onClick: () => setSearch('') } : undefined}
          />
        ) : showCategories && grouped ? (
          grouped.map(([cat, books]) => (
            <CategorySection key={cat} icon={getCategoryIcon(cat)} title={cat} books={books} />
          ))
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {filtered.map(b => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: typecheck + dev 확인**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

수동 확인 (라이브러리에 책이 있는 환경):
- 웰컴 헤더에 마스코트 waving + 인사말
- 탭 3개 각각 카운트 표시
- 검색어 입력 시 즉시 필터
- 동화책 탭에서 카테고리별로 섹션 나뉨
- 파닉스 탭들은 플랫 그리드
- 책 카드 클릭 → `/library/:id` 이동 (현재는 placeholder)
- 스켈레톤 로딩 (네트워크 느리게 시뮬레이션 시)
- 검색 결과 0건 → StateScreen thinking
- YouTube 업로드된 책에만 📺 배지

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/pages/LibraryPage.tsx
git commit -m "refactor(client): redesign LibraryPage with welcome + tabs + categories + YouTube badge"
```

### Task B7: BookDetailPage 본체

**Files:**
- Modify: `packages/client/src/pages/BookDetailPage.tsx` (placeholder → 실제)

- [ ] **Step 1: useStorybook 훅 확인**

`packages/client/src/features/storybook/hooks/useStorybooks.ts`에 `useStorybook(id)`가 이미 export되어 있는지 확인 (대부분의 경우 있음). 없으면 Step 4에서 추가.

- [ ] **Step 2: 언어 라벨 유틸**

```tsx
// packages/client/src/features/library/components/BookDetailPage.tsx 내부 또는 별도
const LANG_LABEL: Record<string, { flag: string; name: string }> = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
  ja: { flag: '🇯🇵', name: '日本語' },
};
```

- [ ] **Step 3: BookDetailPage 작성**

```tsx
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks'; // 경로 확인 필요
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StateScreen } from '@/components/StateScreen';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import {
  hasVideoUrl, hasGames, getAvailableLanguages, type LangCode,
} from '@/lib/storybook-accessors';

const LANG_LABEL: Record<string, { flag: string; name: string }> = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
};

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: storybook, isLoading, isError } = useStorybook(id);
  const [lang, setLang] = useState<LangCode>('ko');

  const videoAvailable = useMemo(() => storybook ? hasVideoUrl(storybook) : false, [storybook]);
  const gameAvailable  = useMemo(() => storybook ? hasGames(storybook) : false, [storybook]);
  const languages      = useMemo(() => storybook ? getAvailableLanguages(storybook) : [], [storybook]);

  if (isLoading) return (
    <div className="min-h-screen bg-cream-50 p-7 max-w-[1200px] mx-auto">
      <Skeleton className="h-12 w-32 mb-5" />
      <div className="grid grid-cols-[300px_1fr] gap-9">
        <Skeleton className="aspect-[3/4] rounded-lg" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full mt-2" />
        </div>
      </div>
    </div>
  );

  if (isError || !storybook) return (
    <StateScreen
      mascotState="sad"
      title="이 책을 찾을 수 없어"
      description="다른 책 볼래?"
      action={{ label: '🏠 라이브러리로', onClick: () => navigate('/library') }}
    />
  );

  const pageCount = storybook.pages?.length ?? 0;
  const summary = storybook.referenceContent?.slice(0, 150) ?? '';

  const enterMode = (mode: 'read' | 'video' | 'game') => {
    const qs = new URLSearchParams({ lang });
    if (mode !== 'read') qs.set('mode', mode === 'game' ? 'games' : 'video');
    navigate(`/viewer/${storybook.id}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1200px] mx-auto p-5 md:p-7">
        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-lg bg-white shadow-soft flex items-center justify-center text-xl hover:bg-peach-100"
            aria-label="뒤로 가기"
          >←</button>
          <button
            disabled
            title="즐겨찾기는 곧 추가돼요"
            className="bg-white rounded-lg px-4 py-3 shadow-soft font-bold text-sm flex items-center gap-1.5 opacity-60 cursor-not-allowed"
          >
            ⭐ <span>즐겨찾기</span>
          </button>
        </div>

        {/* 히어로 */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-9 items-start mb-6">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card">
            {storybook.coverImage
              ? <img src={storybook.coverImage} alt={storybook.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[140px]">📖</div>}
            {videoAvailable && (
              <span className="absolute top-3 right-3 bg-coral-500 text-white px-3 py-1.5 rounded-md text-[11px] font-black shadow-pop">
                📺 영상 있음
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-ink-900 font-display leading-tight">{storybook.title}</h1>
            <div className="flex gap-2 flex-wrap mt-4 mb-4">
              {[`👶 만 ${storybook.targetAge}세`, `📄 ${pageCount}페이지`, storybook.category && `🏷️ ${storybook.category}`]
                .filter(Boolean)
                .map(chip => (
                  <span key={chip as string} className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-ink-700 shadow-soft">
                    {chip}
                  </span>
                ))}
            </div>
            {summary && <p className="bg-white/60 p-4 rounded-md text-sm text-ink-700 leading-relaxed">{summary}{summary.length >= 150 ? '…' : ''}</p>}
          </div>
        </div>

        {/* 언어 선택 */}
        {languages.length > 1 && (
          <div className="mb-6">
            <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-2">🌐 언어</div>
            <div className="flex gap-2">
              {languages.map(code => {
                const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      'px-5 py-3 rounded-md font-bold flex gap-2 items-center transition-all',
                      lang === code ? 'bg-peach-300 text-ink-900 shadow-soft' : 'bg-white text-ink-500',
                    )}
                  >
                    <span className="text-lg">{label.flag}</span>
                    <span>{label.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 모드 선택 */}
        <div>
          <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-3">🎯 어떻게 즐길까?</div>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
            {/* 책으로 읽기 — primary */}
            <Card
              interactive
              onClick={() => enterMode('read')}
              className="!bg-gradient-to-br !from-coral-400 !to-coral-500 !text-white"
            >
              <div className="text-5xl">📖</div>
              <h3 className="font-black text-lg mt-2">책으로 읽기</h3>
              <div className="text-sm opacity-95">그림과 글로 천천히 읽어요</div>
            </Card>
            {/* 영상으로 */}
            {videoAvailable && (
              <Card interactive onClick={() => enterMode('video')}>
                <div className="text-4xl">🎬</div>
                <h3 className="font-black text-base mt-2 text-ink-900">영상으로</h3>
                <div className="text-xs text-ink-500 mt-0.5">움직이는 그림으로</div>
              </Card>
            )}
            {/* 게임 */}
            {gameAvailable && (
              <Card interactive onClick={() => enterMode('game')}>
                <div className="text-4xl">🎮</div>
                <h3 className="font-black text-base mt-2 text-ink-900">게임</h3>
                <div className="text-xs text-ink-500 mt-0.5">퀴즈·연결하기</div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: useStorybook 훅 없으면 추가 (있으면 skip)**

없다면 `useStorybooks.ts` 파일에:

```ts
export function useStorybook(id: string | undefined) {
  return useQuery({
    queryKey: ['storybook', id],
    queryFn: () => storybookApi.getById(id!),
    enabled: !!id,
  });
}
```

- [ ] **Step 5: typecheck + dev 확인**

```bash
pnpm --filter @tangobook/client typecheck
pnpm dev
```

수동 테스트:
- `/library` → 책 카드 클릭 → `/library/:id`
- 로딩 스켈레톤 뜸
- 제목·표지·메타·줄거리 표시
- 영상 있는 책: 📺 배지 + "영상으로" 모드 카드 표시
- 영상 없는 책: 배지·모드 카드 모두 없음
- 언어 1개만 있으면 언어 섹션 숨김
- "📖 책으로 읽기" 클릭 → `/viewer/:id?lang=ko`
- 뒤로가기 → 라이브러리

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/pages/BookDetailPage.tsx packages/client/src/features/storybook/hooks/useStorybooks.ts
git commit -m "feat(client): implement BookDetailPage with lang + mode selection (conditional UI)"
```

> **참고**: Phase B에서 `?lang=ko` 쿼리는 아직 소비되지 않음. 뷰어가 lang을 인식하고 페이지 텍스트를 스위치하는 건 Phase C에서 구현. 지금은 URL에 심어만 둠.

### Task B8: Phase B 마무리 sanity

- [ ] **Step 1: 전체 타입체크 & 테스트**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

- [ ] **Step 2: 5가지 책 케이스 수동 검증**

다양한 storybook 데이터로 테스트 (실 데이터 or 목업):
- [A] 영상 O · 게임 O · 언어 2개 → 배지·모드 3개·언어 탭 2개
- [B] 영상 O · 게임 X · 언어 1개 → 배지·모드 2개·언어 탭 숨김
- [C] 영상 X · 게임 O · 언어 1개 → 배지 없음·모드 2개·언어 탭 숨김
- [D] 영상 X · 게임 X · 언어 1개 → 배지 없음·모드 1개(읽기만)·언어 탭 숨김
- [E] 언어 3개 이상 (ko/en/ja) → 언어 탭 3개 정렬 OK, 가로 넘침 시 스크롤

- [ ] **Step 3: Phase B 완료 커밋은 각 Task에서 됐으므로 추가 커밋 불필요**

---

**🏁 Chunk 2 (Phase B) 완료 기준:**
- [ ] `/library` 리뉴얼 완료 (웰컴·탭·검색·카테고리·스켈레톤·YouTube 배지)
- [ ] `/library/:id` 신설 (언어·모드 선택·조건부 UI)
- [ ] 모드 선택 후 `/viewer/:id?lang=...&mode=...` 진입 (뷰어 자체는 아직 기존 UI)
- [ ] `typecheck` + `test` 통과
- [ ] 5가지 데이터 케이스 수동 검증 완료 (3+ 언어 포함)

---

## Chunk 3: Phase C — 뷰어 내부 (Container + PageView)

**목표:** ViewerContainer·PageView를 새 디자인으로. Pill 툴바, 64px 원형 네비, 책 등뼈 진행률, framer-motion slide-fade 전환, BGM 마스코트 코너, 웜 다크모드, `?lang=` 파라미터 소비.

**기간:** 약 6~7일

### 기존 훅 시그니처 (작업 전 숙지)

구현자는 기존 훅을 **그대로 재사용**하고 플랜 코드는 이 시그니처에 맞게 작성됨:

```ts
// useAudioPlayer.ts — 생성 시 BGM URL + onTtsEnded 콜백 주입
useAudioPlayer({ backgroundMusicUrl, onTtsEnded })
  → { playTts(url), stopTts(), isTtsPlaying, toggleBgm(), isBgmPlaying }

// useViewerSettings.ts — tuple 반환 + localStorage 동기화
useViewerSettings()
  → readonly [ViewerSettings, (patch: Partial<ViewerSettings>) => void]

// ViewerSettings 필드
{ language, textSize, darkMode, autoPlayTts, showText, fullscreenImage }
```

**핵심 가이드:**
- "전체화면" 토글 = `fullscreenImage` 필드 (브라우저 fullscreen API 아님, UI 단순화 모드)
- TTS 끝 감지는 `onTtsEnded` 콜백 주입으로 (state polling X)
- BGM on/off은 `toggleBgm()` 하나. 별도 play/stop 없음.

### Task C1: 언어 파라미터 소비 유틸

**Files:**
- Create: `packages/client/src/features/viewer/lib/page-text.ts`
- Create: `packages/client/src/features/viewer/lib/page-text.test.ts`

- [ ] **Step 1: failing test 작성**

```ts
// page-text.test.ts
import { describe, it, expect } from 'vitest';
import { getPageText, getPageTtsUrl } from './page-text';
import type { Page } from '@tangobook/shared';

const page: Page = {
  pageNumber: 1, text: '안녕', scene_description: '', scene_structure: {} as any, ttsUrl: '/ko.mp3',
  translations: { en: { text: 'Hi', ttsUrl: '/en.mp3' } },
};

describe('getPageText', () => {
  it('returns base text for ko', () => { expect(getPageText(page, 'ko')).toBe('안녕'); });
  it('returns translation for en', () => { expect(getPageText(page, 'en')).toBe('Hi'); });
  it('falls back to base text for missing lang', () => { expect(getPageText(page, 'ja')).toBe('안녕'); });
});

describe('getPageTtsUrl', () => {
  it('returns ttsUrl for ko', () => { expect(getPageTtsUrl(page, 'ko')).toBe('/ko.mp3'); });
  it('returns translation ttsUrl for en', () => { expect(getPageTtsUrl(page, 'en')).toBe('/en.mp3'); });
  it('falls back to base ttsUrl', () => { expect(getPageTtsUrl(page, 'ja')).toBe('/ko.mp3'); });
});
```

- [ ] **Step 2: 구현**

```ts
import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';

export function getPageText(page: Page, lang: LangCode): string {
  if (lang === 'ko') return page.text;
  return page.translations?.[lang]?.text ?? page.text;
}

export function getPageTtsUrl(page: Page, lang: LangCode): string | undefined {
  if (lang === 'ko') return page.ttsUrl;
  return page.translations?.[lang]?.ttsUrl ?? page.ttsUrl;
}
```

- [ ] **Step 3: test + commit**

```bash
pnpm --filter @tangobook/client test src/features/viewer/lib/page-text.test.ts
git add packages/client/src/features/viewer/lib/
git commit -m "feat(viewer): add page-text language helper with fallback"
```

### Task C2: BookSpineProgress (책 등뼈 진행률)

**Files:**
- Create: `packages/client/src/features/viewer/components/BookSpineProgress.tsx`

- [ ] **Step 1: 작성**

```tsx
import { cn } from '@/lib/cn';

interface BookSpineProgressProps {
  current: number;     // 0-based index
  total: number;
  compact?: boolean;   // 페이지 많을 때 축약
}

export function BookSpineProgress({ current, total, compact }: BookSpineProgressProps) {
  if (total <= 0) return null;

  // compact 모드: 11페이지 이상일 때 자동 활성화 또는 prop으로 강제
  const useCompact = compact ?? total > 11;

  if (useCompact) {
    return (
      <div className="flex items-center gap-3 font-bold text-ink-700 text-sm">
        <div className="flex gap-1">
          <span className="w-6 h-2 rounded-md bg-coral-500" />
        </div>
        <span>{current + 1} / {total}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1" aria-label={`진행률 ${current + 1}/${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 rounded-md transition-all',
            i === current ? 'w-6 bg-coral-500' :
            i <  current ? 'w-3 bg-ink-300' :
                           'w-3 bg-ink-100',
          )}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: typecheck + commit**

```bash
git add packages/client/src/features/viewer/components/BookSpineProgress.tsx
git commit -m "feat(viewer): add BookSpineProgress dot-based page indicator"
```

### Task C3: MascotCorner (BGM 재생 중)

**Files:**
- Create: `packages/client/src/features/viewer/components/MascotCorner.tsx`

- [ ] **Step 1: 작성**

```tsx
import { Mascot } from '@/components/Mascot';

interface MascotCornerProps {
  visible: boolean;
}

export function MascotCorner({ visible }: MascotCornerProps) {
  if (!visible) return null;
  return (
    <div
      className="absolute bottom-24 right-6 bg-white/85 backdrop-blur-sm rounded-full p-2 shadow-soft z-5 pointer-events-none"
      aria-hidden="true"
    >
      <Mascot state="dancing" size="sm" />
    </div>
  );
}
```

- [ ] **Step 2: commit**

```bash
git add packages/client/src/features/viewer/components/MascotCorner.tsx
git commit -m "feat(viewer): add MascotCorner dancing overlay (visible during BGM)"
```

### Task C4: ViewerToolbar 리뉴얼 (Pill 스타일)

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerToolbar.tsx`

- [ ] **Step 1: 기존 ViewerToolbar 읽기**

현재 props·state·아이콘 배치 파악.

- [ ] **Step 2: 새 레이아웃으로 재작성**

props 시그니처는 가능한 유지. 내부 구조만 변경:

```tsx
import { cn } from '@/lib/cn';

interface ViewerToolbarProps {
  title: string;
  onHome: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  textSize: 'sm' | 'md' | 'lg';
  onCycleTextSize: () => void;
  language: string;
  onToggleLanguage?: () => void;
  fullscreenImage: boolean;
  onToggleFullscreen: () => void;
}

function PillIconBtn({ children, onClick, active, label }: { children: React.ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-11 h-11 rounded-md flex items-center justify-center text-lg transition-all',
        active ? 'bg-coral-500 text-white shadow-pop' : 'bg-peach-100 hover:bg-peach-200 text-ink-700',
      )}
    >
      {children}
    </button>
  );
}

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
      {/* 좌: 홈 + 제목 */}
      <div className="flex items-center gap-2 bg-white/85 backdrop-blur-sm rounded-md pl-3 pr-4 py-2 shadow-soft pointer-events-auto">
        <button
          onClick={props.onHome}
          aria-label="홈으로"
          className="text-xl hover:scale-110 transition-transform"
        >🏠</button>
        <span className="font-black text-ink-900 text-sm">{props.title}</span>
      </div>

      {/* 우: 설정 */}
      <div className="flex gap-2 bg-white/85 backdrop-blur-sm rounded-md p-2 shadow-soft pointer-events-auto">
        <PillIconBtn onClick={props.onToggleDark} active={props.darkMode} label="다크모드">🌗</PillIconBtn>
        <PillIconBtn onClick={props.onCycleTextSize} label="글자 크기">Aa</PillIconBtn>
        {props.onToggleLanguage && (
          <PillIconBtn onClick={props.onToggleLanguage} label="언어 바꾸기">🌐</PillIconBtn>
        )}
        <PillIconBtn onClick={props.onToggleFullscreen} active={props.fullscreenImage} label="이미지 크게 보기">⛶</PillIconBtn>
      </div>
    </div>
  );
}
```

> **주의**: 기존 ViewerToolbar가 다른 props 형태라면, 기존 props 유지하면서 위 JSX 구조만 따르기. 호출부 변경 최소화.

- [ ] **Step 3: typecheck + commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/viewer/components/ViewerToolbar.tsx
git commit -m "refactor(viewer): redesign toolbar as Pill style (44px icons, blur, shadow)"
```

### Task C5: ViewerControls 리뉴얼

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerControls.tsx`

- [ ] **Step 1: 기존 ViewerControls 구조 확인**

네비게이션(이전/다음)·TTS·BGM·자동재생 버튼 각각 어떻게 연결돼 있는지.

- [ ] **Step 2: 새 디자인으로 재작성**

```tsx
import { cn } from '@/lib/cn';

interface ViewerControlsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isTtsPlaying: boolean;
  onToggleTts: () => void;
  isBgmPlaying: boolean;
  onToggleBgm: () => void;
  autoPlayTts: boolean;
  onToggleAutoPlay: () => void;
  hasBgm: boolean;    // backgroundMusicUrl 없으면 BGM 버튼 비활성화
}

function NavBtn({ onClick, disabled, primary, label, children }: {
  onClick: () => void; disabled: boolean; primary?: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all',
        disabled && 'opacity-40 cursor-not-allowed',
        primary
          ? 'bg-coral-500 text-white shadow-pop hover:scale-105 active:scale-95'
          : 'bg-white/90 backdrop-blur-sm text-ink-900 shadow-soft hover:bg-white',
      )}
    >{children}</button>
  );
}

function PlayBtn({ active, onClick, label, children }: {
  active: boolean; onClick: () => void; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all',
        active ? 'bg-coral-500 text-white shadow-pop' : 'bg-peach-100 text-ink-700 hover:bg-peach-200',
      )}
    >{children}</button>
  );
}

export function ViewerControls(props: ViewerControlsProps) {
  return (
    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
      <div className="pointer-events-auto">
        <NavBtn onClick={props.onPrev} disabled={!props.canPrev} label="이전 페이지">←</NavBtn>
      </div>
      <div className="flex gap-2.5 items-center bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-soft pointer-events-auto">
        <PlayBtn active={props.isTtsPlaying} onClick={props.onToggleTts} label="음성 듣기">🔊</PlayBtn>
        <button
          onClick={props.onToggleBgm}
          disabled={!props.hasBgm}
          aria-label="배경음악"
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all',
            !props.hasBgm && 'opacity-40 cursor-not-allowed',
            props.isBgmPlaying ? 'bg-coral-500 text-white shadow-pop' : 'bg-peach-100 text-ink-700 hover:bg-peach-200',
          )}
        >🎵</button>
        <PlayBtn active={props.autoPlayTts} onClick={props.onToggleAutoPlay} label="자동 넘김">⏯</PlayBtn>
      </div>
      <div className="pointer-events-auto">
        <NavBtn onClick={props.onNext} disabled={!props.canNext} primary label="다음 페이지">→</NavBtn>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: typecheck + commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/viewer/components/ViewerControls.tsx
git commit -m "refactor(viewer): redesign controls (64px nav + 48px play group, coral CTA)"
```

### Task C6: PageView 리뉴얼 + 페이지 전환 애니

**Files:**
- Modify: `packages/client/src/features/viewer/components/PageView.tsx`

- [ ] **Step 1: 기존 PageView 읽기**

현재 props, 텍스트/이미지 배치 파악.

- [ ] **Step 2: framer-motion 전환 추가**

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { getPageText, getPageTtsUrl } from '../lib/page-text';
import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';

interface PageViewProps {
  page: Page;
  pageIndex: number;
  direction: number;       // 1 forward, -1 backward
  lang: LangCode;
  showSubtext?: boolean;   // ko가 아닐 때 원문 병기 옵션
  textSize?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
}

const TEXT_CLASS: Record<NonNullable<PageViewProps['textSize']>, string> = {
  sm: 'text-lg',    // 18px
  md: 'text-xl',    // 20px
  lg: 'text-2xl',   // 24px
};

const variants = {
  enter:  (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

export function PageView({ page, pageIndex, direction, lang, showSubtext, textSize = 'md', isDarkMode }: PageViewProps) {
  const text = useMemo(() => getPageText(page, lang), [page, lang]);
  const subText = useMemo(
    () => (showSubtext && lang !== 'ko' && page.text !== text ? page.text : null),
    [page, text, showSubtext, lang],
  );

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pageIndex}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center p-10 md:p-14"
      >
        {page.illustrationUrl && (
          <img
            src={page.illustrationUrl}
            alt=""
            className="max-w-[60%] max-h-[60vh] object-contain rounded-lg shadow-card"
          />
        )}

        {/* 텍스트 카드 */}
        <div
          className={cn(
            'absolute left-16 right-16 bottom-28 backdrop-blur-sm rounded-lg px-7 py-5 shadow-card text-center font-bold leading-snug',
            isDarkMode ? 'bg-white/10 text-darktext' : 'bg-white/92 text-ink-900',
            TEXT_CLASS[textSize],
          )}
        >
          <div>{text}</div>
          {subText && (
            <div className={cn('mt-1 text-sm font-semibold', isDarkMode ? 'text-ink-300' : 'text-ink-700')}>
              {subText}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: `cn` import 추가 확인**

상단에 `import { cn } from '@/lib/cn';` 있는지 확인.

- [ ] **Step 4: typecheck**

```bash
pnpm --filter @tangobook/client typecheck
```

- [ ] **Step 5: commit**

```bash
git add packages/client/src/features/viewer/components/PageView.tsx
git commit -m "feat(viewer): redesign PageView with framer-motion slide-fade transition"
```

### Task C7: ViewerContainer 통합 리뉴얼

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerContainer.tsx`

> **큰 파일 경고**: 이 컴포넌트는 뷰어의 "진두지휘" 역할. 300줄 넘기지 말고 state·effect를 hook으로 쪼개는 게 좋음.

- [ ] **Step 1: 기존 구조 파악**

- `useSearchParams`로 `mode`, `lang` 추출
- `useStorybook(id)`로 데이터 로드
- 페이지 인덱스 state + direction (prev/next 방향 기록)
- TTS/BGM/autoPlay 상태 (기존 훅 `useAudioPlayer`, `useViewerSettings` 재사용)
- 페이지 전환 시 autoplay TTS → 800ms delay → next

- [ ] **Step 2: 새 ViewerContainer 작성 (실 훅 시그니처 기반)**

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useViewerSettings } from '../hooks/useViewerSettings';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getPageTtsUrl } from '../lib/page-text';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerControls } from './ViewerControls';
import { PageView } from './PageView';
import { BookSpineProgress } from './BookSpineProgress';
import { MascotCorner } from './MascotCorner';
import { StateScreen } from '@/components/StateScreen';
import { Mascot } from '@/components/Mascot';
import { cn } from '@/lib/cn';
import type { LangCode } from '@/lib/storybook-accessors';

const TEXT_SIZE_CYCLE: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
const LANG_CYCLE: LangCode[] = ['ko', 'en'];

export function ViewerContainer() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const { data: storybook, isLoading, isError } = useStorybook(id);
  const [settings, updateSettings] = useViewerSettings();

  const lang = (sp.get('lang') ?? settings.language) as LangCode;

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // state ref로 콜백에서 최신 값 접근 (onTtsEnded가 construction time에 고정되는 이슈 회피)
  const stateRef = useRef({ pageIndex: 0, autoPlayTts: settings.autoPlayTts, rewardOpen: false });
  stateRef.current = { pageIndex, autoPlayTts: settings.autoPlayTts, rewardOpen: false /* Phase D에서 교체 */ };

  const pages = storybook?.pages ?? [];
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pages.length - 1;

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= pages.length) return;
    setDirection(next > pageIndex ? 1 : -1);
    setPageIndex(next);
  }, [pageIndex, pages.length]);

  // TTS 끝났을 때 자동 넘김 (autoPlayTts + reward X + 다음 페이지 있음)
  const handleTtsEnded = useCallback(() => {
    const st = stateRef.current;
    if (!st.autoPlayTts) return;
    if (st.rewardOpen) return;      // Phase D에서 유효해짐
    if (st.pageIndex >= pages.length - 1) return; // 마지막 페이지: Phase D에서 reward open
    setTimeout(() => {
      setDirection(1);
      setPageIndex(idx => idx + 1);
    }, 800);
  }, [pages.length]);

  const audio = useAudioPlayer({
    backgroundMusicUrl: storybook?.backgroundMusicUrl,
    onTtsEnded: handleTtsEnded,
  });

  const currentPage = pages[pageIndex];
  const currentTtsUrl = useMemo(
    () => (currentPage ? getPageTtsUrl(currentPage, lang) : undefined),
    [currentPage, lang],
  );

  // 페이지 이동 시 자동 TTS — 사용자 첫 탭 이후에만 (iOS 정책)
  const previousPageIndex = useRef(pageIndex);
  if (previousPageIndex.current !== pageIndex) {
    previousPageIndex.current = pageIndex;
    if (hasUserInteracted && currentTtsUrl) audio.playTts(currentTtsUrl);
  }

  const markInteracted = () => { if (!hasUserInteracted) setHasUserInteracted(true); };

  const onPrev = () => { markInteracted(); goTo(pageIndex - 1); };
  const onNext = () => {
    markInteracted();
    if (pageIndex >= pages.length - 1) {
      // Phase D에서 RewardScreen open으로 대체. Phase C에선 no-op.
      return;
    }
    goTo(pageIndex + 1);
  };
  const onToggleTts = () => {
    markInteracted();
    if (!currentTtsUrl) return;
    if (audio.isTtsPlaying) audio.stopTts();
    else audio.playTts(currentTtsUrl);
  };

  // 언어 토글 (URL 업데이트 + 설정 반영)
  const onToggleLanguage = () => {
    const next = LANG_CYCLE[(LANG_CYCLE.indexOf(lang as 'ko' | 'en') + 1) % LANG_CYCLE.length];
    setSp(prev => { prev.set('lang', next); return prev; });
    updateSettings({ language: next });
  };

  // 로딩/에러
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Mascot state="reading" size="xl" />
      </div>
    );
  }
  if (isError || !storybook) {
    return <StateScreen mascotState="sad" title="이 책을 찾을 수 없어" action={{ label: '🏠 라이브러리', onClick: () => navigate('/library') }} />;
  }

  return (
    <div className={cn(
      'min-h-screen relative overflow-hidden',
      settings.darkMode
        ? 'bg-darkbg text-darktext'
        : 'bg-gradient-to-b from-cream-50 to-peach-100 text-ink-900',
    )}>
      <ViewerToolbar
        title={storybook.title}
        onHome={() => navigate(`/library/${storybook.id}`)}
        darkMode={settings.darkMode}
        onToggleDark={() => updateSettings({ darkMode: !settings.darkMode })}
        textSize={settings.textSize}
        onCycleTextSize={() => {
          const next = TEXT_SIZE_CYCLE[(TEXT_SIZE_CYCLE.indexOf(settings.textSize) + 1) % TEXT_SIZE_CYCLE.length];
          updateSettings({ textSize: next });
        }}
        language={lang}
        onToggleLanguage={onToggleLanguage}
        fullscreenImage={settings.fullscreenImage}
        onToggleFullscreen={() => updateSettings({ fullscreenImage: !settings.fullscreenImage })}
      />

      {currentPage && (
        <PageView
          page={currentPage}
          pageIndex={pageIndex}
          direction={direction}
          lang={lang}
          showSubtext={settings.showText}
          textSize={settings.textSize}
          isDarkMode={settings.darkMode}
        />
      )}

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
        <BookSpineProgress current={pageIndex} total={pages.length} />
      </div>

      <MascotCorner visible={audio.isBgmPlaying} />

      <ViewerControls
        onPrev={onPrev}
        onNext={onNext}
        canPrev={canPrev}
        canNext={canNext}
        isTtsPlaying={audio.isTtsPlaying}
        onToggleTts={onToggleTts}
        isBgmPlaying={audio.isBgmPlaying}
        onToggleBgm={() => { markInteracted(); audio.toggleBgm(); }}
        hasBgm={!!storybook.backgroundMusicUrl}
        autoPlayTts={settings.autoPlayTts}
        onToggleAutoPlay={() => updateSettings({ autoPlayTts: !settings.autoPlayTts })}
      />
    </div>
  );
}
```

**설계 포인트:**
- `useAudioPlayer({ onTtsEnded })`는 **construction 시점에 콜백이 고정**되므로 `stateRef`로 최신 state 읽어 auto-advance 판단
- 페이지 변화 감지는 render 중 비교(`previousPageIndex.current`). `useEffect`는 StrictMode 이중호출 우려 + 콜백 실행 타이밍 이슈로 피함
- `hasUserInteracted` gate는 navigation/toggle 핸들러에서만 true 세팅 (iOS autoplay policy 준수)
- `fullscreenImage` = 기존 "이미지 크게 보기" 모드 (브라우저 fullscreen API 아님)

- [ ] **Step 3: 기존 훅 시그니처 확인 + 어댑테이션**

```bash
grep -rn "useAudioPlayer\|useViewerSettings" packages/client/src/features/viewer/hooks/
```

훅이 `textSize`, `isFullscreen`, `autoPlay`, `toggleDarkMode` 같은 걸 어떻게 노출하는지 확인하고 위 호출부 수정.

- [ ] **Step 4: dev 서버로 시각 확인**

```bash
pnpm dev
```

체크:
- `/library` → 책 선택 → `/library/:id` → "책으로 읽기" → 뷰어 진입
- Pill 툴바 상/하단 표시
- 책 등뼈 dot 진행률 (현재 dot만 coral 확장)
- 좌/우 화살표 버튼 64px, 다음(→)은 coral
- TTS 버튼 탭 시 재생
- BGM 탭 시 마스코트 코너 dancing 표시
- 페이지 넘김 시 슬라이드-페이드 애니메이션 (350ms spring)
- 다크모드 토글 → 웜 다크 배경 (#1F1611)
- `?lang=ko`/`?lang=en`로 진입 시 텍스트 스위치 (en 번역이 있는 책이면)

- [ ] **Step 5: commit**

```bash
git add packages/client/src/features/viewer/components/ViewerContainer.tsx
git commit -m "refactor(viewer): integrate new toolbar/controls/transitions/mascot + ?lang support"
```

### Task C8: dev 수동 확인 (autoplay + darkmode)

autoplay·darkmode는 C7 ViewerContainer에 이미 구현됨. 이 태스크는 검증만.

- [ ] **Step 1: 첫 진입 시 TTS 자동재생 X**

- `/library` → 책 선택 → "책으로 읽기" 진입
- 새로고침 또는 다른 책 들어간 직후 확인: TTS 재생 안 됨
- 어떤 버튼이든 한 번 탭 → 이후 페이지 변경 시 TTS 자동 재생

- [ ] **Step 2: autoPlayTts ON 상태 → 자동 넘김**

- 설정(Toolbar) 없이 컨트롤 바의 ⏯ 토글 ON
- TTS 끝나고 약 800ms 뒤 다음 페이지로 자동 전환
- 마지막 페이지에서는 멈춤 (Phase D에서 reward 오픈으로 교체)

- [ ] **Step 3: 다크모드 토글**

- 🌗 클릭 → `bg-darkbg` + `text-darktext` 전환
- 텍스트 카드 `bg-white/10` + backdrop-blur
- 책 등뼈 dot는 그대로 (coral-500, 다크 위에서도 잘 보임)
- localStorage에 `darkMode: true` 저장 (뷰어 재진입 시 유지)

- [ ] **Step 4: commit (없으면 skip)**

C7에서 이미 커밋됐으면 추가 커밋 불필요.

### Task C9: Phase C 마무리 sanity

- [ ] **Step 1: typecheck + test 통과 (필수)**

```bash
pnpm --filter @tangobook/client typecheck
pnpm --filter @tangobook/client test
```

- [ ] **Step 2: 수동 QA 시나리오 (태블릿 실기)**

- 라이브러리 → 상세 → 책 읽기 끝까지 → 마지막 페이지에서 멈춤 (RewardScreen은 Phase D)
- TTS 자동재생 X (첫 진입 시)
- 한 탭 후 TTS 재생, 자동 넘김 ON 시 끝까지 진행
- 페이지 전환 애니 매끄러움
- 다크모드 토글 왕복
- 언어 전환 (`?lang=en` 직접 URL 접근 — 아직 BookDetail에 언어 선택 → viewer로 넘기기만 함)
- BGM 재생 중 마스코트 dancing 코너 등장

---

**🏁 Chunk 3 (Phase C) 완료 기준:**
- [ ] 책 1권을 새 UI로 끝까지 읽는 경험 완성
- [ ] 마지막 페이지 다음 호출 시 현재는 멈춤 (Phase D에서 RewardScreen 추가 예정)
- [ ] `?lang=` 쿼리 반영, 번역이 있으면 텍스트 스위치
- [ ] `typecheck` + `test` 통과

---

## Chunk 4: Phase D — 책 끝 보상 + YouTube + 게임 연동

**목표:** 책 마지막 페이지 이후 RewardScreen 오버레이. 영상/게임 유무 4가지 케이스에 따라 Primary CTA 분기. YouTube 모달 (BookDetailPage `?mode=video` 진입도 이 모달 재사용).

**기간:** 약 3일

### Task D1: YouTubeModal 공용 컴포넌트

**Files:**
- Create: `packages/client/src/features/viewer/components/YouTubeModal.tsx`

- [ ] **Step 1: 작성**

```tsx
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface YouTubeModalProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function YouTubeModal({ videoId, open, onClose, title }: YouTubeModalProps) {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // privacy-enhanced mode
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-darkbg rounded-lg overflow-hidden shadow-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3">
          <div className="text-white font-black text-sm flex items-center gap-2">
            <span>🎬</span>
            <span>{title ?? '애니메이션'}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center text-lg hover:bg-white/25"
          >✕</button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={src}
            title={title ?? 'YouTube video'}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: commit**

```bash
git add packages/client/src/features/viewer/components/YouTubeModal.tsx
git commit -m "feat(viewer): add YouTubeModal (privacy-enhanced iframe + ESC close)"
```

### Task D2: RewardScreen (4가지 케이스)

**Files:**
- Create: `packages/client/src/features/viewer/components/RewardScreen.tsx`

- [ ] **Step 1: RewardScreen.tsx 작성 (confetti는 inline effect로)**

```tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/Mascot';
import { YouTubeModal } from './YouTubeModal';
import { cn } from '@/lib/cn';
import {
  hasVideoUrl, hasGames, getPrimaryVideoId,
} from '@/lib/storybook-accessors';
import type { Storybook } from '@tangobook/shared';

interface RewardScreenProps {
  storybook: Storybook;
  open: boolean;
  autoOpenVideo?: boolean;   // `/viewer/:id?mode=video` 진입 시 true 전달 → 마운트 즉시 영상 모달 열기
  onClose: () => void;
  onGoHome: () => void;
  onRereadFromStart: () => void;
  onPlayGame: () => void;
}

export function RewardScreen({ storybook, open, autoOpenVideo, onClose, onGoHome, onRereadFromStart, onPlayGame }: RewardScreenProps) {
  const [videoModal, setVideoModal] = useState(false);

  const videoAvailable = hasVideoUrl(storybook);
  const gameAvailable = hasGames(storybook);
  const videoId = getPrimaryVideoId(storybook);

  // 등장 시 confetti (prefers-reduced-motion 존중)
  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    confetti({
      particleCount: 120, spread: 80, origin: { y: 0.5 },
      colors: ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'],
    });
  }, [open]);

  // autoOpenVideo true + videoId 있으면 모달 자동 오픈 (마운트 시 1회)
  useEffect(() => {
    if (open && autoOpenVideo && videoId) setVideoModal(true);
    // deps 일부러 open/autoOpenVideo/videoId만 — 사용자가 모달 닫은 후 재오픈하지 않음
  }, [open, autoOpenVideo, videoId]);

  if (!open) return null;

  // Case 분기
  // A: 영상 O + 게임 O → 둘 다 Primary
  // B: 영상 O + 게임 X → 영상 Primary 크게
  // C: 영상 X + 게임 O → 게임 Primary 크게
  // D: 영상 X + 게임 X → 홈 Primary 크게
  const caseType = videoAvailable && gameAvailable ? 'A'
                 : videoAvailable ? 'B'
                 : gameAvailable  ? 'C' : 'D';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-cream-50 via-coral-100 to-peach-200"
        >
          <motion.div
            initial={{ scale: 0.5, y: 40 }} animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          >
            <Mascot state="celebrating" size="xl" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="inline-block bg-ink-900 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md mt-4"
          >📖 완독 축하</motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-4xl font-black text-ink-900 mt-3 font-display"
          >
            {caseType === 'D' ? '이야기 끝! 🎉' : '끝까지 다 읽었어! 🎉'}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-ink-700 text-base font-semibold mt-2"
          >
            {caseType === 'A' ? '이제 어떻게 더 놀까?'
              : caseType === 'B' ? '애니메이션으로 한번 더 볼래?'
              : caseType === 'C' ? '이야기로 게임하러 가볼까?'
              : '다음엔 어떤 책 읽을까?'}
          </motion.p>

          {/* Primary (상단, 크게) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
            className="flex gap-4 flex-wrap justify-center mt-7"
          >
            {videoAvailable && videoId && (
              <button
                onClick={() => setVideoModal(true)}
                className={cn(
                  'flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-white shadow-pop',
                  'bg-gradient-to-br from-coral-400 to-coral-500 hover:brightness-105 active:brightness-95',
                  caseType === 'B' && 'text-lg px-10 py-5',
                )}
              >🎬 애니메이션 보기</button>
            )}
            {gameAvailable && (
              <button
                onClick={onPlayGame}
                className={cn(
                  'flex items-center gap-2.5 px-8 py-4 rounded-xl font-black text-white',
                  'bg-gradient-to-br from-fun to-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:brightness-105',
                  caseType === 'C' && 'text-lg px-10 py-5',
                )}
              >🎮 게임 하러 가기</button>
            )}
            {caseType === 'D' && (
              <button
                onClick={onGoHome}
                className="flex items-center gap-2.5 px-10 py-5 rounded-xl font-black text-white shadow-pop bg-gradient-to-br from-coral-400 to-coral-500 hover:brightness-105 text-lg"
              >🏠 다른 책 보러 가기</button>
            )}
          </motion.div>

          {/* Secondary (하단, 작게) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
            className="flex gap-3 mt-5"
          >
            {caseType !== 'D' && (
              <button onClick={onGoHome} className="px-5 py-2.5 bg-white rounded-lg shadow-soft font-bold text-sm text-ink-900 flex items-center gap-1.5">
                🏠 다른 책
              </button>
            )}
            <button onClick={onRereadFromStart} className="px-5 py-2.5 bg-white rounded-lg shadow-soft font-bold text-sm text-ink-900 flex items-center gap-1.5">
              ↻ 다시 읽기
            </button>
          </motion.div>

          {/* 영상 모달 */}
          {videoId && (
            <YouTubeModal
              videoId={videoId}
              open={videoModal}
              onClose={() => setVideoModal(false)}
              title={`${storybook.title} · 애니메이션`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: typecheck + commit**

```bash
pnpm --filter @tangobook/client typecheck
git add packages/client/src/features/viewer/components/RewardScreen.tsx
git commit -m "feat(viewer): add RewardScreen with 4 cases + confetti + YouTube modal + reduced-motion support"
```

### Task D3: ViewerContainer에 RewardScreen 통합

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerContainer.tsx`

- [ ] **Step 1: ViewerContainer에 rewardOpen state + stateRef 갱신 + 가드**

```tsx
// 1) rewardOpen state 추가
const [rewardOpen, setRewardOpen] = useState(false);

// 2) stateRef도 rewardOpen 최신값 반영 (Chunk 3의 stateRef.current 업데이트 라인 교체)
stateRef.current = { pageIndex, autoPlayTts: settings.autoPlayTts, rewardOpen };

// 3) handleTtsEnded는 Chunk 3에서 이미 rewardOpen guard 있음 — 마지막 페이지일 때 reward 오픈하도록 확장
const handleTtsEnded = useCallback(() => {
  const st = stateRef.current;
  if (!st.autoPlayTts) return;
  if (st.rewardOpen) return;
  if (st.pageIndex >= pages.length - 1) {
    // 마지막 페이지 + autoPlayTts ON → TTS 끝나면 reward 자동 오픈
    setTimeout(() => setRewardOpen(true), 800);
    return;
  }
  setTimeout(() => {
    setDirection(1);
    setPageIndex(idx => idx + 1);
  }, 800);
}, [pages.length]);

// 4) onNext 확장: 마지막 페이지에서 reward 오픈
const onNext = () => {
  markInteracted();
  if (pageIndex >= pages.length - 1) {
    setRewardOpen(true);
    return;
  }
  goTo(pageIndex + 1);
};
```

- [ ] **Step 2: `?mode=video` 직접 진입 처리**

> **⚠️ import 추가 필요**: Chunk 3 C7의 React import는 `useCallback, useMemo, useRef, useState`만 있음. `useEffect`를 추가해야 함.

```tsx
// ViewerContainer.tsx 상단
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
```

별도 effect로 `?mode=video` 감지:

```tsx
const isVideoMode = sp.get('mode') === 'video';

useEffect(() => {
  if (isVideoMode && storybook && hasVideoUrl(storybook)) {
    setRewardOpen(true);
  }
}, [isVideoMode, storybook]);
```

RewardScreen의 `autoOpenVideo` prop이 마운트 시 모달 자동 오픈 책임을 짐 — effect는 reward만 오픈, 모달은 자동.

> **옵션**: `?mode=video` 시 reward의 축하 문구/마스코트를 건너뛰고 바로 모달만 오픈하고 싶으면 RewardScreen에 `skipCelebration?: boolean` prop 추가. MVP는 그대로 둠 (잠깐 축하 씬이 보였다가 영상 모달 오픈 — 자연스러움).

- [ ] **Step 3: RewardScreen 렌더 연결**

```tsx
{storybook && (
  <RewardScreen
    storybook={storybook}
    open={rewardOpen}
    autoOpenVideo={sp.get('mode') === 'video'}
    onClose={() => setRewardOpen(false)}
    onGoHome={() => navigate(`/library/${storybook.id}`)}
    onRereadFromStart={() => {
      setRewardOpen(false);
      goTo(0);
    }}
    onPlayGame={() => navigate(`/viewer/${storybook.id}?mode=games&lang=${lang}`)}
  />
)}
```

> **참고**: `mode=games`는 기존 게임 진입 경로. ViewerContainer가 `mode=games`면 게임 UI로 전환하는 기존 로직 유지.

- [ ] **Step 4: typecheck + dev 수동 확인**

- 책 끝까지 읽기 → RewardScreen 등장, confetti 폭발
- 영상 O · 게임 O 책: 두 Primary 버튼 나란히
- 영상 O · 게임 X: 영상 버튼 크게
- 영상 X · 게임 O: 게임 버튼 크게
- 영상 X · 게임 X: "다른 책 보러 가기" 크게
- 🎬 영상 → YouTube 모달 재생
- ✕ → 모달 닫기 (RewardScreen 유지)
- ↻ 다시 읽기 → 페이지 0 + RewardScreen 닫힘
- 🏠 → 라이브러리로
- 🎮 게임 → 게임 뷰어로 이동
- `/viewer/:id?mode=video`로 직접 진입 시 → RewardScreen 오픈 + YouTube 모달 자동 오픈

- [ ] **Step 5: commit**

```bash
git add packages/client/src/features/viewer/components/ViewerContainer.tsx packages/client/src/features/viewer/components/RewardScreen.tsx
git commit -m "feat(viewer): wire RewardScreen overlay on book end + ?mode=video support"
```

---

**🏁 Chunk 4 (Phase D) 완료 기준:**
- [ ] 4가지 케이스 RewardScreen 수동 검증
- [ ] YouTube 모달 정상 재생 (privacy-enhanced URL)
- [ ] `?mode=video`로 영상 바로 보기 동작
- [ ] 게임 버튼 → 기존 게임 플로우 정상 연결
- [ ] `typecheck` 통과

---

## Chunk 5: Phase E — 상태 화면 + 반응형 + 접근성 + QA

**목표:** 남은 빈/에러 화면 정리, 반응형 브레이크포인트 대응, 접근성 감사, 실 마스코트 에셋 통합 준비, 시나리오 QA.

**기간:** 약 4일

### Task E1: 남은 상태 화면 교체

**Files:** 뷰어·라이브러리 내부에 남아있는 하드코딩된 로딩/에러 UI 찾아 교체

- [ ] **Step 1: grep으로 기존 스피너·에러 텍스트 찾기**

```bash
grep -rn "animate-spin\|네트워크 오류\|Loading" packages/client/src/features/ packages/client/src/pages/
```

- [ ] **Step 2: 모두 StateScreen 또는 Skeleton으로 교체**

- 뷰어 로딩 → `<Mascot state="reading" />` (Chunk 3에서 이미 적용)
- 어떤 리스트 로딩 → `<SkeletonBookCard />` 여러 개
- 에러 → `<StateScreen mascotState="sad" title="..." />`

- [ ] **Step 3: commit**

```bash
git add packages/client/src/
git commit -m "refactor(client): replace legacy spinners with Mascot/Skeleton across viewer+library"
```

### Task E2: 반응형 — 폰(sm) 대응

**Files:**
- Modify: `LibraryPage.tsx`, `BookDetailPage.tsx`, `ViewerContainer.tsx`, `PageView.tsx`

- [ ] **Step 1: 폰 사이즈(sm) 시각 검사**

브라우저 responsive에서 375px (iPhone SE급)로 확인:
- LibraryPage 2-col 카드, 웰컴 영역 세로 배치
- BookDetailPage 히어로 세로 스택 (표지 위 → 메타 아래)
- 뷰어 툴바 제목 pill 폭 축소, 아이콘만 표시 가능
- 페이지뷰 이미지 85% + 텍스트 카드 하단

- [ ] **Step 2: 문제점 별 개별 수정**

주로 Tailwind `sm:`/`md:`/`lg:` prefix로 조정. 예:
- BookDetailPage 히어로: `grid-cols-1 md:grid-cols-[300px_1fr]` (이미 Chunk 2에 있음)
- 뷰어 툴바 제목 pill: `<span className="hidden sm:inline">{title}</span>`

- [ ] **Step 3: commit**

```bash
git add packages/client/src/
git commit -m "refactor(client): responsive polish for sm breakpoint (phone portrait)"
```

### Task E3: 반응형 — PC(lg) 대응

- [ ] **Step 1: PC 사이즈(1440px+) 검사**

- 라이브러리: 5-col 카드
- 컨테이너 max-width 1440px (모든 페이지) — 이미 Chunk 2에서 `max-w-[1440px] mx-auto` 적용
- 뷰어: 가로 여백 키우기 (이미지 절대 위치라 영향 적음)

- [ ] **Step 2: commit if changes**

### Task E4: 접근성 감사

- [ ] **Step 1: 터치 타겟 48px 검증**

모든 버튼 `min-h-[48px]` 또는 `w-12 h-12` 이상인지 확인. 특히 툴바 아이콘(44px)은 **허용 (pill 컨테이너 대비 시각적으로 48+ 느낌)**.

- [ ] **Step 2: focus ring 검증**

키보드 Tab 네비 동작 확인. 기본 browser focus-visible이 뜨는지. 안 뜨면 Tailwind에 `focus:ring-2 focus:ring-coral-400` 추가.

- [ ] **Step 3: prefers-reduced-motion 확인**

OS 설정에서 모션 감소 ON 후 뷰어 방문. 페이지 전환·confetti·마스코트 bounce가 멈추거나 단순화.

체크리스트:
- `index.css` global rule (Chunk 1에서 이미 추가됨) — 일반 CSS transition 감소 ✓
- `RewardScreen`의 confetti — 이미 `matchMedia('(prefers-reduced-motion: reduce)')` 체크 포함 ✓ (Task D2에서 추가됨)
- `PageView`의 framer-motion slide transition — 확인 필요

PageView에 `useReducedMotion` 훅 추가:

```tsx
import { useReducedMotion } from 'framer-motion';
// ...
const reduce = useReducedMotion();
// ...
transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 20 }}
// variants도 reduce일 땐 x 이동 없이 fade만
```

RewardScreen의 framer-motion stagger도 동일하게 `reduce` 분기.

- [ ] **Step 4: 에러 문구 한글 검수**

"네트워크 오류" / "404" / "Error" 같은 문구가 남아있지 않은지 grep.

- [ ] **Step 5: commit**

```bash
git add packages/client/src/
git commit -m "a11y: focus ring + prefers-reduced-motion hook in motion components"
```

### Task E5: 마스코트 실 에셋 통합 (사용자 제공 AI 생성 PNG)

**Files:**
- 사용자가 제공: `packages/client/public/mascot/tiger/*.webp` (7개)
- (선택) MCP 재생성: `*.json` (5개) — 호랑이 PNG를 참조 프레임으로

- [ ] **Step 1: 사용자 PNG 7개 수동 업로드**

사용자가 Appendix A의 프롬프트 가이드로 생성한 PNG들을 `packages/client/public/mascot/tiger/` 폴더에 저장.

파일명 정확히:
- `idle.webp`, `waving.webp`, `thinking.webp`, `reading.webp`, `pointing.webp`, `sleeping.webp`, `sad.webp`

각 1024×1024, 투명 배경, WebP 변환.

- [ ] **Step 2: (선택) Lottie 재생성**

호랑이 PNG를 참조로 MCP 재실행하여 idle/waving/cheering/celebrating/dancing 재생성. 일관성 ↑.

- [ ] **Step 3: 수동 검증**

모든 상태에서 Lottie → PNG → 이모지 순서로 fallback하지 않고 **실제 에셋**이 표시됨.

- [ ] **Step 4: commit**

```bash
git add packages/client/public/mascot/tiger/
git commit -m "feat(client): integrate final tiger mascot assets (PNG + Lottie)"
```

### Task E6: 한글 폰트 최종 결정

- [ ] **Step 1: 두 폰트 실기 비교**

학교안심둥근체 공식 CDN이 있는지 확인 (교육부 보급). 없으면 `@font-face`로 로컬 static 파일로 로드 가능성 체크. IBM Plex Sans KR 유지도 OK.

- [ ] **Step 2: index.css 업데이트 (필요시)**

선택한 폰트로 `@import` 교체.

- [ ] **Step 3: commit**

### Task E7: 최종 시나리오 QA (태블릿 실기)

- [ ] **시나리오 1: 아이가 처음 앱 진입**

- 라이브러리 → 마스코트 인사
- 영상 배지 있는 책 카드 확인
- 책 탭 → 상세 페이지 → "책으로 읽기"
- 뷰어 첫 진입 (TTS 자동재생 X)
- 탭 1회 후 TTS 시작
- 끝까지 읽기 → RewardScreen
- 🎬 영상 → 모달 재생 → 닫기
- 🏠 → 라이브러리

- [ ] **시나리오 2: 영상 없는 책**

- 영상 없는 책 카드 → 배지 없음 확인
- 상세 → 모드 카드 2개만
- 책 끝 → Case D 화면

- [ ] **시나리오 3: 다크모드 + BGM**

- 다크모드 토글 → 웜 다크
- BGM 재생 → 우하단 마스코트 dancing
- 페이지 전환 애니 매끄러움

- [ ] **시나리오 4: 언어 전환**

- 영어 번역 있는 책 → 상세에서 English 탭
- 뷰어에서 영어 텍스트 표시
- ko로 전환 왕복

- [ ] **시나리오 5: 에러 복구**

- 네트워크 차단 → sad 마스코트 화면
- 다시 연결 → 정상 복귀
- 존재하지 않는 책 URL → 에러 화면 → 라이브러리 복귀

- [ ] **시나리오 6: 반응형 전환**

- 태블릿 landscape ↔ 폰 portrait ↔ PC 큰 창 전환하며 깨짐 없음 확인

### Task E8: README 업데이트 (선택)

- [ ] 프로젝트 CLAUDE.md 또는 관련 문서에 새 디자인 시스템 사용법 한 줄 추가

```markdown
## 디자인 시스템 (2026-04-22~)
- 토큰: `tailwind.config.js`의 cream/peach/coral/ink/darkbg + CSS vars
- 마스코트: `<Mascot state="..." size="..." />` (tiger 기본)
- 공용 컴포넌트: Button, Card, Skeleton, StateScreen, ErrorBoundary
- 접근성: prefers-reduced-motion 준수, 터치 48+, 에러 문구 아이 친화
```

---

**🏁 Chunk 5 (Phase E) 완료 기준:**
- [ ] 6가지 QA 시나리오 전 태블릿 실기 통과
- [ ] 모든 에러/빈 화면 새 StateScreen으로 통일
- [ ] 마스코트 실 에셋 통합 (최소 PNG 7개, 선택적으로 Lottie 재생성)
- [ ] 반응형 sm/md/lg 깨짐 없음
- [ ] 접근성 체크리스트 통과

---

## 🎉 플랜 종료

모든 Phase를 완료하면:
- 아이 전용 뷰어가 완전히 새 디자인으로 리빌드됨
- YouTube 애니메이션이 라이브러리 배지 + 책 끝 보상에서 동작
- 호랑이 마스코트가 전 여정에 등장
- 게임 내부는 아직 기존 UI (별도 후속 스펙에서 동일한 디자인 시스템 적용)

**다음 단계 (후속 스펙):**
- 게임 15종 UI 리뉴얼 (같은 토큰·Button·Mascot·FeedbackOverlay·Skeleton 재사용)
- 즐겨찾기 기능
- 완독 진도·뱃지
- 다크모드 자동 전환

