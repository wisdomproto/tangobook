# 탱고북 디자인시스템

`packages/client/src/design-system/` — 디자인 토큰 + 공용 UI 프리미티브의 single source of truth.

## 폴더 구조

```
design-system/
  tokens/          # 디자인 토큰 (TS, as const)
    colors.ts      # cream / peach / coral / ink / semantic / dark
    radius.ts      # borderRadius (xs / md / lg / xl)
    shadows.ts     # boxShadow (soft / card / pop)
    typography.ts  # fontFamily (sans / display)
    motion.ts      # keyframes + animation
    index.ts       # 토큰 barrel
  primitives/      # 재사용 UI 빌딩블록
    Button.tsx
    Card.tsx
    Skeleton.tsx
    StateScreen.tsx
    ErrorBoundary.tsx
    Mascot.tsx
    index.ts       # 프리미티브 barrel
  index.ts         # 디자인시스템 public API
  README.md        # 이 문서
```

## 사용법

### 프리미티브 (컴포넌트)

```tsx
import { Button, Card, Skeleton, StateScreen, ErrorBoundary, Mascot } from '@/design-system';
```

### 토큰 (런타임 색상이 필요한 경우 — 거의 없음)

```ts
import { tokens } from '@/design-system';
// tokens.colors.coral[500]  → '#FF5E3A'
// tokens.borderRadius.lg    → '24px'
```

> 일반적인 스타일은 **Tailwind 클래스** (`bg-coral-500`, `rounded-lg`) 로 작성. 런타임 토큰은 Canvas/SVG 등 Tailwind를 못 쓰는 곳에서만 사용.

## Tailwind 연동

`tailwind.config.ts` 가 `tokens/` 의 값을 직접 import 하므로 **토큰 파일이 SoT**. 색이나 shadow를 추가/변경하려면 토큰 파일만 수정하면 Tailwind 클래스도 자동 반영.

CSS 변수(`src/index.css`의 `:root --color-*`)는 별도 정의 — 토큰 파일과 값을 동기 유지할 것.

## 색 팔레트

- **Warm base**: `cream-50`, `peach-100/200/300/500`
- **Accent CTA**: `coral-100/200/400/500/600`
- **Semantic**: `success` (#5CC99F), `info` (#6BAEE8), `warn` (#FFC857), `danger` (#E75757), `fun` (#A78BFA)
- **Ink (텍스트)**: `ink-100/300/500/700/900` (900은 실질 검정 — 유아 가독성)
- **Dark mode**: `darkbg`, `darktext`

## 게임 디자인 토큰 규칙

학습/아케이드 게임 컴포넌트 작성 시:
- 색은 `coral`, `peach`, `ink` + semantic (`success`, `danger`, `warn`, `fun`) 만 사용
- **금지**: `violet`, `sky`, `emerald`, 기타 Tailwind 기본 색
- shade 없는 `coral-50`, `coral-900` 등 정의되지 않은 shade 사용 금지
- 다크 모드 텍스트: `dark:text-peach-200` 패턴
- 오답: `border-danger` / `animate-shake` / `bg-danger/10`
- 정답: `ring-success` / `bg-success/10` + `<FeedbackOverlay kind="correct" />`

## 프리미티브 추가 기준

다음을 만족할 때만 `primitives/` 에 추가:
1. 재사용 가능 (3+ 곳에서 쓰임 또는 쓰일 예정)
2. 비즈니스 로직 없음 (도메인 타입 의존 X)
3. 외부 API 호출 없음

→ `RichTextEditor`, `AssetLoadingOverlay`, `DotEditorCanvas` 같은 비즈니스 의존 컴포넌트는 `components/` 또는 feature 폴더에 잔류.
