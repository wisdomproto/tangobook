# 게임 15종 UI/UX 리디자인 (유아 친화 · 뷰어 디자인 시스템 상속)

## 개요

탱고북의 **게임 15종** (플레이어 13개 + 공통 컴포넌트)을 2026-04-22에 확정된 뷰어 디자인 시스템으로 전면 리뉴얼한다. 공용 컴포넌트 재정비 + TOP 5 게임 레이아웃 재설계 + 나머지 8개 게임 토큰 치환 3단계로 진행. 뷰어 스펙(`2026-04-22-viewer-ux-redesign-design.md`)에서 정립된 토큰·Button·Card·Mascot·StateScreen·framer-motion·lottie-react·canvas-confetti를 그대로 상속해 사용.

## 맥락 · 문제

### 현재 문제 (2026-02 분석)
- **게임 13종이 톤 제각각**: `violet` / `sky` / `emerald` accent 임의 사용. "한 제품"이 아니라 "15종 제각각 게임 컬렉션" 인상
- **피드백 빈약**: 정답·오답 시 색 변화만 있고 호리 마스코트·사운드·confetti 모두 없음. `PraiseOverlay` 컴포넌트는 있지만 10개 게임만 사용 + 정답 전용(오답 없음)
- **결과 화면 초라**: `GameResultScreen`은 이모지 1개 + 점수 + 버튼 2개. 뷰어 `RewardScreen`과 대비 크게 밀림
- **공통 컴포넌트 분산**: 2개 게임은 직접 인라인 스타일. `accentColor` prop으로 violet/sky/emerald 3택
- **뷰어 리디자인이 게임에 안 미침**: 뷰어는 coral·호리·Nunito·커스텀 토큰 썼지만 게임은 3월 초 상태 유지

### 목표
1. **단일 디자인 시스템 통합** — 뷰어와 같은 coral·ink·peach 토큰, 같은 Mascot 호리, 같은 Button/Card
2. **강력한 피드백 루프** — 정답·오답·클리어 모두 유아 친화 시각·사운드 피드백. Duolingo Kids 수준
3. **빅뱅 전면 리뉴얼** — 25개 파일 한 번에 일관된 톤으로 전환 (Phase 3단계)
4. **TOP 5 게임 레이아웃 개선** — 시각 외 실제 플레이 경험 향상 (플립·pop·shake·drag 연출)
5. **사운드 기본값 제공** — 모든 게임이 기본 correct/incorrect/clear 효과음 제공 (책별 오버라이드 가능)

### Non-goals
- 게임 로직·정답 판정 로직 변경 (시각만 새 디자인)
- 게임 신규 추가 / 제거 (기존 13종 유지)
- 게임 생성 로직 (서버 쪽) 변경
- 시간 제한·리더보드 같은 신규 게임 메커닉

## 결정 사항

| 항목 | 결정 |
|------|------|
| 스코프 | **완전 빅뱅** (13게임 + 4 공용 + 9 config = 25+ 파일) |
| 피드백 수준 | **풀 업그레이드** — 호리 · confetti · 사운드 + FeedbackOverlay 신규 |
| 레이아웃 재설계 | **TOP 5 게임만** 개별 레이아웃 재설계, 나머지 8개는 토큰/컴포넌트 치환 |
| 색 전략 | **완전 통일** — coral primary + semantic(success/error/warn/fun). 게임별 accent 색 구분 폐지 |
| 사운드 | **글로벌 기본 + 책별 오버라이드** — `public/sounds/game/*.mp3` 기본 3종, `storybook.systemSounds.*Url`로 덮어쓰기 |
| 접근법 | **🅰 Phased 3 단계** (A 공용 → B TOP 5 → C 나머지 8) |
| 디자인 시스템 | **뷰어 스펙에서 확정된 토큰·컴포넌트 완전 상속** (별도 신규 토큰 X) |

## 섹션 1 — 공용 컴포넌트

### 1.1 FeedbackOverlay (신규)

정답·오답 순간 오버레이로 띄우는 공용 피드백. 기존 PraiseOverlay 대체.

