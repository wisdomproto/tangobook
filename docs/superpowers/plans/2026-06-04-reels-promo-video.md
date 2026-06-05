# 탱고북 릴스 홍보 영상 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9:16 세로 ~22초 릴스 홍보 영상(`reels-promo.mp4`)을 Remotion으로 제작 — 명작동화·다양한 그림체·한/영·파닉스·자연관찰·오픈베타 무료 메시지.

**Architecture:** 기존 `packages/remotion` 에 신규 `ReelsPromo` composition 추가. 6개 씬을 `<Series>` 로 이어붙이고, repo 내장 `strategy-samples` 표지/그림체 자산 + 호리 마스코트 + 앱 화면 캡처를 `staticFile()` 로 로드. 기존 재사용 컴포넌트(`KenBurnsSlide`, `TypewriterSubtitle`, `SparkleParticles`)를 최대한 활용.

**Tech Stack:** Remotion v4, React 18, TypeScript, `@remotion/google-fonts` (NotoSansKR), `@remotion/transitions`.

**검증 방식:** 영상은 단위테스트가 무의미 → 각 씬은 (a) `npx remotion studio` preview 또는 (b) `npx remotion render ReelsPromo out/scene.png --frame=N` 단일 프레임 렌더로 시각 확인. 최종은 full mp4 렌더.

**스펙 참조:** `docs/superpowers/specs/2026-06-04-reels-promo-video-design.md`

---

### Task 1: 자산 수집 — repo 내장 표지/그림체/마스코트를 remotion/public 으로 복사

**Files:**
- Create dir: `packages/remotion/public/reels/`
- Copy into it from `packages/client/public/`

- [ ] **Step 1: public/reels 디렉토리 생성 + 그림체 10종 복사 (씬1 모핑용)**

```bash
mkdir -p packages/remotion/public/reels/styles
cp packages/client/public/strategy-samples/style-01-watercolor.webp packages/remotion/public/reels/styles/
cp packages/client/public/strategy-samples/style-08-pastel.webp packages/remotion/public/reels/styles/
cp packages/client/public/strategy-samples/style-05-3d-toy.webp packages/remotion/public/reels/styles/
cp packages/client/public/strategy-samples/style-03-classic.webp packages/remotion/public/reels/styles/
```

- [ ] **Step 2: 명작 표지 복사 (씬2 콜라주용)**

```bash
mkdir -p packages/remotion/public/reels/covers
cp packages/client/public/strategy-samples/cover-cinderella.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-snow-white.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-red-riding-hood.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-ugly-duckling.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-nutcracker.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-jack-beanstalk.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-hare-tortoise.webp packages/remotion/public/reels/covers/
cp packages/client/public/strategy-samples/cover-ant-grasshopper.webp packages/remotion/public/reels/covers/
```

- [ ] **Step 3: 호리 마스코트 복사 (씬6 클로징용)**

```bash
mkdir -p packages/remotion/public/reels/mascot
cp packages/client/public/mascot/hori/celebrating.json packages/remotion/public/reels/mascot/
cp packages/client/public/mascot/hori/waving.webp packages/remotion/public/reels/mascot/
```

- [ ] **Step 4: 복사 확인**

Run: `ls packages/remotion/public/reels/styles packages/remotion/public/reels/covers packages/remotion/public/reels/mascot`
Expected: 그림체 4개, 표지 8개, 마스코트 2개 파일 존재.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/public/reels
git commit -m "chore(remotion): 릴스 영상용 표지·그림체·마스코트 자산 수집"
```

---

### Task 2: 앱 화면 캡처 — 한/영 토글 + 파닉스 LetterFill (씬3·4용)

**Files:**
- Create: `packages/remotion/public/reels/screens/phonics-letterfill.png`
- Create: `packages/remotion/public/reels/screens/book-ko.png`, `book-en.png`

- [ ] **Step 1: dev 서버 기동**

Run: `pnpm dev` (백그라운드). client 가 보통 `http://localhost:5173` 에 뜬다.

