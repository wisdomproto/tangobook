# Remotion 기반 오디오북 탭 리빌드 — 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 MoviePy 기반 오디오북 탭을 Remotion으로 교체하여 Ken Burns 줌, 타이프라이터 자막, 파티클 효과가 있는 영상을 클라이언트에서 프리뷰하고 서버에서 렌더링한다.

**Architecture:** `packages/remotion/`에 Remotion 컴포지션과 컴포넌트를 배치. 클라이언트는 `@remotion/player`로 실시간 프리뷰, 서버는 `@remotion/renderer`로 최종 MP4 생성. 변환 헬퍼는 `packages/shared/`에 공유.

**Tech Stack:** Remotion v4, @remotion/player, @remotion/renderer, @remotion/bundler, @remotion/transitions, @remotion/google-fonts, React, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-26-remotion-audiobook-design.md`

---

## Chunk 1: Remotion 패키지 설정 + 핵심 컴포넌트

### Task 1: packages/remotion 패키지 초기화

**Files:**
- Create: `packages/remotion/package.json`
- Create: `packages/remotion/tsconfig.json`
- Create: `packages/remotion/src/index.ts`
- Create: `packages/remotion/src/types.ts`
- Modify: `pnpm-workspace.yaml` (remotion 패키지 이미 포함됨 — `packages/*` 패턴)

- [ ] **Step 1: package.json 생성**

```json
{
  "name": "@tangobook/remotion",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "remotion": "^4.0.0",
    "@remotion/transitions": "^4.0.0",

    "@remotion/google-fonts": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@remotion/cli": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "paths": {
      "@tangobook/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "../shared" }]
}
```

- [ ] **Step 3: types.ts 생성 — Remotion 전용 타입 (Storybook에 의존하지 않음)**

```typescript
// packages/remotion/src/types.ts

export type AudiobookSlide = {
  imageUrl: string;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitleText?: string;
};

export type SubtitleStyle = {
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
};

export type AudiobookRenderProps = {
  slides: AudiobookSlide[];
  aspectRatio: '16:9' | '9:16' | '1:1' | '3:4' | '4:3';
  cover?: {
    imageUrl: string;
    title: string;
    duration: number;
  };
  bgmUrl?: string;
  bgmVolume?: number;
  subtitleStyle: SubtitleStyle;
  enableParticles?: boolean;
  fps?: number;
};

export const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 720, height: 720 },
  '3:4': { width: 720, height: 960 },
  '4:3': { width: 960, height: 720 },
};
```

- [ ] **Step 4: index.ts 생성 — public exports**

```typescript
// packages/remotion/src/index.ts
export * from './types';
export { AudiobookComposition } from './compositions/AudiobookComposition';
export { KenBurnsSlide } from './components/KenBurnsSlide';
export { TypewriterSubtitle } from './components/TypewriterSubtitle';
export { SparkleParticles } from './components/SparkleParticles';
export { CoverSlide } from './components/CoverSlide';
export { EndingSlide } from './components/EndingSlide';
```

- [ ] **Step 5: pnpm install 실행**

Run: `pnpm install`
Expected: `@tangobook/remotion` 패키지가 워크스페이스에 등록됨

- [ ] **Step 6: Commit**

```bash
git add packages/remotion/
git commit -m "feat: initialize @tangobook/remotion package with types"
```

---

### Task 2: KenBurnsSlide 컴포넌트

**Files:**
- Create: `packages/remotion/src/components/KenBurnsSlide.tsx`
- Create: `packages/remotion/src/utils/ken-burns.ts`

- [ ] **Step 1: ken-burns.ts 유틸리티 작성 — 랜덤 줌/패닝 파라미터 생성**

```typescript
// packages/remotion/src/utils/ken-burns.ts

export type KenBurnsDirection =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down';

export type KenBurnsParams = {
  direction: KenBurnsDirection;
  startScale: number;
  endScale: number;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};

const DIRECTIONS: KenBurnsDirection[] = [
  'zoom-in', 'zoom-out',
  'pan-left', 'pan-right',
  'pan-up', 'pan-down',
];

/**
 * Deterministic random based on seed (page index).
 * Ensures same animation on every render for same slide.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export function getKenBurnsParams(slideIndex: number): KenBurnsParams {
  const rand = seededRandom(slideIndex);
  const direction = DIRECTIONS[Math.floor(rand * DIRECTIONS.length)];

  switch (direction) {
    case 'zoom-in':
      return { direction, startScale: 1.0, endScale: 1.25, startX: 0, endX: 0, startY: 0, endY: 0 };
    case 'zoom-out':
      return { direction, startScale: 1.25, endScale: 1.0, startX: 0, endX: 0, startY: 0, endY: 0 };
    case 'pan-left':
      return { direction, startScale: 1.15, endScale: 1.15, startX: 5, endX: -5, startY: 0, endY: 0 };
    case 'pan-right':
      return { direction, startScale: 1.15, endScale: 1.15, startX: -5, endX: 5, startY: 0, endY: 0 };
    case 'pan-up':
      return { direction, startScale: 1.15, endScale: 1.15, startX: 0, endX: 0, startY: 5, endY: -5 };
    case 'pan-down':
      return { direction, startScale: 1.15, endScale: 1.15, startX: 0, endX: 0, startY: -5, endY: 5 };
  }
}
```

- [ ] **Step 2: KenBurnsSlide.tsx 컴포넌트 작성**

CSS transitions/animations은 금지 — 반드시 `useCurrentFrame()` + `interpolate()` 사용.
`<Img>` 컴포넌트를 사용해야 함 (native `<img>` 금지).

```tsx
// packages/remotion/src/components/KenBurnsSlide.tsx
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { getKenBurnsParams } from '../utils/ken-burns';

type KenBurnsSlideProps = {
  imageUrl: string;
  slideIndex: number;
};

export const KenBurnsSlide: React.FC<KenBurnsSlideProps> = ({ imageUrl, slideIndex }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const params = getKenBurnsParams(slideIndex);

  const scale = interpolate(frame, [0, durationInFrames], [params.startScale, params.endScale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(frame, [0, durationInFrames], [params.startX, params.endX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, durationInFrames], [params.startY, params.endY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#000' }}>
      <Img
        src={imageUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/remotion/src/components/KenBurnsSlide.tsx packages/remotion/src/utils/ken-burns.ts
git commit -m "feat: add KenBurnsSlide component with deterministic random animations"
```

---

### Task 3: TypewriterSubtitle 컴포넌트

**Files:**
- Create: `packages/remotion/src/components/TypewriterSubtitle.tsx`

- [ ] **Step 1: TypewriterSubtitle.tsx 작성**

Remotion 룰: string slicing으로 타이프라이터 구현. per-character opacity 금지.
한글 폰트: `@remotion/google-fonts/NotoSansKR` 사용.

```tsx
// packages/remotion/src/components/TypewriterSubtitle.tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import type { SubtitleStyle } from '../types';

const { fontFamily } = loadFont();

type TypewriterSubtitleProps = {
  text: string;
  style: SubtitleStyle;
  /** Frames per character. Default: 2 */
  charFrames?: number;
};