```tsx
interface FeedbackOverlayProps {
  kind: 'correct' | 'incorrect';
  visible: boolean;
  onDismiss?: () => void;  // optional. durationMs 후 호출 (제공 시). hook-owned 패턴은 §1.6 참조
  durationMs?: number;     // default: correct 1200, incorrect 800
  positionHint?: 'center' | 'top';  // 선택. 기본 center
}
```

| kind | 호리 상태 | 비주얼 | 문구 (랜덤) | 배경 tint | 사운드 |
|---|---|---|---|---|---|
| `correct` | `cheering` (Lottie) | 소형 confetti (40 particles, spread 60) | "잘했어!" · "정답!" · "최고야!" · "멋져!" | `success-100` soft tint | `playCorrect()` |
| `incorrect` | `sad` (PNG) | 전체 shake 400ms · 흔들림 | "다시 해볼까?" · "괜찮아" · "한 번 더!" | `coral-100` soft tint | `playIncorrect()` |

동작:
1. `visible` true 되면 등장 (fade + scale-in)
2. `durationMs` 후 자동 페이드아웃 + `onDismiss` 호출
3. `prefers-reduced-motion` 시 confetti · shake 비활성화, opacity만
4. 동시 2회 호출 시 첫 번째만 유지, 두 번째는 무시 (race 방지)

파일: `packages/client/src/features/games/components/FeedbackOverlay.tsx`

### 1.2 GameResultScreen (대폭 업그레이드)

기존 이모지 1개 → 뷰어 RewardScreen급 축하 화면.

```tsx
interface GameResultScreenProps {
  correctCount: number;
  totalCount: number;
  onRestart: () => void;
  onBack: () => void;    // 일반적으로 `/library/:id` (BookDetailPage) 복귀
  // accentColor prop 제거 — coral 고정
}
```

구성:
- 상단: `celebrating` 호리 XL (Lottie, 1회 bounce-in)
- **canvas-confetti 대형 폭발** (120 particles, spread 80, y 0.5). `prefers-reduced-motion` 존중
- 별점 `⭐` 1~3개:
  - `<60%` → 1개, `60-89%` → 2개, `≥90%` → 3개
  - 별은 하나씩 0.2초 간격 scale pop-in
- **점수 카운트업 애니** — `0 → correctCount / totalCount` over 800ms (framer-motion)
- Primary Button `🔄 다시 하기` (coral)
- Secondary Button `🏠 홈으로` (white + peach border)
- 배경: `from-cream-50 via-coral-100 to-peach-200` 그라데이션

동작:
1. mount 시: confetti + 호리 bounce + 별 pop + 카운트업 모두 stagger
2. `playClear()` 사운드 마운트 800ms 뒤 1회 (confetti 피크에서)

파일: `packages/client/src/features/games/components/GameResultScreen.tsx` (기존 파일 대폭 수정)

### 1.3 GameProgressBar (업그레이드)

기존 바 → 뷰어 `BookSpineProgress`와 일관된 dot 방식.

```tsx
interface GameProgressBarProps {
  current: number;   // 0-based index
  total: number;
  score: number;     // 현재까지 맞힌 개수
  // accentColor prop 제거
}
```

구성:
- 가운데: N개 dot. 현재 dot만 `w-6 h-1.5 bg-coral-500`, 이전 dot `bg-ink-300 w-3`, 미래 dot `bg-ink-100 w-3`
- 문항 ≥11개면 컴팩트 모드: `${current+1} / ${total}` 텍스트
- 오른쪽: `⭐ {score}` (이모지 별 + 숫자)
- 좌/우 그룹 간격 16px
- 컨테이너: `bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft`

파일: `packages/client/src/features/games/components/GameProgressBar.tsx` (기존 수정)

### 1.4 ConfigControls (코스메틱 교체)

`NumberSelector` · `ConfigCheckbox` 색만 새 토큰으로.

- `- / +` 버튼: `bg-peach-100 text-ink-900 hover:bg-peach-200` · 활성 클릭 시 `bg-coral-500 text-white`
- 토글: checked `bg-coral-500`, unchecked `bg-ink-300`
- 라벨: `text-ink-900 font-bold text-sm`