- [ ] **Step 2: 파닉스 채점 화면 캡처**

preview 도구(`preview_start` → `http://localhost:5173/letter-fill-demo`)로 이동 후 `preview_screenshot`.
저장: `packages/remotion/public/reels/screens/phonics-letterfill.png`
9:16 영상에 들어가므로 모바일 뷰포트(`preview_resize` 390×844)로 캡처 권장.

- [ ] **Step 3: 한/영 동화책 페이지 캡처 (각 1장)**

라이브러리에서 책 하나 열어 뷰어 진입 → 언어 한글 상태 `preview_screenshot` → `book-ko.png`. 같은 페이지 영어 토글 후 `preview_screenshot` → `book-en.png`.
(R2_PUBLIC_URL 미설정 등으로 실 책이 안 뜨면 `strategy-samples` 표지 2장으로 한/영 라벨만 오버레이하는 폴백 — Task 5 에서 처리.)

- [ ] **Step 4: 캡처 확인**

Run: `ls packages/remotion/public/reels/screens`
Expected: `phonics-letterfill.png` 존재 (book-ko/en 은 가능 시).

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/public/reels/screens
git commit -m "chore(remotion): 릴스 씬3·4용 앱 화면 캡처(파닉스·한영)"
```

---

### Task 3: ReelsPromo composition 스캐폴드 + Root 등록

**Files:**
- Create: `packages/remotion/src/compositions/ReelsPromo.tsx`
- Modify: `packages/remotion/src/Root.tsx`

- [ ] **Step 1: 빈 ReelsPromo 컴포넌트 작성 (배경만)**

```tsx
// packages/remotion/src/compositions/ReelsPromo.tsx
import React from 'react';
import { AbsoluteFill } from 'remotion';

export const REELS_FPS = 30;
export const REELS_WIDTH = 1080;
export const REELS_HEIGHT = 1920;
export const REELS_DURATION = 22 * REELS_FPS; // 660 frames

export const ReelsPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      {/* 씬은 Task 4~9 에서 추가 */}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Root.tsx 에 Composition 등록**

`Root.tsx` import 블록에 추가:

```tsx
import { ReelsPromo, REELS_FPS, REELS_WIDTH, REELS_HEIGHT, REELS_DURATION } from './compositions/ReelsPromo';
```

`</>` 닫기 전 `<Composition>` 추가:

```tsx
      <Composition
        id="ReelsPromo"
        component={ReelsPromo}
        durationInFrames={REELS_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
      />
```

- [ ] **Step 3: typecheck**

Run: `pnpm --filter @tangobook/remotion typecheck`
Expected: 에러 없음.

- [ ] **Step 4: Studio 에서 컴포지션 노출 확인**

Run: `cd packages/remotion && npx remotion studio` (수동 확인) 또는 단일 프레임 렌더:
`cd packages/remotion && npx remotion render ReelsPromo out/t3.png --frame=0`
Expected: peach 배경 1080×1920 PNG 생성.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/src/compositions/ReelsPromo.tsx packages/remotion/src/Root.tsx
git commit -m "feat(remotion): ReelsPromo 컴포지션 스캐폴드 + Root 등록(1080x1920/22s)"
```

---

### Task 4: 씬1 훅 — "한 권, 여러 얼굴" 그림체 모핑 (0~3s)

**Files:**
- Create: `packages/remotion/src/components/reels/StyleMorphHook.tsx`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: StyleMorphHook 컴포넌트 작성 — 4 그림체 크로스페이드 + 자막**

```tsx
// packages/remotion/src/components/reels/StyleMorphHook.tsx
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const STYLES = [
  'reels/styles/style-01-watercolor.webp',
  'reels/styles/style-08-pastel.webp',
  'reels/styles/style-05-3d-toy.webp',
  'reels/styles/style-03-classic.webp',
];