export const TypewriterSubtitle: React.FC<TypewriterSubtitleProps> = ({
  text,
  style,
  charFrames = 2,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const totalTypingFrames = text.length * charFrames;
  const typedChars = Math.min(text.length, Math.floor(frame / charFrames));
  const displayText = text.slice(0, typedChars);

  // Fade out in last 0.5 seconds
  const { fps } = useVideoConfig();
  const fadeOutStart = durationInFrames - Math.round(0.5 * fps);
  const opacity = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: style.position === 'center' ? 'center' : style.position === 'bottom' ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        padding: style.position === 'bottom' ? '0 40px 60px' : style.position === 'top' ? '60px 40px 0' : '0 40px',
        opacity,
      }}
    >
      {displayText && (
        <div
          style={{
            fontFamily,
            fontSize: style.fontSize,
            fontWeight: 700,
            color: style.color,
            backgroundColor: style.backgroundColor,
            padding: '8px 20px',
            borderRadius: 6,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '80%',
            wordBreak: 'keep-all',
          }}
        >
          {displayText}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/remotion/src/components/TypewriterSubtitle.tsx
git commit -m "feat: add TypewriterSubtitle component with Korean font support"
```

---

### Task 4: SparkleParticles 컴포넌트

**Files:**
- Create: `packages/remotion/src/components/SparkleParticles.tsx`

- [ ] **Step 1: SparkleParticles.tsx 작성**

CSS animations 금지 — 모든 움직임은 `useCurrentFrame()` + `interpolate()` 기반.

```tsx
// packages/remotion/src/components/SparkleParticles.tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
};

function generateParticles(count: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = Math.sin((seed + i) * 9301 + 49297) * 49297;
    const r = s - Math.floor(s);
    const s2 = Math.sin((seed + i + 100) * 9301 + 49297) * 49297;
    const r2 = s2 - Math.floor(s2);
    particles.push({
      x: r * 100,
      y: r2 * 100,
      size: 2 + r * 4,
      speed: 0.3 + r2 * 0.7,
      phase: r * Math.PI * 2,
    });
  }
  return particles;
}

type SparkleParticlesProps = {
  /** Number of particles. Default: 30 */
  count?: number;
  /** Seed for deterministic randomness */
  seed?: number;
};