파일: `packages/client/src/features/games/components/config/ConfigControls.tsx` (기존 수정)

### 1.5 PraiseOverlay Deprecate

기존 `PraiseOverlay`는 Phase A 완료 시 **deprecate 주석만**, Phase C에서 전 호출부 `FeedbackOverlay`로 교체 후 삭제.

### 1.6 FeedbackOverlay의 `onDismiss` — optional

기존 `useGameAudio.praiseVisible` state는 hook 내부에서 setTimeout으로 자동 false 처리. FeedbackOverlay에 `onDismiss`가 required이면 기존 패턴과 충돌.

해결: **`onDismiss`를 optional로** 정의. 호출자가 visible state를 외부에서 제어할 때는 no-op처럼 넘겨도 OK.

```tsx
interface FeedbackOverlayProps {
  kind: 'correct' | 'incorrect';
  visible: boolean;
  onDismiss?: () => void;   // optional. durationMs 후 호출 (제공 시만)
  durationMs?: number;
  positionHint?: 'center' | 'top';
}
```

게임 플레이어에서 사용:
```tsx
// useGameAudio의 praiseVisible이 hook 내부에서 자동 false 되는 경우
<FeedbackOverlay kind="correct" visible={praiseVisible} />
// onDismiss 제공하지 않음 — hook이 소유권
```

## 섹션 2 — 사운드 시스템

### 2.1 기본 효과음 파일

```
packages/client/public/sounds/game/
  ├── correct.mp3     # 정답 — 밝은 ding / chime 느낌
  ├── incorrect.mp3   # 오답 — 부드러운 "음?" (짜증 X)
  └── clear.mp3       # 게임 클리어 — 짧은 fanfare (0.6s 이내)
```

제약:
- 각 파일 **<50KB, <800ms**
- CC0 라이선스 (freesound.org · OpenGameArt)
- 96~128kbps mono mp3
- 피치·volume 정규화 (-14 LUFS 근처)

구현 단계에서 선별 후 커밋.

### 2.2 Storybook별 오버라이드 (기존 타입 활용)

```ts
// shared/types/storybook.ts — 이미 존재
systemSounds?: {
  correctUrl?: string;
  incorrectUrl?: string;
  clearUrl?: string;   // 신규 추가 필요 (현재 없으면)
};
```

해당 필드 있으면 기본값 대신 책의 URL 사용. 책 저작 시 업로드하면 R2 URL 참조.

> **Note**: `clearUrl`은 기존 타입에 있으면 그대로, 없으면 이 스펙에서 추가. 구현 시 확인.

### 2.3 useGameSound 훅 (신규) — 단순 재생만 담당

```ts
function useGameSound(opts?: { systemSounds?: SystemSounds }) {
  const playCorrect: () => void;
  const playIncorrect: () => void;
  const playClear: () => void;
  const isMuted: boolean;
  const toggleMuted: () => void;
}
```

내부 동작:
- Mount 시 3개 `<Audio>` 객체 프리로드 (preload='auto')
- 사용자가 `systemSounds.*Url` 제공 시 그 URL로, 아니면 `/sounds/game/*.mp3` 기본값
- 호출마다 `audio.currentTime = 0; audio.play()` (overlap 재생)
- **음소거** 상태 `localStorage['tangobook-game-muted']` 저장 (기본 false). 전 게임 공통
- `isMuted=true`일 땐 play 호출 건너뜀

파일: `packages/client/src/features/games/hooks/useGameSound.ts`

### 2.4 useGameAudio 훅 — 유지 + 내부 rewire (기존 오케스트레이터 보호 · 기존 §2.4)

**`useGameAudio`는 삭제하지 않는다**. 현재 13 플레이어가 전부 사용 중이라 삭제 시 게임 전면 break.

기존 반환 시그니처는 그대로 유지:
```ts
function useGameAudio(): {
  playAudio(url?: string): void;
  playFeedbackSound(correct: boolean): void;         // WebAudio 톤 합성 (OR: useGameSound로 위임)
  playCorrectSequence(opts?: CorrectSequenceOpts): void;
  praiseVisible: boolean;
}
```