export const StyleMorphHook: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const per = durationInFrames / STYLES.length;
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE' }}>
      {STYLES.map((src, i) => {
        const start = i * per;
        const opacity = interpolate(
          frame,
          [start - per * 0.4, start, start + per * 0.6, start + per],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        );
        return (
          <AbsoluteFill key={src} style={{ opacity, justifyContent: 'center', alignItems: 'center' }}>
            <Img src={staticFile(src)} style={{ width: '78%', borderRadius: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 180 }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 72, color: '#2B2B2B', textAlign: 'center', lineHeight: 1.3, textShadow: '0 2px 12px rgba(255,255,255,0.8)' }}>
          동화책 그림체가{'\n'}하나일 필요 있어요?
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```
(주의: `\n` 줄바꿈은 `white-space: 'pre-line'` 필요 → div style 에 `whiteSpace: 'pre-line'` 추가.)

- [ ] **Step 2: div style 에 `whiteSpace: 'pre-line'` 추가**

위 자막 div style 객체에 `whiteSpace: 'pre-line'` 키 추가.

- [ ] **Step 3: ReelsPromo 에 Series 로 씬1 삽입**

```tsx
import { Series } from 'remotion';
import { StyleMorphHook } from '../components/reels/StyleMorphHook';
// ...
<Series>
  <Series.Sequence durationInFrames={3 * REELS_FPS}>
    <StyleMorphHook durationInFrames={3 * REELS_FPS} />
  </Series.Sequence>
</Series>
```

- [ ] **Step 4: typecheck + 프레임 렌더 검증**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t4.png --frame=15`
Expected: 그림체 표지 + 자막 보이는 PNG.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/src/components/reels/StyleMorphHook.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬1 그림체 모핑 훅"
```

---

### Task 5: 씬2 명작 콜라주 (3~7s)

**Files:**
- Create: `packages/remotion/src/components/reels/ClassicCollage.tsx`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: ClassicCollage 작성 — 표지 빠른 컷(0.4s) + Ken Burns 줌 + 자막**

```tsx
// packages/remotion/src/components/reels/ClassicCollage.tsx
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['800'] });

const COVERS = [
  'reels/covers/cover-cinderella.webp',
  'reels/covers/cover-snow-white.webp',
  'reels/covers/cover-red-riding-hood.webp',
  'reels/covers/cover-ugly-duckling.webp',
  'reels/covers/cover-nutcracker.webp',
  'reels/covers/cover-jack-beanstalk.webp',
  'reels/covers/cover-hare-tortoise.webp',
  'reels/covers/cover-ant-grasshopper.webp',
];

export const ClassicCollage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = Math.floor(frame / (0.4 * fps)) % COVERS.length;
  const local = frame % (0.4 * fps);
  const scale = interpolate(local, [0, 0.4 * fps], [1.0, 1.08]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#1A1A2E' }}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Img src={staticFile(COVERS[cut])} style={{ width: '88%', borderRadius: 24, transform: `scale(${scale})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 140 }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 76, color: '#fff', textAlign: 'center', whiteSpace: 'pre-line', textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}>
          세계 명작동화,{'\n'}탱고북에서
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: ReelsPromo Series 에 씬2 추가**

```tsx
import { ClassicCollage } from '../components/reels/ClassicCollage';
// Series 안, 씬1 다음:
<Series.Sequence durationInFrames={4 * REELS_FPS}>
  <ClassicCollage />
</Series.Sequence>
```

- [ ] **Step 3: typecheck + 프레임 렌더**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t5.png --frame=120`
Expected: 명작 표지 + 자막 PNG.

- [ ] **Step 4: Commit**

```bash
git add packages/remotion/src/components/reels/ClassicCollage.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬2 명작 표지 콜라주"
```

---

### Task 6: 씬3 한/영 토글 (7~10s)

> ⚠️ 라이브 화면 캡처 폐기(preview 스크린샷 타임아웃). **순수 Remotion 으로 "동화책 페이지 카드" 재현** — 표지 일러스트 + 캡션이 한글↔영어로 토글.

**Files:**
- Create: `packages/remotion/src/components/reels/BilingualToggle.tsx`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: BilingualToggle 작성 — 동화책 페이지 카드 + 한/영 캡션 스왑 + 언어칩**

```tsx
// packages/remotion/src/components/reels/BilingualToggle.tsx
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['700', '800'] });