export const SparkleParticles: React.FC<SparkleParticlesProps> = ({
  count = 30,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const particles = generateParticles(count, seed);
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {particles.map((p, i) => {
        const opacity = interpolate(
          Math.sin(time * p.speed * 3 + p.phase),
          [-1, 1],
          [0.1, 0.8],
        );
        const yOffset = Math.sin(time * p.speed + p.phase) * 10;
        const xOffset = Math.cos(time * p.speed * 0.5 + p.phase) * 5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x + xOffset}%`,
              top: `${p.y + yOffset}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255, 255, 255, 0.3)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/remotion/src/components/SparkleParticles.tsx
git commit -m "feat: add SparkleParticles component with deterministic particle generation"
```

---

### Task 5: CoverSlide + EndingSlide 컴포넌트

**Files:**
- Create: `packages/remotion/src/components/CoverSlide.tsx`
- Create: `packages/remotion/src/components/EndingSlide.tsx`

- [ ] **Step 1: CoverSlide.tsx 작성**

```tsx
// packages/remotion/src/components/CoverSlide.tsx
import { AbsoluteFill } from 'remotion';
import { KenBurnsSlide } from './KenBurnsSlide';
import { TypewriterSubtitle } from './TypewriterSubtitle';
import { SparkleParticles } from './SparkleParticles';
import type { SubtitleStyle } from '../types';

type CoverSlideProps = {
  imageUrl: string;
  title: string;
  subtitleStyle: SubtitleStyle;
  enableParticles?: boolean;
};

export const CoverSlide: React.FC<CoverSlideProps> = ({
  imageUrl,
  title,
  subtitleStyle,
  enableParticles = true,
}) => {
  return (
    <AbsoluteFill>
      <KenBurnsSlide imageUrl={imageUrl} slideIndex={-1} />
      <TypewriterSubtitle
        text={title}
        style={{ ...subtitleStyle, position: 'center', fontSize: subtitleStyle.fontSize * 1.5 }}
      />
      {enableParticles && <SparkleParticles seed={999} />}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: EndingSlide.tsx 작성**

```tsx
// packages/remotion/src/components/EndingSlide.tsx
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansKR';
import { SparkleParticles } from './SparkleParticles';

const { fontFamily } = loadFont();

type EndingSlideProps = {
  text?: string;
  enableParticles?: boolean;
};

export const EndingSlide: React.FC<EndingSlideProps> = ({
  text = 'The End',
  enableParticles = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontFamily,
          fontSize: 64,
          fontWeight: 700,
          color: '#ffffff',
          opacity,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
      {enableParticles && <SparkleParticles seed={888} count={40} />}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/remotion/src/components/CoverSlide.tsx packages/remotion/src/components/EndingSlide.tsx
git commit -m "feat: add CoverSlide and EndingSlide components"
```

---

### Task 6: AudiobookComposition — 메인 컴포지션

**Files:**
- Create: `packages/remotion/src/compositions/AudiobookComposition.tsx`

- [ ] **Step 1: AudiobookComposition.tsx 작성**

`TransitionSeries`로 crossfade 전환 구현 (Remotion transitions 룰 참조).
`<Audio>` 컴포넌트로 TTS/BGM 처리 (Remotion audio 룰 참조).

```tsx
// packages/remotion/src/compositions/AudiobookComposition.tsx
import { AbsoluteFill, Sequence } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { Audio } from 'remotion';
import { KenBurnsSlide } from '../components/KenBurnsSlide';
import { TypewriterSubtitle } from '../components/TypewriterSubtitle';
import { SparkleParticles } from '../components/SparkleParticles';
import { CoverSlide } from '../components/CoverSlide';
import { EndingSlide } from '../components/EndingSlide';
import type { AudiobookRenderProps } from '../types';

const CROSSFADE_DURATION = 15; // frames (0.5s at 30fps)
const DEFAULT_SLIDE_DURATION = 90; // frames (3s at 30fps)
const ENDING_DURATION = 90; // frames (3s at 30fps)

function getSlideDuration(slide: AudiobookRenderProps['slides'][0], fps: number): number {
  if (slide.ttsDuration) {
    return Math.ceil((slide.ttsDuration + 0.5) * fps);
  }
  return DEFAULT_SLIDE_DURATION;
}

export const AudiobookComposition: React.FC<AudiobookRenderProps> = ({
  slides,
  aspectRatio,
  cover,
  bgmUrl,
  bgmVolume = 30,
  subtitleStyle,
  enableParticles = true,
}) => {
  const fps = 30;
  const coverDuration = cover ? Math.ceil(cover.duration * fps) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        {/* Cover slide */}
        {cover && (
          <>
            <TransitionSeries.Sequence durationInFrames={coverDuration} key="cover">
              <CoverSlide
                imageUrl={cover.imageUrl}
                title={cover.title}
                subtitleStyle={subtitleStyle}
                enableParticles={enableParticles}
              />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
            />
          </>
        )}

        {/* Page slides */}
        {slides.map((slide, index) => {
          const duration = getSlideDuration(slide, fps);
          return (
            <React.Fragment key={index}>
              <TransitionSeries.Sequence durationInFrames={duration}>
                <AbsoluteFill>
                  <KenBurnsSlide imageUrl={slide.imageUrl} slideIndex={index} />
                  {slide.subtitleText && (
                    <TypewriterSubtitle text={slide.subtitleText} style={subtitleStyle} />
                  )}
                  {enableParticles && <SparkleParticles seed={index} />}
                  {slide.ttsUrl && (
                    <Audio src={slide.ttsUrl} volume={1} />
                  )}
                </AbsoluteFill>
              </TransitionSeries.Sequence>
              {index < slides.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Transition to ending */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: CROSSFADE_DURATION })}
        />

        {/* Ending slide */}
        <TransitionSeries.Sequence durationInFrames={ENDING_DURATION} key="ending">
          <EndingSlide enableParticles={enableParticles} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* BGM — spans entire composition */}
      {bgmUrl && (
        <Audio src={bgmUrl} volume={bgmVolume / 100} loop />
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/remotion/src/compositions/AudiobookComposition.tsx
git commit -m "feat: add AudiobookComposition with TransitionSeries crossfade"
```

---

### Task 7: Remotion Root + Entry Point + 컴포지션 등록

**Files:**
- Create: `packages/remotion/src/Root.tsx`
- Create: `packages/remotion/src/entry.ts` — `registerRoot()` 호출 (서버 bundle() 진입점)

- [ ] **Step 1: Root.tsx 작성 — calculateMetadata로 동적 duration/dimensions**

```tsx
// packages/remotion/src/Root.tsx
import { Composition, CalculateMetadataFunction } from 'remotion';
import { AudiobookComposition } from './compositions/AudiobookComposition';
import { AudiobookRenderProps, RESOLUTIONS } from './types';

const calculateMetadata: CalculateMetadataFunction<AudiobookRenderProps> = async ({ props }) => {
  const fps = props.fps ?? 30;
  const crossfadeDuration = 15; // 0.5s at 30fps
  const endingDuration = 90;

  const coverDuration = props.cover ? Math.ceil(props.cover.duration * fps) : 0;

  let totalFrames = coverDuration;
  for (const slide of props.slides) {
    const slideDuration = slide.ttsDuration
      ? Math.ceil((slide.ttsDuration + 0.5) * fps)
      : 90;
    totalFrames += slideDuration;
  }
  totalFrames += endingDuration;

  // Subtract crossfade overlaps
  const transitionCount = (props.cover ? 1 : 0) + Math.max(0, props.slides.length - 1) + 1; // +1 for ending
  totalFrames -= transitionCount * crossfadeDuration;

  const resolution = RESOLUTIONS[props.aspectRatio] ?? RESOLUTIONS['16:9'];

  return {
    durationInFrames: Math.max(totalFrames, fps), // At least 1 second
    fps,
    width: resolution.width,
    height: resolution.height,
  };
};

const defaultProps: AudiobookRenderProps = {
  slides: [{ imageUrl: 'https://placehold.co/1280x720', subtitleText: '샘플 자막' }],
  aspectRatio: '16:9',
  subtitleStyle: { fontSize: 24, color: '#ffffff', backgroundColor: '#00000080', position: 'bottom' },
  enableParticles: true,
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="Audiobook"
      component={AudiobookComposition}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={defaultProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
```

- [ ] **Step 2: entry.ts 작성 — registerRoot 호출 (서버 번들링 진입점)**

```typescript
// packages/remotion/src/entry.ts
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
```

서버의 `bundle()`에서 이 파일을 entryPoint로 지정해야 함.

- [ ] **Step 3: index.ts 업데이트 — Root export 추가**

`packages/remotion/src/index.ts`에 `export { RemotionRoot } from './Root';` 추가
(entry.ts는 index에서 export하지 않음 — 서버 번들 전용)

- [ ] **Step 4: Commit**

```bash
git add packages/remotion/src/Root.tsx packages/remotion/src/entry.ts packages/remotion/src/index.ts
git commit -m "feat: add RemotionRoot with calculateMetadata and registerRoot entry point"
```

---

## Chunk 2: 타입 업데이트 + Shared 변환 헬퍼 + 클라이언트 UI

### Task 8: AudiobookProject 타입 업데이트 (기존 Task 13을 앞으로 이동)

**Files:**
- Modify: `packages/shared/src/types/storybook.ts` — AudiobookProject에 enableParticles, youtubeUpload 추가

- [ ] **Step 1: AudiobookProject 타입에 새 필드 추가**

`enableParticles?: boolean` 추가, `youtubeUpload?: YouTubeUploadResult` 추가.
`layout` 필드는 optional로 유지 (기존 데이터 호환), 사용처에서만 무시.

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/types/storybook.ts
git commit -m "feat: add enableParticles and youtubeUpload to AudiobookProject type"
```

---

### Task 9: Shared 변환 헬퍼 (Storybook → AudiobookRenderProps)

**Files:**
- Create: `packages/shared/src/utils/audiobook-props.ts`
- Modify: `packages/shared/src/index.ts` — export 추가

- [ ] **Step 1: audiobook-props.ts 작성**

```typescript
// packages/shared/src/utils/audiobook-props.ts
import type { Storybook, AudiobookProject } from '../types/storybook';

// AudiobookRenderProps를 여기서 직접 정의 (remotion 패키지 의존 방지)
export type AudiobookSlideData = {
  imageUrl: string;
  ttsUrl?: string;
  ttsDuration?: number;
  subtitleText?: string;
};

export type AudiobookRenderData = {
  slides: AudiobookSlideData[];
  aspectRatio: '16:9' | '9:16' | '1:1' | '3:4' | '4:3';
  cover?: { imageUrl: string; title: string; duration: number };
  bgmUrl?: string;
  bgmVolume?: number;
  subtitleStyle: {
    fontSize: number;
    color: string;
    backgroundColor: string;
    position: 'top' | 'center' | 'bottom';
  };
  enableParticles?: boolean;
  fps?: number;
};

const SUBTITLE_SIZE_MAP: Record<string, number> = {
  sm: 18,
  md: 24,
  lg: 32,
};

export function buildAudiobookRenderData(
  storybook: Storybook,
  project: AudiobookProject,
): AudiobookRenderData {
  const lang = project.language || 'ko';
  const pages = (storybook.pages || []).slice(
    project.startPage - 1,
    project.endPage,
  );

  // Filter pages with illustrations (Page uses `illustrationUrl`, not `imageUrl`)
  const validPages = pages.filter((p) => p.illustrationUrl);

  const slides: AudiobookSlideData[] = validPages.map((page) => {
    const isTranslation = lang !== 'ko' && page.translations?.[lang];
    const text = isTranslation ? page.translations![lang].text : page.text;
    const ttsUrl = isTranslation ? page.translations![lang].ttsUrl : page.ttsUrl;
    // Note: Page/PageTranslation does not have ttsDuration field.
    // ttsDuration will be undefined here; the Remotion composition will fall back
    // to DEFAULT_SLIDE_DURATION (3s). If TTS-based duration is needed in the future,
    // either add ttsDuration to the Page type or use getAudioDurationInSeconds()
    // in calculateMetadata to probe TTS file duration at render time.

    return {
      imageUrl: page.illustrationUrl!,
      ttsUrl: project.includeTts ? ttsUrl : undefined,
      ttsDuration: undefined, // Not available on Page type; defaults to 3s
      subtitleText: project.includeSubtitles ? text : undefined,
    };
  });

  // Cover
  let cover: AudiobookRenderData['cover'] | undefined;
  if (project.includeCover) {
    const coverImageUrl = project.coverImageUrl || storybook.coverImage;
    if (coverImageUrl) {
      cover = {
        imageUrl: coverImageUrl,
        title: storybook.title || '',
        duration: project.coverDuration || 3,
      };
    }
  }

  // BGM
  const bgmUrl = project.includeBgm
    ? (project.bgmUrl || storybook.backgroundMusicUrl)
    : undefined;

  const aspectRatio = (['16:9', '9:16', '1:1', '3:4', '4:3'].includes(project.aspectRatio)
    ? project.aspectRatio
    : '16:9') as AudiobookRenderData['aspectRatio'];

  return {
    slides,
    aspectRatio,
    cover,
    bgmUrl,
    bgmVolume: project.bgmVolume ?? 30,
    subtitleStyle: {
      fontSize: SUBTITLE_SIZE_MAP[project.subtitleSize] ?? 24,
      color: project.subtitleColor || '#ffffff',
      backgroundColor: project.subtitleBg || '#00000080',
      position: project.subtitlePosition || 'bottom',
    },
    enableParticles: project.enableParticles ?? true,
    fps: 30,
  };
}
```

- [ ] **Step 2: shared/index.ts에 export 추가**

```typescript
export { buildAudiobookRenderData } from './utils/audiobook-props';
export type { AudiobookSlideData, AudiobookRenderData } from './utils/audiobook-props';
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/utils/audiobook-props.ts packages/shared/src/index.ts
git commit -m "feat: add buildAudiobookRenderData helper in shared package"
```

---

### Task 9: 클라이언트 의존성 + AudiobookTab 교체

**Files:**
- Modify: `packages/client/package.json` — `@remotion/player` 추가
- Modify: `packages/client/src/features/audiobook/api/audiobook.api.ts` — render + youtube 엔드포인트 추가
- Modify: `packages/client/src/features/audiobook/components/AudiobookTab.tsx` — makeDefaultProject에 enableParticles 추가
- Rewrite: `packages/client/src/features/audiobook/components/AudiobookProjectCard.tsx` — Remotion Player 기반으로 교체

- [ ] **Step 1: 클라이언트에 @remotion/player 의존성 추가**

Run: `pnpm --filter client add @remotion/player remotion @tangobook/remotion`

- [ ] **Step 2: audiobook.api.ts에 render + youtube 엔드포인트 추가**

기존 `generate`, `getProgress`는 제거하고 새 엔드포인트로 교체:

```typescript
// packages/client/src/features/audiobook/api/audiobook.api.ts
import { apiGet, apiPost } from '@/lib/axios';

export type AudiobookRenderProgress = {
  progress: number;
  step: string;
  error?: string;
};

export const audiobookApi = {
  render: (data: { storybookId: string; projectId: string }) =>
    apiPost<{ outputUrl: string }>('/audiobooks/render', data),

  getRenderProgress: (projectId: string) =>
    apiGet<AudiobookRenderProgress | null>(`/audiobooks/render-progress/${projectId}`),

  youtubeUpload: (data: { storybookId: string; projectId: string }) =>
    apiPost<{ videoId: string; url: string }>('/audiobooks/youtube/upload', data),

  youtubeGenerateMeta: (data: { storybookId: string; projectId: string; preset?: string }) =>
    apiPost('/audiobooks/youtube/generate-meta', data),

  youtubeAuthUrl: () =>
    apiGet<{ url: string }>('/longform/youtube/auth-url'),

  youtubeStatus: () =>
    apiGet<{ connected: boolean }>('/longform/youtube/status'),
};
```

- [ ] **Step 3: AudiobookTab.tsx 업데이트 — makeDefaultProject에 enableParticles 추가, layout 제거**

`makeDefaultProject()`에 `enableParticles: true` 추가, `layout` 필드 제거.

- [ ] **Step 4: AudiobookProjectCard.tsx 교체 — Remotion Player 기반**

핵심 변경:
- `@remotion/player`의 `<Player>` 컴포넌트로 실시간 프리뷰
- `buildAudiobookRenderData()`로 storybook → props 변환
- "렌더링" 버튼 → 서버 렌더링 요청 + 진행률 폴링
- "다운로드" 버튼 → outputUrl 다운로드
- "YouTube 업로드" 버튼 → 기존 롱폼과 동일 패턴
- 기존 `generate` 버튼과 MoviePy 관련 로직 모두 제거
- `layout` 선택 UI 제거

Player 사용 패턴:

```tsx
import { Player } from '@remotion/player';
import { AudiobookComposition } from '@tangobook/remotion';
import { buildAudiobookRenderData } from '@tangobook/shared';

// 컴포넌트 내부:
const renderData = buildAudiobookRenderData(storybook, project);

<Player
  component={AudiobookComposition}
  inputProps={renderData}
  durationInFrames={calculatedDuration}
  compositionWidth={resolution.width}
  compositionHeight={resolution.height}
  fps={30}
  controls
  style={{ width: '100%' }}
/>
```

duration 계산은 `Root.tsx`의 `calculateMetadata`와 동일한 로직을 클라이언트에서도 실행.
이 계산 함수를 `packages/remotion/src/utils/duration.ts`로 분리하여 공유.

- [ ] **Step 5: packages/remotion/src/utils/duration.ts 생성**

```typescript
// packages/remotion/src/utils/duration.ts
import type { AudiobookRenderProps } from '../types';

const CROSSFADE_FRAMES = 15;
const DEFAULT_SLIDE_FRAMES = 90;
const ENDING_FRAMES = 90;

export function calculateTotalFrames(props: AudiobookRenderProps): number {
  const fps = props.fps ?? 30;
  const coverFrames = props.cover ? Math.ceil(props.cover.duration * fps) : 0;

  let total = coverFrames;
  for (const slide of props.slides) {
    total += slide.ttsDuration
      ? Math.ceil((slide.ttsDuration + 0.5) * fps)
      : DEFAULT_SLIDE_FRAMES;
  }
  total += ENDING_FRAMES;

  const transitionCount = (props.cover ? 1 : 0) + Math.max(0, props.slides.length - 1) + 1;
  total -= transitionCount * CROSSFADE_FRAMES;

  return Math.max(total, fps);
}
```

- [ ] **Step 6: index.ts에 duration export 추가**

- [ ] **Step 7: Commit**

```bash
git add packages/client/ packages/remotion/src/utils/duration.ts packages/remotion/src/index.ts
git commit -m "feat: replace AudiobookProjectCard with Remotion Player preview"
```

---

### Task 10: audiobook feature hooks + index 정리

**Files:**
- Modify: `packages/client/src/features/audiobook/hooks/useAudiobookGenerate.ts` — render mutation으로 교체
- Modify: `packages/client/src/features/audiobook/index.ts` — exports 업데이트

- [ ] **Step 1: useAudiobookGenerate.ts → useAudiobookRender.ts 교체**

기존 `useAudiobookGenerate` 훅을 `useAudiobookRender`로 이름 변경하고 `audiobookApi.render` 호출로 교체.

- [ ] **Step 2: index.ts exports 업데이트**

```typescript
export { audiobookApi } from './api/audiobook.api';
export { useAudiobookRender } from './hooks/useAudiobookRender';
export { AudiobookTab } from './components/AudiobookTab';
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/features/audiobook/
git commit -m "feat: update audiobook hooks and exports for Remotion"
```

---

## Chunk 3: 서버 렌더링 + YouTube 업로드

### Task 11: 서버 의존성 + Remotion 렌더링 서비스

**Files:**
- Modify: `packages/server/package.json` — `@remotion/renderer`, `@remotion/bundler` 추가
- Rewrite: `packages/server/src/services/audiobook.service.ts` — Remotion renderMedia 기반
- Delete: `packages/server/src/providers/audiobook.provider.ts` — Python 호출 제거
- Delete: `packages/server/scripts/generate_audiobook.py` — Python 스크립트 제거

- [ ] **Step 1: 서버 의존성 추가**

Run: `pnpm --filter server add @remotion/renderer @remotion/bundler remotion @tangobook/remotion`

- [ ] **Step 2: audiobook.service.ts 교체 — Remotion renderMedia 기반**

핵심 구조:
- `renderProgressMap`: 기존 패턴 유지
- `render()`: bundle() → renderMedia() → R2 업로드
- `getProgress()`: 기존과 동일
- YouTube 메서드: 기존 `youtube.provider.ts` 재사용

```typescript
// packages/server/src/services/audiobook.service.ts
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { R2Repository } from '../repositories/r2.repository';
import { buildR2Key } from '../utils/r2-key';
import { AppError } from '../middleware/error.middleware';
import { buildAudiobookRenderData } from '@tangobook/shared';

type RenderProgress = { progress: number; step: string; error?: string };
const renderProgressMap = new Map<string, RenderProgress>();
let cachedBundlePath: string | null = null;

async function getBundlePath(): Promise<string> {
  if (cachedBundlePath && fs.existsSync(cachedBundlePath)) {
    return cachedBundlePath;
  }
  const remotionEntry = path.resolve(__dirname, '../../../remotion/src/entry.ts');
  cachedBundlePath = await bundle({
    entryPoint: remotionEntry,
    // Remotion bundler uses webpack internally
  });
  return cachedBundlePath;
}

export class AudiobookService {
  static getProgress(projectId: string) {
    return renderProgressMap.get(projectId) ?? null;
  }

  static async render(req: { storybookId: string; projectId: string }) {
    const { storybookId, projectId } = req;

    // 1. Load storybook
    const storybook = await R2Repository.getStorybook(storybookId);
    if (!storybook) throw new AppError(404, '동화책을 찾을 수 없습니다.');

    const project = storybook.audiobookProjects?.find((p) => p.id === projectId);
    if (!project) throw new AppError(404, '오디오북 프로젝트를 찾을 수 없습니다.');

    // 2. Build render props
    const renderData = buildAudiobookRenderData(storybook, project);
    if (renderData.slides.length === 0) {
      throw new AppError(400, '렌더링할 페이지가 없습니다.');
    }

    renderProgressMap.set(projectId, { progress: 0, step: '번들링 준비 중' });

    const workDir = path.join(os.tmpdir(), `audiobook-${projectId}-${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    try {
      // 3. Bundle
      renderProgressMap.set(projectId, { progress: 5, step: 'Remotion 번들링' });
      const bundlePath = await getBundlePath();

      // 4. Select composition
      renderProgressMap.set(projectId, { progress: 10, step: '컴포지션 준비' });
      const composition = await selectComposition({
        serveUrl: bundlePath,
        id: 'Audiobook',
        inputProps: renderData,
      });

      // 5. Render
      const outputPath = path.join(workDir, 'output.mp4');
      renderProgressMap.set(projectId, { progress: 15, step: '렌더링 중' });

      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: renderData,
        timeoutInMilliseconds: 600000, // 10 minutes
        onProgress: ({ progress }) => {
          const percent = 15 + Math.round(progress * 75); // 15-90%
          renderProgressMap.set(projectId, { progress: percent, step: '렌더링 중' });
        },
      });

      // 6. Upload to R2
      renderProgressMap.set(projectId, { progress: 92, step: 'R2 업로드 중' });
      const r2Key = buildR2Key({
        storybookId,
        storybookTitle: storybook.title,
        fileType: 'audiobook',
        identifier: project.name,
        extension: 'mp4',
      });
      const fileBuffer = fs.readFileSync(outputPath);
      const outputUrl = await R2Repository.uploadBuffer(fileBuffer, r2Key, 'video/mp4');

      // 7. Update storybook
      const projIndex = storybook.audiobookProjects!.findIndex((p) => p.id === projectId);
      if (projIndex >= 0) {
        storybook.audiobookProjects![projIndex].outputUrl = outputUrl;
        storybook.audiobookProjects![projIndex].createdAt = new Date().toISOString();
        await R2Repository.saveStorybook(storybook);
      }

      renderProgressMap.set(projectId, { progress: 100, step: '완료' });
      setTimeout(() => renderProgressMap.delete(projectId), 30000);

      return { outputUrl };
    } catch (err: any) {
      renderProgressMap.set(projectId, {
        progress: -1,
        step: '렌더링 실패',
        error: err.message || '알 수 없는 오류',
      });
      setTimeout(() => renderProgressMap.delete(projectId), 30000);
      throw err;
    } finally {
      // Cleanup
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }
}
```

- [ ] **Step 3: audiobook.provider.ts 삭제**

- [ ] **Step 4: generate_audiobook.py 삭제**

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/audiobook.service.ts
git rm packages/server/src/providers/audiobook.provider.ts packages/server/scripts/generate_audiobook.py
git commit -m "feat: replace MoviePy audiobook rendering with Remotion renderMedia"
```

---

### Task 12: 서버 라우트/컨트롤러 업데이트 + YouTube 연동

**Files:**
- Modify: `packages/server/src/controllers/audiobook.controller.ts` — render + youtube 핸들러 추가
- Modify: `packages/server/src/routes/audiobook.routes.ts` — 새 라우트 추가

- [ ] **Step 1: audiobook.controller.ts 업데이트**

기존 `generate` → `render`로 교체.
YouTube 핸들러 추가 (기존 longform controller에서 패턴 복사).

```typescript
// 핵심 핸들러:
// render — AudiobookService.render() 호출
// getRenderProgress — AudiobookService.getProgress() 호출
// youtubeUpload — 기존 youtube.provider 재사용
// youtubeGenerateMeta — 기존 longform.service 패턴 복사
```

- [ ] **Step 2: audiobook.routes.ts 업데이트**

```typescript
// 새 라우트:
router.post('/render', AudiobookController.render);
router.get('/render-progress/:projectId', AudiobookController.getRenderProgress);
router.post('/youtube/upload', AudiobookController.youtubeUpload);
router.post('/youtube/generate-meta', AudiobookController.youtubeGenerateMeta);

// 기존 라우트 제거:
// router.post('/generate', ...) — 삭제
// router.get('/progress/:projectId', ...) — 삭제 (render-progress로 교체)
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/controllers/audiobook.controller.ts packages/server/src/routes/audiobook.routes.ts
git commit -m "feat: update audiobook routes for Remotion rendering and YouTube upload"
```

---

(Task 13 moved to Task 8 in Chunk 2)

---

## Chunk 4: 통합 테스트 + 정리

### Task 14: 타입체크 + 빌드 확인

- [ ] **Step 1: 전체 타입체크**

Run: `pnpm typecheck`
Expected: 에러 없음

- [ ] **Step 2: 전체 빌드**

Run: `pnpm build`
Expected: 에러 없음

- [ ] **Step 3: 에러 수정 (있을 경우)**

타입 에러나 import 에러를 수정하고 재빌드.

- [ ] **Step 4: Commit (수정사항이 있을 경우)**

```bash
git add -A
git commit -m "fix: resolve type and build errors for Remotion integration"
```

---

### Task 15: 수동 통합 테스트

- [ ] **Step 1: 개발 서버 시작**

Run: `pnpm dev`

- [ ] **Step 2: 오디오북 탭 UI 확인**

- 기존 동화책 선택 → 오디오북 탭 이동
- "새 프로젝트" 생성
- Remotion Player가 표시되는지 확인
- 설정 변경 시 Player 프리뷰가 즉시 반영되는지 확인

- [ ] **Step 3: 렌더링 테스트**

- "렌더링" 버튼 클릭
- 진행률이 표시되는지 확인
- MP4 다운로드 확인

- [ ] **Step 4: 문제 수정 + Commit**

---

### Task 16: CLAUDE.md + 문서 업데이트

**Files:**
- Modify: `CLAUDE.md` — 오디오북 Feature 구조 업데이트, remotion 패키지 추가
- Modify: `docs/superpowers/specs/2026-03-26-remotion-audiobook-design.md` — 완료 표시

- [ ] **Step 1: CLAUDE.md 업데이트**

오디오북 Feature 구조 섹션 추가:
- `packages/remotion/` 패키지 설명
- 오디오북 렌더링 파이프라인 변경 (MoviePy → Remotion)
- 새 API 엔드포인트

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md docs/
git commit -m "docs: update CLAUDE.md for Remotion audiobook architecture"
```