Phase A에서 **내부만 리와이어**:
- `playFeedbackSound(correct)` 구현을 **WebAudio 톤 합성 제거** → 내부에서 `useGameSound`의 `playCorrect/playIncorrect` 사용. 외부 시그니처 변경 없음.
- `playCorrectSequence` 오케스트레이션 유지. 내부 칭찬 음원 라이브러리 호출(`settingsApi.getSystemSounds()`)도 그대로 유지. 단, **최초 효과음만** `useGameSound.playCorrect()` 경유.
- `praiseVisible` state 계속 제공 → PraiseOverlay/FeedbackOverlay가 외부에서 `visible={praiseVisible}` 받아 렌더. 내부 setTimeout으로 자동 false 되는 동작 유지.

**결과**: 13개 플레이어 호출부 변경 없이 사운드만 파일 기반으로 이전. 안전한 migration.

### 2.5 시스템 칭찬 음원 라이브러리 — 유지 (기존 §2.5)

기존 `settingsApi.getSystemSounds()` 호출로 한국어/영어 칭찬 음원 랜덤 재생 로직 계속 작동. `clearUrl`과 별개로 공존 (clearUrl = 게임 클리어 1회 fanfare, library = 문제당 칭찬 랜덤).

### 2.6 게임별 호출 패턴

| 순간 | 호출 | FeedbackOverlay 같이? |
|---|---|:---:|
| 정답 탭 | `playCorrect()` | ✅ `correct` |
| 오답 탭 | `playIncorrect()` | ✅ `incorrect` |
| 마지막 문제 정답 → 결과 전환 | `playClear()` (GameResultScreen 마운트 후 800ms) | ❌ (GameResultScreen confetti가 대체) |

### 2.7 설정 UI — 음소거 토글

게임 실행 중 **좌상단 Pill 아이콘** (🔊/🔇). 게임 플레이어 공통 레이아웃에 추가.

```tsx
// 게임 탭·플레이어에서
<button onClick={toggleMuted} className="w-10 h-10 rounded-md bg-white/90 ...">
  {isMuted ? '🔇' : '🔊'}
</button>
```

위치: top-3 left-3 absolute. `z-20`. 대부분 게임이 상단 진행바 있으니 충돌 없는 지점으로 배치.

## 섹션 3 — TOP 5 게임 레이아웃 재설계

### 3.1 VocabularyMatching (메모리 매칭)

파일: `packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx`

변경:
- **3D 카드 플립 애니메이션**:
  - `perspective: 1000px` 컨테이너
  - 카드 `transform-style: preserve-3d` · `rotateY` 0↔180
  - 앞뒤 face `backface-visibility: hidden`
  - 애니 400ms `spring` (stiffness 260)
- **카드 뒷면**: `bg-gradient-to-br from-coral-400 to-coral-500` + 중앙에 작은 🐯 워터마크 `opacity-20`
- **카드 앞면**: `bg-white shadow-card` + 단어 or 이미지
- 매칭 성공: 두 카드 동시 `scale 1.1 + shadow-pop` 0.6초 → fade out 사라짐
- 실패: 두 카드 `shake 400ms` → 다시 뒷면으로 플립
- **정답 수 증가할 때마다 FeedbackOverlay correct 띄움**
- 그리드: `grid-cols-4` (2×4 or 3×4 문제 수 따라), `gap-4`, `p-6`

### 3.2 WordQuiz (단어 퀴즈)

파일: `packages/client/src/features/games/components/players/WordQuizPlayer.tsx`

변경:
- 선택지 **큰 이미지 카드**: 2×2 grid, 카드 `aspect-square`, 이미지 `object-contain p-2` 80%+ 차지
- 카드 컨테이너: `<Card interactive>` (공용 컴포넌트)
- 정답 확정: 선택 카드 `bg-success tint + ✓ 배지 + scale-105` + FeedbackOverlay correct
- 오답: 선택 카드 `shake + coral tint 200ms` → 정답 카드 자동 하이라이트 (`ring-2 ring-success`)
- 질문 영역: 상단 카드 `bg-white/90 shadow-soft`, 큰 텍스트 + `🔊` 아이콘 (TTS 재생 버튼)
- 문제 전환: slide-in from right `x: 50 → 0, opacity 0 → 1` 250ms