const COVER = 'reels/covers/cover-snow-white.webp';
const KO_CAPTION = '백설공주는 빨간 사과를\n한 입 베어 물었어요.';
const EN_CAPTION = 'Snow White took a bite\nof the red apple.';

export const BilingualToggle: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const half = durationInFrames / 2;
  const showEn = frame >= half;
  const caption = showEn ? EN_CAPTION : KO_CAPTION;
  const label = showEn ? 'English' : '한글';
  // 토글 순간 캡션 카드가 살짝 튕기는 느낌
  const pop = interpolate(frame % half, [0, 8], [0.94, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#FFF6EE', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 130, fontFamily, fontWeight: 800, fontSize: 72, color: '#2B2B2B', textAlign: 'center', whiteSpace: 'pre-line' }}>
        한 권으로{'\n'}한글 + 영어
      </div>
      {/* 동화책 페이지 카드: 표지 일러스트 + 캡션 */}
      <div style={{ width: '78%', background: '#fff', borderRadius: 36, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.18)', transform: `scale(${pop})` }}>
        <Img src={staticFile(COVER)} style={{ width: '100%', display: 'block' }} />
        <div style={{ padding: '36px 40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ fontFamily, fontWeight: 800, fontSize: 44, color: '#fff', background: '#FF6B5E', padding: '12px 40px', borderRadius: 999 }}>{label}</div>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 46, color: '#2B2B2B', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.45 }}>{caption}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: ReelsPromo Series 에 씬3 추가**

```tsx
import { BilingualToggle } from '../components/reels/BilingualToggle';
<Series.Sequence durationInFrames={3 * REELS_FPS}>
  <BilingualToggle />
</Series.Sequence>
```

- [ ] **Step 3: typecheck + 프레임 렌더 (한글/영어 각 1)**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t6a.png --frame=225`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t6b.png --frame=270`
Expected: 한글 라벨 / English 라벨 각각 보임.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/src/components/reels/BilingualToggle.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬3 한/영 토글"
```

---

### Task 7: 씬4 파닉스 LetterFill (10~14s)

> ⚠️ 라이브 화면 캡처 폐기. **순수 Remotion 으로 LetterFillCanvas 효과 재현** — 회색 글자 윤곽 위로 컬러 글자가 아래→위로 채워지고 ✓ 표시. 영문 'A' → 한글 'ㄱ' 두 글자 순차.

**Files:**
- Create: `packages/remotion/src/components/reels/PhonicsScene.tsx`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: PhonicsScene 작성 — 글자 채워지는 애니(clipPath) + ✓ + 자막**

```tsx
// packages/remotion/src/components/reels/PhonicsScene.tsx
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['800'] });

// 회색 윤곽 글자 위에 컬러 글자를 아래→위 clipPath 로 reveal
const FillLetter: React.FC<{ char: string; progress: number; done: boolean }> = ({ char, progress, done }) => {
  const reveal = (1 - progress) * 100; // inset bottom %: 100→0
  const common: React.CSSProperties = {
    fontFamily, fontWeight: 800, fontSize: 420, lineHeight: 1,
    position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
  };
  return (
    <div style={{ position: 'relative', width: 460, height: 460 }}>
      <div style={{ ...common, color: '#D7E8E0' }}>{char}</div>
      <div style={{ ...common, color: '#1F9D6B', clipPath: `inset(${reveal}% 0 0 0)` }}>{char}</div>
      {done && (
        <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 120 }}>✓</div>
      )}
    </div>
  );
};

export const PhonicsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const half = durationInFrames / 2;
  const showSecond = frame >= half;
  const char = showSecond ? 'ㄱ' : 'A';
  const local = frame % half;
  const progress = interpolate(local, [4, half * 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const done = progress >= 0.98;
  const enter = spring({ frame: local, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#EAF7F2', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 140, fontFamily, fontWeight: 800, fontSize: 72, color: '#1F7A5A', textAlign: 'center', whiteSpace: 'pre-line' }}>
        한글·영어{'\n'}파닉스까지
      </div>
      <div style={{ transform: `scale(${0.9 + enter * 0.1})` }}>
        <FillLetter char={char} progress={progress} done={done} />
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: ReelsPromo Series 에 씬4 추가**

```tsx
import { PhonicsScene } from '../components/reels/PhonicsScene';
<Series.Sequence durationInFrames={4 * REELS_FPS}>
  <PhonicsScene />
</Series.Sequence>
```

- [ ] **Step 3: typecheck + 프레임 렌더**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t7.png --frame=360`
Expected: 파닉스 화면 + "파닉스까지" 자막.

- [ ] **Step 4: Commit**

```bash
git add packages/remotion/src/components/reels/PhonicsScene.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬4 파닉스 LetterFill"
```

---

### Task 8: 씬5 자연관찰 (14~17s)

**Files:**
- Create: `packages/remotion/src/components/reels/NatureScene.tsx`
- Copy asset: 자연관찰/식물/동물 계열 표지 1~2장 → `public/reels/nature/`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: 자연관찰 자산 복사**

```bash
mkdir -p packages/remotion/public/reels/nature
cp packages/client/public/strategy-samples/card-03-animal.webp packages/remotion/public/reels/nature/
cp packages/client/public/strategy-samples/card-04-plant.webp packages/remotion/public/reels/nature/
cp packages/client/public/strategy-samples/card-05-ocean.webp packages/remotion/public/reels/nature/
```

- [ ] **Step 2: NatureScene 작성 — KenBurns 슬로우 줌 + 자막**

```tsx
// packages/remotion/src/components/reels/NatureScene.tsx
import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';

const { fontFamily } = loadFont('normal', { weights: ['800'] });
const IMGS = ['reels/nature/card-03-animal.webp', 'reels/nature/card-04-plant.webp', 'reels/nature/card-05-ocean.webp'];

export const NatureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cut = Math.floor(frame / (1 * fps)) % IMGS.length;
  const zoom = interpolate(frame, [0, 3 * fps], [1.0, 1.12]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#0E2A22' }}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Img src={staticFile(IMGS[cut])} style={{ width: '90%', borderRadius: 24, transform: `scale(${zoom})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 200 }}>
        <div style={{ fontFamily, fontWeight: 800, fontSize: 76, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.5)' }}>
          자연관찰 그림책도
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: ReelsPromo Series 에 씬5 추가**

```tsx
import { NatureScene } from '../components/reels/NatureScene';
<Series.Sequence durationInFrames={3 * REELS_FPS}>
  <NatureScene />
</Series.Sequence>
```

- [ ] **Step 4: typecheck + 프레임 렌더**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t8.png --frame=465`
Expected: 자연관찰 이미지 + 자막.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/public/reels/nature packages/remotion/src/components/reels/NatureScene.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬5 자연관찰"
```

---

### Task 9: 씬6 클로징 — 호리 + "오픈베타 무료" CTA (17~22s)

**Files:**
- Create: `packages/remotion/src/components/reels/ClosingScene.tsx`
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: ClosingScene 작성 — 호리 등장(spring) + 큰 무료 CTA + SparkleParticles**

호리 Lottie(`celebrating.json`) 는 `@remotion/lottie` 미설치 시 정적 `waving.webp` 로 대체(번들 단순화). spring 으로 통통.

```tsx
// packages/remotion/src/components/reels/ClosingScene.tsx
import React from 'react';
import { AbsoluteFill, Img, staticFile, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from '../SparkleParticles';

const { fontFamily } = loadFont('normal', { weights: ['800'] });

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill style={{ backgroundColor: '#FF6B5E', justifyContent: 'center', alignItems: 'center' }}>
      <Img src={staticFile('reels/mascot/waving.webp')} style={{ width: 320, transform: `scale(${pop})` }} />
      <div style={{ fontFamily, fontWeight: 800, fontSize: 110, color: '#fff', marginTop: 24, transform: `scale(${pop})` }}>오픈베타 무료</div>
      <div style={{ fontFamily, fontWeight: 800, fontSize: 52, color: '#FFE9D6', marginTop: 16 }}>지금 무료로 보기 👇</div>
      <SparkleParticles seed={777} count={50} />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: ReelsPromo Series 에 씬6 추가**

```tsx
import { ClosingScene } from '../components/reels/ClosingScene';
<Series.Sequence durationInFrames={5 * REELS_FPS}>
  <ClosingScene />
</Series.Sequence>
```

- [ ] **Step 3: typecheck + 프레임 렌더**

Run: `pnpm --filter @tangobook/remotion typecheck`
Run: `cd packages/remotion && npx remotion render ReelsPromo out/t9.png --frame=600`
Expected: 호리 + "오픈베타 무료" CTA.

- [ ] **Step 4: Commit**

```bash
git add packages/remotion/src/components/reels/ClosingScene.tsx packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 씬6 클로징 무료 CTA"
```

---

### Task 10: BGM 삽입 + 최종 풀 렌더

**Files:**
- Add asset: `packages/remotion/public/reels/bgm.mp3` (저작권 free placeholder)
- Modify: `packages/remotion/src/compositions/ReelsPromo.tsx`

- [ ] **Step 1: BGM placeholder 안내**

사용자가 최종 트랙 교체 전제. 임시로 무음/free 트랙을 `public/reels/bgm.mp3` 로 둠. 파일 없으면 `<Audio>` 생략하고 Step 3 진행.

- [ ] **Step 2: ReelsPromo 에 Audio 추가 (파일 있을 때만)**

```tsx
import { Audio, staticFile } from 'remotion';
// AbsoluteFill 안, Series 위:
<Audio src={staticFile('reels/bgm.mp3')} volume={0.6} />
```

- [ ] **Step 3: 전체 mp4 렌더**

Run: `cd packages/remotion && npx remotion render ReelsPromo out/reels-promo.mp4`
Expected: `out/reels-promo.mp4` (1080×1920, ~22s) 생성. 콘솔에 6개 씬 렌더 진행.

- [ ] **Step 4: 결과 확인**

mp4 을 preview 도구 또는 사용자에게 전달해 6개 씬 흐름·자막·무료 CTA 확인.

- [ ] **Step 5: Commit**

```bash
git add packages/remotion/src/compositions/ReelsPromo.tsx
git commit -m "feat(remotion): 릴스 BGM 삽입 + 전체 렌더 파이프라인"
```

> `out/*.png`, `out/*.mp4` 는 산출물 — `.gitignore` 확인. remotion `out/` 이 ignore 안 돼 있으면 추가.

---

## Self-Review 결과
- **스펙 커버리지**: 씬1~6 = Task 4~9, 자산=Task 1·2, 스캐폴드=Task 3, BGM/렌더=Task 10. 6개 메시지(그림체·명작·한영·파닉스·자연관찰·무료) 전부 커버. ✅
- **해상도**: 1080×1920 (스펙 §1) — types.ts RESOLUTIONS 9:16(720×1280) 대신 ReelsPromo 전용 상수로 고해상도 직접 지정. ✅
- **타입 일관성**: `REELS_FPS/WIDTH/HEIGHT/DURATION` 상수를 Task 3 에서 정의, Task 4~10 에서 동일 사용. 컴포넌트 named export. ✅
- **폴백**: 앱 캡처(Task 2) 실패 시 씬3·4 표지 폴백 명시. ✅
- **리스크**: 호리 Lottie 대신 정적 webp 사용(번들 단순). `@remotion/lottie` 원하면 별도 설치 필요 — 1차는 정적.