### 3.3 EnglishBlock (영어 블록 맞추기)

파일: `packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx`

변경:
- 배경: `bg-gradient-to-br from-cream-50 to-peach-100` (단색 제거)
- 블록 디자인:
  - `Card padding=sm shadow-soft rounded-md` 기반
  - hover 시 `scale-105 shadow-pop`
  - 드래그 중: `scale-108 shadow-pop rotate-3` (들어올린 느낌)
- Drop zone: `border-2 border-dashed border-coral-400 rounded-lg bg-coral-100/30`, 드래그 중 `animate-pulse`
- 정답 배치: 블록 `scale 1.1 + glow` + 주변 작은 confetti spark (15 particles)
- 완성된 문장: 상단 패널에 **타이핑 효과** (글자 단위 progressive, 60ms/char)
- 이 게임은 `useBlockDrag` 훅 기반 — 훅은 그대로 유지

### 3.4 KoreanBlock (한글 블록 맞추기)

파일: `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`

EnglishBlock과 동일한 패턴 적용. 한글 음절 특수 로직은 유지. 스타일만 동기화.

### 3.5 WordListening (듣고 단어 맞추기)

파일: `packages/client/src/features/games/components/players/WordListeningPlayer.tsx`

변경:
- 그림 카드 탭 피드백:
  - hover/focus 시 `lift + border-coral-300`
  - 탭: `lift 2 + border-coral-500 200ms`
- 정답 확정: **pulse glow + ✓ 배지 등장** + `scale 1.05`
- 오답: `shake + coral tint 200ms` + 상단에 "🔊 다시 들어볼까?" 재생 버튼 자동 노출 (3초 유지 후 사라짐)
- 현재 하드코딩 `sky` 계열 색 전부 제거 → coral·ink

## 섹션 4 — 남은 8게임 플레이어: 토큰·컴포넌트 치환 패턴

대상 플레이어 파일 **8개** (TOP 5 제외):
- `BlendingListeningPlayer.tsx`
- `ConnectTheDotsPlayer.tsx`
- `LetterSoundPlayer.tsx`
- `OddOneOutPlayer.tsx`
- `PictureSequencePlayer.tsx`
- `StorybookQuizPlayer.tsx`
- `WordImageMatchingPlayer.tsx`
- `WordWritingPlayer.tsx`

> **참고**: 게임 ID는 15종(`korean-word-writing`·`english-word-writing`·`korean-block`·`english-block` 포함)이나 플레이어 파일은 13개. word-writing은 한/영 공용 `WordWritingPlayer.tsx` 1개, block도 Korean/EnglishBlockPlayer 각 1개씩.

**Config 파일은 별도로 13개** (`ConfigControls.tsx` 제외). 모두 Phase C에서 함께 치환.

### 4.1 기계적 치환 규칙

| Before | After | 비고 |
|---|---|---|
| `bg-violet-{50-700}` | `bg-coral-{...}` or `bg-peach-{...}` | 밝기 매칭해서 교체 |
| `bg-sky-{50-700}` | `bg-coral-{...}` | 통일 전략 (a) |
| `bg-emerald-{50-700}` | `bg-coral-{...}` | 통일. 정답 피드백 tint만 `bg-success` 유지 |
| `text-violet-*` · `text-sky-*` · `text-emerald-*` | `text-ink-900` (본문) · `text-coral-500` (강조) | |
| `border-violet-*` · `border-sky-*` · `border-emerald-*` | `border-coral-*` or `border-ink-100` | |
| `bg-red-{400-600}` (오답) | `bg-danger` (Tailwind 토큰) | |
| `ring-violet-*` | `ring-coral-400` | |

### 4.2 공용 컴포넌트 강제

- 인라인 `<button className="...">` → **`<Button variant="primary|secondary">`** (공용 컴포넌트)
- 인라인 카드 `<div className="bg-white rounded-lg shadow...">` → **`<Card>`**
- `animate-shake` 커스텀 클래스는 CSS 그대로 유지 (토큰 아님, shake 애니 자체는 유지)

### 4.3 GameResultScreen / GameProgressBar 호출 변경

- 기존: `<GameResultScreen accentColor="violet" ... />`
- 변경: `<GameResultScreen ... />` (accentColor prop 제거됨)
- 동일하게 `<GameProgressBar score={...} />` 추가 (이전엔 score prop 없었으면)

### 4.4 PraiseOverlay → FeedbackOverlay 마이그레이션

```tsx
// Before
<PraiseOverlay show={showPraise} onDismiss={...} />

// After
<FeedbackOverlay kind="correct" visible={showPraise} onDismiss={...} />
// 오답도 처리하려면
<FeedbackOverlay kind="incorrect" visible={showWrong} onDismiss={...} />
```

### 4.5 자동화 접근

- 에이전트가 파일별로 순회
- grep·sed 변환 후 수동 검토
- 각 파일 `typecheck` 통과 확인 후 커밋

### 4.6 검증 기준

Phase C 완료 기준:
```bash
# 게임 feature 내에서 예전 색 class 제거 확인
grep -rn "bg-violet\|bg-sky\|bg-emerald\|text-violet\|text-sky\|text-emerald" \
  packages/client/src/features/games/
# 결과가 0 또는 의미색(success/warn/fun/danger)만 나와야
```

## 섹션 5 — Phase 실행 계획

### Phase A — Foundation (3~4일)

**Day 1 — 자산 준비 + 훅**
- freesound.org / OpenGameArt에서 **CC0 효과음 3종 선별·다운로드·정규화** (`correct.mp3`, `incorrect.mp3`, `clear.mp3`)
- `public/sounds/game/` 에 저장
- `useGameSound` 훅 신규 작성
- **`useGameAudio.playFeedbackSound` 내부 rewire** — WebAudio 톤 합성 제거하고 useGameSound 위임 (시그니처 변경 없음)
- `shared/types/storybook.ts`: `systemSounds.clearUrl?: string` 필드 추가

**Day 2 — 공용 컴포넌트**
- `FeedbackOverlay` 컴포넌트 신규 (cheering/sad hori + confetti + shake, onDismiss optional)
- `GameResultScreen` 대폭 업그레이드 (celebrating + confetti + 별점 + 카운트업). `accentColor` prop 제거.
- `GameProgressBar` dot 방식 + score. `accentColor` prop 제거.

**Day 3 — 13 플레이어 callsite 일괄 업데이트 (accentColor 제거)**
- 13개 플레이어에서 `<GameResultScreen accentColor="..." ... />` → `<GameResultScreen ... />` 치환
- 13개 플레이어에서 `<GameProgressBar accentColor="..." ... />` → `<GameProgressBar ... />` 치환 (score prop 추가 필요하면 함께)
- `ConfigControls` 토큰 교체
- `PraiseOverlay`에 `@deprecated` JSDoc 마크 (아직 삭제 X)

**완료 기준**: `typecheck` + `test` 전부 통과. 기존 13개 게임 여전히 플레이 가능. 시각은 공용 컴포넌트 변경만 반영된 상태 (게임 내부 색은 아직 구식).

### Phase B — TOP 5 게임 레이아웃 (3~4일)
결과물:
- VocabularyMatching: 3D 플립 애니 (perspective + rotateY)
- WordQuiz: 2x2 큰 이미지 카드
- EnglishBlock / KoreanBlock: 그라데이션 배경 + drag-lift + drop-zone pulse
- WordListening: glow·pulse 피드백

**완료 기준**: 각 게임 태블릿 실기 플레이 → 기존 대비 플레이 만족도 상승 체감. typecheck + test 통과.

### Phase C — 남은 8게임 + 13 config 토큰 치환 (2~3일)

대상:
- 플레이어 8개 (위 §4 목록)
- 13 config 패널 (TOP 5용 5 + 나머지 8) — 토큰·색 전부
- TOP 5 플레이어도 색 잔존물(violet/sky/emerald) 최종 grep 체크

결과물:
- violet/sky/emerald → coral·ink·semantic 치환
- **PraiseOverlay import → FeedbackOverlay 교체** (13 플레이어 모두)
  - 시그니처 매핑: `<PraiseOverlay visible={praiseVisible} />` → `<FeedbackOverlay kind="correct" visible={praiseVisible} />` (onDismiss 생략)
  - 오답 경우 처리 필요한 게임은 별도 `<FeedbackOverlay kind="incorrect" ... />` 추가
- 인라인 button/card → 공용 `<Button>` · `<Card>`
- `PraiseOverlay` 컴포넌트 **파일 삭제** (모든 호출부 이관 완료 확인 후)

**완료 기준**: 
```bash
grep -rn "bg-violet\|bg-sky\|bg-emerald\|text-violet\|text-sky\|text-emerald\|border-violet\|border-sky\|border-emerald" \
  packages/client/src/features/games/
# → 0 hits (semantic success/error는 의미색으로 유지)
grep -rn "import.*PraiseOverlay" packages/client/src/features/games/
# → 0 hits
```
typecheck + test 통과.

### Phase 간 의존성

- A 없이는 B·C 불가 (공용 컴포넌트가 Foundation)
- B와 C는 논리적으로 독립이나 순차 진행 권장 (충돌 방지, 의미색 일관성)
- 각 Phase 끝은 배포 가능한 단위

### 합계
**8~11일** (Phase A 3~4d + B 3~4d + C 2~3d). 이전 추정(5~9일)은 훅 마이그레이션·accentColor 일괄 수정·config 13개를 과소평가한 수치라 상향 조정.

## 섹션 6 — 데이터·타입 변경

### 6.1 신규 필드

`shared/types/storybook.ts`의 `systemSounds`에 `clearUrl?: string` 추가:
```ts
systemSounds?: {
  correctUrl?: string;
  incorrectUrl?: string;
  clearUrl?: string;   // 신규
};
```

### 6.2 제거 필드

- `GameResultScreen` · `GameProgressBar`의 `accentColor` prop 제거
- 게임 플레이어에서 호출부 수정 필요 (13~15개 파일)

### 6.3 서버 영향

없음. 게임 생성 로직은 서버, 시각은 클라이언트.

## 섹션 7 — 테스트 전략

### 7.1 단위 테스트
- `useGameSound` — 음소거 토글 · localStorage 저장 · systemSounds 오버라이드 (vitest)
- `FeedbackOverlay` — visible true/false · durationMs 후 onDismiss 호출 · prefers-reduced-motion 분기

### 7.2 시각 회귀
- 주요 게임 5개(TOP 5) 실기 플레이 체크리스트
- 남은 8개: 공용 컴포넌트 정상 렌더링 + 색 검증 (grep)

### 7.3 접근성
- 모든 클릭 영역 48×48+ 유지
- `prefers-reduced-motion` 분기 (confetti·shake·bounce 비활성화)
- 사운드 음소거 작동
- focus-visible ring 유지

## 섹션 8 — 패키지 의존성

신규 추가: **없음**

뷰어 스펙에서 이미 설치된 것들 모두 활용:
- framer-motion (카드 플립·shake·slide)
- lottie-react (호리 Lottie)
- canvas-confetti (정답·클리어)
- clsx + tailwind-merge (cn)

## 섹션 9 — 남은 질문 · 후속 과제

### 후속 과제 (범위 밖)
- 게임 신규 추가 · 제거
- 시간 제한 · 리더보드 · 복수 플레이어
- 게임 메커닉 변경 (선택지 수 · 문제 생성 로직)
- 파닉스 데이터 구조 개선 (R2 레거시 그대로)

### 현 시점 남은 결정
1. **효과음 라이브러리 최종 선택**: 구현 시 freesound.org 또는 OpenGameArt에서 CC0 선별. 지금은 미정.
2. **`systemSounds.clearUrl` 필드**: 현재 타입에 없으면 추가. 있으면 그대로. Phase A 초에 확인.
3. **PraiseOverlay 완전 삭제 시점**: Phase C 끝에 모든 호출 이관 확인 후 삭제.

---

## Appendix A — 참고 파일

### 수정 대상 파일 목록

**공용 (Phase A)**:
- `packages/client/src/features/games/components/FeedbackOverlay.tsx` (신규)
- `packages/client/src/features/games/components/GameResultScreen.tsx` (대폭 수정)
- `packages/client/src/features/games/components/GameProgressBar.tsx` (수정)
- `packages/client/src/features/games/components/config/ConfigControls.tsx` (수정)
- `packages/client/src/features/games/components/PraiseOverlay.tsx` (deprecate → 삭제)
- `packages/client/src/features/games/hooks/useGameSound.ts` (신규)
- `packages/client/src/features/games/hooks/useGameAudio.ts` (playFeedbackSound 이전)
- `packages/client/public/sounds/game/{correct,incorrect,clear}.mp3` (신규 asset)
- `packages/shared/src/types/storybook.ts` (systemSounds.clearUrl 필드 추가)

**TOP 5 (Phase B)**:
- `packages/client/src/features/games/components/players/VocabularyMatchingPlayer.tsx`
- `packages/client/src/features/games/components/players/WordQuizPlayer.tsx`
- `packages/client/src/features/games/components/players/EnglishBlockPlayer.tsx`
- `packages/client/src/features/games/components/players/KoreanBlockPlayer.tsx`
- `packages/client/src/features/games/components/players/WordListeningPlayer.tsx`

**나머지 (Phase C)**:

플레이어 8개:
- `packages/client/src/features/games/components/players/BlendingListeningPlayer.tsx`
- `packages/client/src/features/games/components/players/ConnectTheDotsPlayer.tsx`
- `packages/client/src/features/games/components/players/LetterSoundPlayer.tsx`
- `packages/client/src/features/games/components/players/OddOneOutPlayer.tsx`
- `packages/client/src/features/games/components/players/PictureSequencePlayer.tsx`
- `packages/client/src/features/games/components/players/StorybookQuizPlayer.tsx`
- `packages/client/src/features/games/components/players/WordImageMatchingPlayer.tsx`
- `packages/client/src/features/games/components/players/WordWritingPlayer.tsx`

Config 13개 (ConfigControls 제외, Phase A에서 처리됨):
- `packages/client/src/features/games/components/config/BlendingListeningConfigPanel.tsx`
- `packages/client/src/features/games/components/config/ConnectTheDotsConfigPanel.tsx`
- `packages/client/src/features/games/components/config/EnglishBlockConfigPanel.tsx`
- `packages/client/src/features/games/components/config/KoreanBlockConfigPanel.tsx`
- `packages/client/src/features/games/components/config/LetterSoundConfigPanel.tsx`
- `packages/client/src/features/games/components/config/OddOneOutConfigPanel.tsx`
- `packages/client/src/features/games/components/config/PictureSequenceConfigPanel.tsx`
- `packages/client/src/features/games/components/config/StorybookQuizConfigPanel.tsx`
- `packages/client/src/features/games/components/config/VocabularyMatchingConfigPanel.tsx`
- `packages/client/src/features/games/components/config/WordImageMatchingConfigPanel.tsx`
- `packages/client/src/features/games/components/config/WordListeningConfigPanel.tsx`
- `packages/client/src/features/games/components/config/WordQuizConfigPanel.tsx`
- `packages/client/src/features/games/components/config/WordWritingConfigPanel.tsx`

### 관련 문서
- **뷰어 스펙**: `docs/superpowers/specs/2026-04-22-viewer-ux-redesign-design.md` (디자인 시스템 · 호리 마스코트 · 토큰 원천)
- **뷰어 플랜**: `docs/superpowers/plans/2026-04-22-viewer-ux-redesign-plan.md`
- **뷰어 완료 메모**: `memory/viewer-redesign-complete.md`
