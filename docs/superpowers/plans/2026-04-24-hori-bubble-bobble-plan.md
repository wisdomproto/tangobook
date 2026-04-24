# Hori Bubble Bobble Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a faithful Taito Bubble Bobble (1986) reimagining as the 7th Hori arcade game, with single-screen play, bubble-trap mechanics, 10 levels + boss, and swappable emoji-placeholder assets.

**Architecture:** Phaser 4 arcade-physics game hosted inside a React component at `/games/hori-bubble`, following the existing `features/arcade-games/hori-*` pattern. Pure game logic (state machines, tilemap parser, timers, rules) is unit-tested with Vitest; Phaser scenes are verified by manual QA. Visual assets are abstracted behind a `VISUAL_ASSETS` config so emojis can later be swapped for real sprites without touching entity code.

**Tech Stack:**
- Phaser 4.0.0 (existing dep)
- React 18 + TypeScript + Vite
- Vitest 4.1 + jsdom + vitest-canvas-mock (existing setup)
- ffmpeg-static + Node scripts for SFX/BGM synthesis
- Python (Pillow) for sprite post-processing (existing `process-sprite-sheet.py`)

**Spec reference:** `docs/superpowers/specs/2026-04-24-hori-bubble-bobble-design.md`

---

## File Structure (to be created)

```
packages/client/src/features/arcade-games/hori-bubble/
├── components/
│   └── HoriBubbleGame.tsx
├── scenes/
│   ├── PreloadScene.ts
│   ├── MenuScene.ts
│   ├── GameScene.ts
│   ├── HUDScene.ts
│   └── GameOverScene.ts
├── entities/
│   ├── HoriPlayer.ts
│   ├── Enemy.ts
│   ├── WalkerEnemy.ts
│   ├── JumperEnemy.ts
│   ├── FloaterEnemy.ts
│   ├── BossEnemy.ts
│   ├── Bubble.ts
│   ├── SpecialBubble.ts
│   ├── PowerUp.ts
│   └── Fruit.ts
├── config/
│   ├── canvas.ts
│   ├── physics.ts
│   ├── hori.ts
│   ├── enemies.ts
│   ├── bubbles.ts
│   ├── powerups.ts
│   ├── rules.ts
│   ├── assets.ts
│   └── storage.ts
├── data/levels/
│   ├── level-schema.ts
│   └── level-01.json … level-10.json
├── utils/
│   ├── tilemap.ts
│   ├── emoji-texture.ts
│   ├── spawn.ts
│   └── wrap.ts
└── index.ts

packages/client/src/features/arcade-games/hori-bubble/ (tests colocated)
├── entities/*.test.ts
├── utils/*.test.ts
├── config/*.test.ts
└── rules.test.ts

packages/client/src/pages/
└── HoriBubblePage.tsx

packages/client/public/
├── mascot/hori/blow/ (generated)
├── sounds/bubble/ (generated)
└── arcade-backgrounds/ (generated)

scripts/
└── synthesize-bubble-sfx.mjs

docs/
├── hori-sprite-prompts.md (modify)
└── hori-bubble-qa.md (new)

CLAUDE.md (modify)
memory/hori-arcade-games.md (modify)
```

---

## Testing Strategy

**TDD for pure logic:**
- `utils/tilemap.ts` — JSON string → platform coordinate arrays
- `utils/wrap.ts` — vertical wrap math
- `utils/emoji-texture.ts` — cache key generation + fallback detection
- `entities/*.ts` state machine transitions (pure logic, avoid Phaser scene dependencies)
- `config/powerups.ts` — stacking math, timers
- `config/rules.ts` — scoring, combo, EXTEND, clear bonus

**Manual QA for:**
- Phaser scene integration
- Visual rendering / animations
- Audio playback
- Input device handling
- Performance (FPS)

**Test pattern:**
- Entities split into two layers: (1) a pure `*Logic.ts` module that holds state/timers/transitions with no Phaser dependency, (2) the Phaser `Sprite` subclass that composes the logic module and handles rendering/physics. Tests target the logic module. This is the standard pattern for testable Phaser games.
- Example: `BubbleLogic.ts` tested directly; `Bubble.ts` (extends `Phaser.GameObjects.Sprite`) composes `BubbleLogic` and is covered by manual QA.

**Test command:**
```bash
pnpm --filter client test -- run src/features/arcade-games/hori-bubble
```

---

## Chunk 1: Foundation & Scaffolding

### Task 1: Configuration constants and asset manifest

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/canvas.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/physics.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/hori.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/bubbles.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/enemies.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/powerups.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/rules.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/assets.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/storage.ts`

- [ ] **Step 1: Create `canvas.ts`**

```typescript
export const CANVAS = {
  width: 480,
  height: 640,
  playfieldTop: 80,      // HUD occupies top 80px
  tileSize: 20,
  gridCols: 24,
  gridRows: 16,
} as const;

export const ASSET_VERSION = 1;

export function assetUrl(path: string): string {
  return `${path}?v=${ASSET_VERSION}`;
}
```

- [ ] **Step 2: Create `physics.ts`**

```typescript
export const PHYSICS = {
  gravity: 500,
  walkSpeed: 120,
  walkSpeedBoost: 180,           // 🍭 powerup
  acceleration: 800,
  drag: 600,
  jumpVelocity: -330,
  jumpVelocityBoost: -400,       // 👟 powerup
  variableJumpCutoffVy: -150,    // velocity.y clamp on Space release
  maxFallSpeed: 400,
} as const;
```

- [ ] **Step 3: Create `hori.ts`**

```typescript
export const HORI = {
  startTile: { x: 11, y: 10 },   // center-ish, each level's 'S' overrides
  bodyScale: 0.7,                // smaller than canvas tile for visual gap
  invulnerabilityMs: 1500,
  blowAnimDurationMs: 300,
  hitboxInsetPx: 4,
} as const;

export const HORI_SPRITE_KEYS = {
  idle: 'hori-idle',
  run: 'hori-run',       // re-used for walk
  jump: 'hori-jump',
  hurt: 'hori-hurt',
  celebrate: 'hori-celebrate',
  blow: 'hori-blow',     // new sprite
} as const;

export const HORI_ANIM_KEYS = {
  idle: 'hori-bubble-idle',
  walk: 'hori-bubble-walk',
  jump: 'hori-bubble-jump',
  hurt: 'hori-bubble-hurt',
  celebrate: 'hori-bubble-celebrate',
  blow: 'hori-bubble-blow',
} as const;
```

- [ ] **Step 4: Create `bubbles.ts`**

```typescript
export const BUBBLE = {
  spawnOffsetPx: 16,
  spawnSpeed: 250,
  spawnTravelMs: 600,
  floatUpSpeed: -30,
  popAnimMs: 200,
  lifetimeMs: 8000,
  trapEscapeMs: 5000,
  trapWarningMs: 1000,   // last 1s red tint + shake
  cooldownMs: 300,
  cooldownMsBoost: 150,  // ⚡ powerup
  rangePxDefault: 150,
  rangePxBoost: 300,     // 🎈 powerup
  jumpOffVy: -250,
  jumpOffPopDelayMs: 300,
  maxConcurrent: 20,
} as const;

export type BubbleKind = 'normal' | 'water' | 'lightning' | 'fire';

export const SPECIAL_BUBBLE = {
  water: { sweepSpeed: 120 },
  lightning: { chargeMs: 200 },
  fire: { platformBurnMs: 2000 },
} as const;
```

- [ ] **Step 5: Create `enemies.ts`**

```typescript
export type EnemyKind = 'walker' | 'jumper' | 'floater' | 'boss';

export const ENEMY = {
  walker: {
    speed: 60,
    turnDelayMs: 100,     // small pause when reversing at edge
  },
  jumper: {
    jumpVy: -280,
    jumpIntervalMs: 1400,
    walkSpeed: 30,
  },
  floater: {
    speed: 50,
    sinAmplitudePx: 40,
    sinFrequencyHz: 0.5,
    pursuitLerp: 0.02,    // easing toward player
  },
  boss: {
    speed: 80,
    hitsToKill: 5,
    hurtFlashMs: 500,
    seedThrowIntervalMs: 2500,
    seedVy: 300,
  },
  rageModeMultiplier: 1.5,
  trapDurationMs: 5000,
  hitboxInsetPx: 4,
} as const;
```

- [ ] **Step 6: Create `powerups.ts`**

```typescript
export type PowerUpKind = 'speed' | 'range' | 'jump' | 'cooldown';

export const POWERUP = {
  dropIntervalMs: 20000,
  effectDurationMs: 15000,
  attractSpeed: 0,         // no magnet
  kinds: ['speed', 'range', 'jump', 'cooldown'] as const satisfies readonly PowerUpKind[],
} as const;
```

- [ ] **Step 7: Create `rules.ts`**

```typescript
export const RULES = {
  startingLives: 3,
  maxLives: 9,
  levelCount: 10,
  bossLevel: 10,
  hurryUpWarningAtMsLeft: 90000,
  blubbaSpawnAtMsLeft: 0,
  bgmRateHurryUp: 1.2,
  comboWindowMs: 1000,
  extendLetters: ['E', 'X', 'T', 'E', 'N', 'D'] as const,
  extendSpawnPerLevelMin: 1,
  extendSpawnPerLevelMax: 2,
} as const;

export const SCORE = {
  trap: 50,
  fruitFromEnemy: 100,
  fruitCollect: 200,
  fruitCollectCombo: 500,
  powerupPickup: 300,
  specialMultiKill: 1000,
  levelClearBase: 1000,
  levelClearTimeMultiplier: 10,  // per second remaining
  bossHit: 500,
  bossKill: 5000,
} as const;
```

- [ ] **Step 8: Create `assets.ts`**

```typescript
export type VisualAsset =
  | { kind: 'emoji'; glyph: string; size: number }
  | { kind: 'emoji-set'; glyphs: readonly string[]; size: number }
  | { kind: 'sprite'; textureKey: string; size: number };

export const VISUAL_ASSETS = {
  enemies: {
    walker:  { kind: 'emoji', glyph: '🌰', size: 40 },
    jumper:  { kind: 'emoji', glyph: '🍑', size: 40 },
    floater: { kind: 'emoji', glyph: '🐝', size: 40 },
    boss:    { kind: 'emoji', glyph: '🎃', size: 96 },
    trapped: { kind: 'emoji', glyph: '😵', size: 24 },
    fruit:   { kind: 'emoji-set', glyphs: ['🍎','🍓','🍇','🍊','🍒'], size: 36 },
    extend:  { kind: 'emoji-set', glyphs: ['🅴','🆇','🆃','🅴','🅽','🅳'], size: 44 },
  },
  bubbles: {
    normal:    { kind: 'emoji', glyph: '🫧', size: 52 },
    water:     { kind: 'emoji', glyph: '💧', size: 52 },
    lightning: { kind: 'emoji', glyph: '⚡', size: 52 },
    fire:      { kind: 'emoji', glyph: '🔥', size: 52 },
  },
  powerups: {
    speed:    { kind: 'emoji', glyph: '🍭', size: 44 },
    range:    { kind: 'emoji', glyph: '🎈', size: 44 },
    jump:     { kind: 'emoji', glyph: '👟', size: 44 },
    cooldown: { kind: 'emoji', glyph: '⚡', size: 44 },
  },
  seeds: {
    water:     { kind: 'emoji', glyph: '💠', size: 36 },
    lightning: { kind: 'emoji', glyph: '🟡', size: 36 },
    fire:      { kind: 'emoji', glyph: '🟥', size: 36 },
  },
} as const satisfies Record<string, Record<string, VisualAsset>>;
```

- [ ] **Step 9: Create `storage.ts`**

```typescript
const PREFIX = 'hori-bubble';

export const STORAGE_KEYS = {
  highScore: `${PREFIX}.highScore`,
  lastPlayedAt: `${PREFIX}.lastPlayedAt`,
  muted: `${PREFIX}.muted`,
  extendProgress: `${PREFIX}.extendProgress`, // session-scoped EXTEND letters
} as const;

function safeLocalStorage(): Storage | null {
  try {
    const k = '__test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadHighScore(): number {
  const n = Number(safeLocalStorage()?.getItem(STORAGE_KEYS.highScore));
  return Number.isFinite(n) ? n : 0;
}

export function saveHighScore(score: number): void {
  safeLocalStorage()?.setItem(STORAGE_KEYS.highScore, String(score));
}

export function loadMuted(): boolean {
  return safeLocalStorage()?.getItem(STORAGE_KEYS.muted) === '1';
}

export function saveMuted(muted: boolean): void {
  safeLocalStorage()?.setItem(STORAGE_KEYS.muted, muted ? '1' : '0');
}
```

- [ ] **Step 10: Commit config**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/config/
git commit -m "feat(hori-bubble): config constants and asset manifest"
```

---

### Task 2: Level schema and first placeholder level

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/data/levels/level-schema.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/data/levels/level-01.json`

- [ ] **Step 1: Create `level-schema.ts`**

```typescript
import type { EnemyKind } from '../../config/enemies';
import type { BubbleKind } from '../../config/bubbles';

export type LevelTheme = 'forest' | 'garden' | 'orchard';
export type BgmIntensity = 'calm' | 'normal' | 'intense';

export interface EnemySpawn {
  type: EnemyKind;
  x: number;
  y: number;
  direction?: 'left' | 'right';
}

export interface PowerUpDrop {
  at: number;                       // seconds from level start
  x?: number;
  y?: number;
  kind?: 'speed' | 'range' | 'jump' | 'cooldown';
}

export interface SpecialBubbleSeed {
  at: number;
  type: Exclude<BubbleKind, 'normal'>;
  x?: number;
  y?: number;
}

export interface LevelData {
  id: number;
  theme: LevelTheme;
  bgmIntensity?: BgmIntensity;
  tilemap: string[];                 // 16 rows × 24 chars
  enemies: EnemySpawn[];
  powerupDrops?: PowerUpDrop[];
  specialBubbleSeeds?: SpecialBubbleSeed[];
  timeLimit?: number;                // seconds, default 180
}

export function validateLevel(level: unknown): asserts level is LevelData {
  const lv = level as Partial<LevelData>;
  if (!lv || typeof lv !== 'object') throw new Error('level: not an object');
  if (typeof lv.id !== 'number') throw new Error('level: id missing');
  if (!lv.theme || !['forest', 'garden', 'orchard'].includes(lv.theme))
    throw new Error(`level ${lv.id}: invalid theme`);
  if (!Array.isArray(lv.tilemap) || lv.tilemap.length !== 16)
    throw new Error(`level ${lv.id}: tilemap must be 16 rows`);
  for (const [i, row] of lv.tilemap.entries()) {
    if (typeof row !== 'string' || row.length !== 24)
      throw new Error(`level ${lv.id}: row ${i} must be 24 chars`);
  }
  if (!Array.isArray(lv.enemies) || lv.enemies.length === 0)
    throw new Error(`level ${lv.id}: enemies missing`);
  const spawnRows = lv.tilemap.filter(r => r.includes('S'));
  if (spawnRows.length !== 1)
    throw new Error(`level ${lv.id}: tilemap must have exactly one 'S'`);
}
```

- [ ] **Step 2: Create `level-01.json`**

```json
{
  "id": 1,
  "theme": "forest",
  "tilemap": [
    "........................",
    "........................",
    "...=========.=========..",
    "........................",
    "........................",
    "=====.......S.......====",
    "........................",
    "........................",
    "...=========.=========..",
    "........................",
    "........................",
    "=====................===",
    "........................",
    "........................",
    "........................",
    "========================"
  ],
  "enemies": [
    { "type": "walker", "x": 4, "y": 2, "direction": "right" },
    { "type": "walker", "x": 18, "y": 2, "direction": "left" }
  ],
  "timeLimit": 180
}
```

- [ ] **Step 3: Write validator tests**

Create `packages/client/src/features/arcade-games/hori-bubble/data/levels/level-schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateLevel } from './level-schema';
import level01 from './level-01.json';

describe('validateLevel', () => {
  it('accepts a valid level', () => {
    expect(() => validateLevel(level01)).not.toThrow();
  });

  it('rejects missing id', () => {
    expect(() => validateLevel({ ...level01, id: undefined })).toThrow(/id missing/);
  });

  it('rejects invalid theme', () => {
    expect(() => validateLevel({ ...level01, theme: 'cave' })).toThrow(/invalid theme/);
  });

  it('rejects tilemap with wrong row count', () => {
    expect(() => validateLevel({ ...level01, tilemap: level01.tilemap.slice(0, 10) }))
      .toThrow(/16 rows/);
  });

  it('rejects tilemap row with wrong width', () => {
    const bad = [...level01.tilemap];
    bad[0] = '...';
    expect(() => validateLevel({ ...level01, tilemap: bad })).toThrow(/24 chars/);
  });

  it('rejects tilemap without a spawn point', () => {
    const bad = level01.tilemap.map(r => r.replace('S', '.'));
    expect(() => validateLevel({ ...level01, tilemap: bad })).toThrow(/exactly one 'S'/);
  });
});
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm --filter client test -- run src/features/arcade-games/hori-bubble/data/levels/level-schema.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/data/
git commit -m "feat(hori-bubble): level schema and placeholder level-01"
```

---

### Task 3: Route scaffolding + Games Hub card

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx`
- Create: `packages/client/src/features/arcade-games/hori-bubble/index.ts`
- Create: `packages/client/src/pages/HoriBubblePage.tsx`
- Modify: `packages/client/src/router/index.tsx`
- Modify: `packages/client/src/pages/GamesHubPage.tsx`

- [ ] **Step 1: Create placeholder `HoriBubbleGame.tsx`**

```typescript
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';

export function HoriBubbleGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: CANVAS.width,
      height: CANVAS.height,
      backgroundColor: '#0f172a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 500 }, debug: false },
      },
      scene: [],  // scenes added in later tasks
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />;
}
```

- [ ] **Step 2: Create `index.ts`**

```typescript
export { HoriBubbleGame } from './components/HoriBubbleGame';
```

- [ ] **Step 3: Create `HoriBubblePage.tsx`**

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HoriBubbleGame } from '@/features/arcade-games/hori-bubble';

export default function HoriBubblePage() {
  return (
    <ErrorBoundary>
      <div className="w-screen h-screen bg-darkbg overflow-hidden">
        <HoriBubbleGame />
      </div>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 4: Add route**

Edit `packages/client/src/router/index.tsx`. Find the block with other `/games/hori-*` routes and add alongside:

```tsx
{
  path: '/games/hori-bubble',
  lazy: async () => ({
    Component: (await import('@/pages/HoriBubblePage')).default,
  }),
},
```

(If existing routes use a different lazy pattern, follow the same pattern.)

- [ ] **Step 5: Add GamesHubPage card**

Edit `packages/client/src/pages/GamesHubPage.tsx`. Find the game list array (likely a `const GAMES = [...]`) and add:

```typescript
{
  id: 'hori-bubble',
  title: '호리 버블',
  emoji: '🫧',
  description: '거품으로 친구들을 가둬봐!',
  path: '/games/hori-bubble',
  // gradient/color matching siblings
},
```

- [ ] **Step 6: Dev-server smoke test (manual)**

```bash
pnpm dev
```

Open http://localhost:5174/games — verify 7th card "호리 버블 🫧" appears. Click it — black canvas at `/games/hori-bubble` confirms mount works. No console errors.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/ packages/client/src/pages/HoriBubblePage.tsx packages/client/src/router/index.tsx packages/client/src/pages/GamesHubPage.tsx
git commit -m "feat(hori-bubble): route scaffolding and games hub card"
```

---

### Task 4: Tilemap parser utility

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/tilemap.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/tilemap.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tilemap.test.ts
import { describe, it, expect } from 'vitest';
import { parseTilemap } from './tilemap';
import { CANVAS } from '../config/canvas';

const TS = CANVAS.tileSize;
const HUD = CANVAS.playfieldTop;

describe('parseTilemap', () => {
  const sample = [
    '........................',
    '........................',
    '===...........S........=',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '========================',
  ];

  it('returns platforms with pixel coords and widths (merged consecutive)', () => {
    const parsed = parseTilemap(sample);
    // Row 2 has two platforms: '===' (cols 0..2) and '=' (col 23)
    const rowTwoPlats = parsed.platforms.filter(p => p.y === HUD + 2 * TS);
    expect(rowTwoPlats).toEqual([
      { x: 0, y: HUD + 2 * TS, width: 3 * TS, height: TS },
      { x: 23 * TS, y: HUD + 2 * TS, width: TS, height: TS },
    ]);
  });

  it('returns the player spawn at pixel center of the S tile', () => {
    const { spawn } = parseTilemap(sample);
    expect(spawn).toEqual({ x: 14 * TS + TS / 2, y: HUD + 2 * TS + TS / 2 });
  });

  it('throws when no S tile is present', () => {
    const bad = sample.map(r => r.replace('S', '.'));
    expect(() => parseTilemap(bad)).toThrow(/spawn/i);
  });

  it('merges contiguous = into single platform per row', () => {
    const { platforms } = parseTilemap(sample);
    const bottom = platforms.filter(p => p.y === HUD + 15 * TS);
    expect(bottom).toHaveLength(1);
    expect(bottom[0]).toEqual({
      x: 0, y: HUD + 15 * TS, width: 24 * TS, height: TS,
    });
  });
});
```

- [ ] **Step 2: Run test, confirm it fails**

```bash
pnpm --filter client test -- run src/features/arcade-games/hori-bubble/utils/tilemap.test.ts
```

Expected: FAIL (`parseTilemap` not defined).

- [ ] **Step 3: Implement `tilemap.ts`**

```typescript
import { CANVAS } from '../config/canvas';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Spawn {
  x: number;
  y: number;
}

export interface ParsedTilemap {
  platforms: Platform[];
  walls: Platform[];           // '#' tiles for boss room
  spawn: Spawn;
}

export function parseTilemap(rows: string[]): ParsedTilemap {
  const platforms: Platform[] = [];
  const walls: Platform[] = [];
  let spawn: Spawn | null = null;
  const TS = CANVAS.tileSize;
  const HUD = CANVAS.playfieldTop;

  rows.forEach((row, r) => {
    let runStart: number | null = null;
    const flushPlatform = (endExclusive: number) => {
      if (runStart === null) return;
      platforms.push({
        x: runStart * TS,
        y: HUD + r * TS,
        width: (endExclusive - runStart) * TS,
        height: TS,
      });
      runStart = null;
    };

    for (let c = 0; c <= row.length; c++) {
      const ch = row[c];
      if (ch === '=') {
        if (runStart === null) runStart = c;
      } else {
        flushPlatform(c);
        if (ch === '#') {
          walls.push({ x: c * TS, y: HUD + r * TS, width: TS, height: TS });
        } else if (ch === 'S') {
          spawn = { x: c * TS + TS / 2, y: HUD + r * TS + TS / 2 };
        }
      }
    }
  });

  if (!spawn) throw new Error('parseTilemap: no spawn (S) found');
  return { platforms, walls, spawn };
}
```

- [ ] **Step 4: Run test, verify pass**

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/utils/tilemap.ts packages/client/src/features/arcade-games/hori-bubble/utils/tilemap.test.ts
git commit -m "feat(hori-bubble): tilemap parser with merged-run platforms"
```

---

### Task 5: Vertical wrap helper

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/wrap.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/wrap.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { wrapY } from './wrap';
import { CANVAS } from '../config/canvas';

describe('wrapY', () => {
  it('keeps y inside playfield', () => {
    const middle = CANVAS.playfieldTop + 100;
    expect(wrapY(middle)).toBe(middle);
  });

  it('wraps falling past bottom to top of playfield', () => {
    expect(wrapY(CANVAS.height + 10)).toBe(CANVAS.playfieldTop + 10);
  });

  it('wraps rising past top of playfield to bottom', () => {
    expect(wrapY(CANVAS.playfieldTop - 10)).toBe(CANVAS.height - 10);
  });

  it('handles multiple wraps (very large delta)', () => {
    const h = CANVAS.height - CANVAS.playfieldTop;
    const y = CANVAS.height + h + 5;
    expect(wrapY(y)).toBe(CANVAS.playfieldTop + 5);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Expected: FAIL.

- [ ] **Step 3: Implement `wrap.ts`**

```typescript
import { CANVAS } from '../config/canvas';

const TOP = CANVAS.playfieldTop;
const BOTTOM = CANVAS.height;
const HEIGHT = BOTTOM - TOP;

export function wrapY(y: number): number {
  if (y >= TOP && y < BOTTOM) return y;
  const rel = ((y - TOP) % HEIGHT + HEIGHT) % HEIGHT;
  return TOP + rel;
}

export function didWrapDown(prevY: number, nextY: number): boolean {
  return prevY <= BOTTOM && nextY > BOTTOM;
}

export function didWrapUp(prevY: number, nextY: number): boolean {
  return prevY >= TOP && nextY < TOP;
}
```

- [ ] **Step 4: Run test, verify pass**

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/utils/wrap.ts packages/client/src/features/arcade-games/hori-bubble/utils/wrap.test.ts
git commit -m "feat(hori-bubble): vertical wrap helper with edge-crossing detectors"
```

---

### Task 6: Emoji-to-texture helper

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/emoji-texture.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/emoji-texture.test.ts`

- [ ] **Step 1: Write failing tests** (cache-key logic only — canvas draw is covered by manual QA)

```typescript
import { describe, it, expect } from 'vitest';
import { emojiTextureKey, isEmojiRenderEmpty } from './emoji-texture';

describe('emojiTextureKey', () => {
  it('creates a stable key from glyph + size', () => {
    expect(emojiTextureKey('🫧', 52)).toBe('emoji:🫧:52');
  });

  it('different sizes produce different keys', () => {
    expect(emojiTextureKey('🫧', 40)).not.toBe(emojiTextureKey('🫧', 52));
  });

  it('different glyphs produce different keys', () => {
    expect(emojiTextureKey('🌰', 40)).not.toBe(emojiTextureKey('🍑', 40));
  });
});

describe('isEmojiRenderEmpty', () => {
  it('returns true for fully transparent image data', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4); // all zeros
    expect(isEmojiRenderEmpty(data)).toBe(true);
  });

  it('returns false if any pixel has non-zero alpha', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    data[3] = 255;
    expect(isEmojiRenderEmpty(data)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

- [ ] **Step 3: Implement `emoji-texture.ts`**

```typescript
import Phaser from 'phaser';

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export function emojiTextureKey(glyph: string, size: number): string {
  return `emoji:${glyph}:${size}`;
}

export function isEmojiRenderEmpty(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
}

/**
 * Render an emoji to a Phaser canvas texture, caching by `emojiTextureKey`.
 * If the emoji font is missing and the render comes out empty, returns
 * a fallback key pointing at a SVG fallback loaded in PreloadScene.
 */
export function ensureEmojiTexture(
  scene: Phaser.Scene,
  glyph: string,
  size: number,
  fallbackKey?: string,
): string {
  const key = emojiTextureKey(glyph, size);
  if (scene.textures.exists(key)) return key;

  const canvas = scene.textures.createCanvas(key, size, size);
  if (!canvas) return fallbackKey ?? key;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${Math.floor(size * 0.85)}px ${EMOJI_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(glyph, size / 2, size / 2);
  canvas.refresh();

  const imageData = ctx.getImageData(0, 0, size, size).data;
  if (isEmojiRenderEmpty(imageData) && fallbackKey && scene.textures.exists(fallbackKey)) {
    scene.textures.remove(key);
    return fallbackKey;
  }

  return key;
}
```

- [ ] **Step 4: Run test, verify pass**

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/utils/emoji-texture.ts packages/client/src/features/arcade-games/hori-bubble/utils/emoji-texture.test.ts
git commit -m "feat(hori-bubble): emoji-to-texture helper with fallback detection"
```

---

### Task 7: PreloadScene + MenuScene skeleton

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/MenuScene.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts` (empty)
- Modify: `packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx`

- [ ] **Step 1: Create `PreloadScene.ts`** (loads nothing real yet — full asset load lands in later tasks. Placeholder so the scene chain works.)

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'Preload' }); }

  preload() {
    const cx = CANVAS.width / 2;
    const cy = CANVAS.height / 2;
    const bar = this.add.graphics();
    this.load.on('progress', (p: number) => {
      bar.clear().fillStyle(0xff6b6b, 1).fillRect(cx - 100, cy - 4, 200 * p, 8);
    });
    this.load.on('complete', () => bar.destroy());
    // No real assets yet.
  }

  create() {
    this.scene.start('Menu');
  }
}
```

- [ ] **Step 2: Create `MenuScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';
import { loadHighScore } from '../config/storage';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  create() {
    const cx = CANVAS.width / 2;
    this.add.text(cx, 140, '호리 버블', {
      fontSize: '48px', color: '#fef3c7', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 200, 'Hori Bubble', {
      fontSize: '20px', color: '#fca5a5',
    }).setOrigin(0.5);

    const hi = loadHighScore();
    this.add.text(cx, 260, `HI SCORE  ${hi.toString().padStart(6, '0')}`, {
      fontSize: '16px', color: '#fbbf24',
    }).setOrigin(0.5);

    const tap = this.add.text(cx, 440, 'TAP TO START', {
      fontSize: '22px', color: '#fff',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: tap, alpha: 0.3, yoyo: true, repeat: -1, duration: 700,
    });

    this.input.once('pointerdown', () => this.scene.start('Game'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
  }
}
```

- [ ] **Step 3: Create empty `GameScene.ts`** (so menu transition doesn't crash)

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  create() {
    this.add.text(CANVAS.width / 2, CANVAS.height / 2, 'TODO', {
      fontSize: '32px', color: '#fff',
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 4: Wire scenes into game config**

Edit `HoriBubbleGame.tsx` — replace `scene: []` with:

```typescript
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
// …
scene: [PreloadScene, MenuScene, GameScene],
```

- [ ] **Step 5: Manual dev-server verification**

```bash
pnpm dev
```

Visit `/games/hori-bubble`. Expected: Menu with title, high score, pulsing "TAP TO START". Tap/click → "TODO" screen.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/scenes/ packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx
git commit -m "feat(hori-bubble): Preload/Menu/Game scene skeleton"
```

---

## Chunk 2: Core Physics — Hori Player + Platforms

### Task 8: HoriPlayer logic module (pure state machine)

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayerLogic.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayerLogic.test.ts`

Design: `HoriPlayerLogic` holds state + timers + input → effect translation. Phaser-free. `HoriPlayer` (next task) extends `Phaser.Physics.Arcade.Sprite` and composes this logic module.

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { HoriPlayerLogic } from './HoriPlayerLogic';

let logic: HoriPlayerLogic;
beforeEach(() => { logic = new HoriPlayerLogic(); });

describe('HoriPlayerLogic - state transitions', () => {
  it('starts in IDLE', () => {
    expect(logic.state).toBe('IDLE');
  });

  it('transitions to WALK on horizontal input', () => {
    logic.update({ left: false, right: true, jump: false, blow: false, onGround: true }, 16);
    expect(logic.state).toBe('WALK');
    expect(logic.facing).toBe('right');
  });

  it('transitions to JUMP on jump input when on ground', () => {
    logic.update({ left: false, right: false, jump: true, blow: false, onGround: true }, 16);
    expect(logic.state).toBe('JUMP');
    expect(logic.jumpRequested).toBe(true);
  });

  it('variable jump: releasing jump mid-air clamps upward velocity', () => {
    logic.update({ left: false, right: false, jump: true, blow: false, onGround: true }, 16);
    logic.notifyJumped();
    expect(logic.wantsJumpCutoff(-300)).toBe(false);  // still holding
    logic.update({ left: false, right: false, jump: false, blow: false, onGround: false }, 16);
    expect(logic.wantsJumpCutoff(-300)).toBe(true);   // released
    expect(logic.wantsJumpCutoff(-100)).toBe(false);  // already slower than cutoff
  });

  it('blow has cooldown', () => {
    logic.update({ left: false, right: false, jump: false, blow: true, onGround: true }, 16);
    expect(logic.blowRequested).toBe(true);
    logic.notifyBlew();
    logic.update({ left: false, right: false, jump: false, blow: true, onGround: true }, 16);
    expect(logic.blowRequested).toBe(false);          // still cooling down
    logic.update({ left: false, right: false, jump: false, blow: true, onGround: true }, 300);
    expect(logic.blowRequested).toBe(true);           // cooldown elapsed
  });

  it('hurt triggers invulnerability', () => {
    logic.notifyHurt();
    expect(logic.state).toBe('HURT');
    expect(logic.isInvulnerable()).toBe(true);
    logic.update({ left: false, right: false, jump: false, blow: false, onGround: true }, 1500);
    expect(logic.isInvulnerable()).toBe(false);
    expect(logic.state).toBe('IDLE');
  });

  it('cannot be hurt while invulnerable', () => {
    logic.notifyHurt();
    const firstHurtAt = logic.lastHurtAt;
    logic.notifyHurt();
    expect(logic.lastHurtAt).toBe(firstHurtAt);
  });

  it('facing persists when idle', () => {
    logic.update({ left: false, right: true, jump: false, blow: false, onGround: true }, 16);
    logic.update({ left: false, right: false, jump: false, blow: false, onGround: true }, 16);
    expect(logic.facing).toBe('right');
    expect(logic.state).toBe('IDLE');
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

- [ ] **Step 3: Implement `HoriPlayerLogic.ts`**

```typescript
import { BUBBLE } from '../config/bubbles';
import { HORI } from '../config/hori';
import { PHYSICS } from '../config/physics';

export type HoriState = 'IDLE' | 'WALK' | 'JUMP' | 'FALL' | 'BLOW' | 'HURT';
export type Facing = 'left' | 'right';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  blow: boolean;
  onGround: boolean;
}

export class HoriPlayerLogic {
  state: HoriState = 'IDLE';
  facing: Facing = 'right';
  jumpRequested = false;
  blowRequested = false;
  lastHurtAt = -Infinity;
  private now = 0;
  private lastBlowAt = -Infinity;
  private jumpHeld = false;
  private jumpLaunched = false;

  update(input: PlayerInput, deltaMs: number): void {
    this.now += deltaMs;
    this.jumpRequested = false;
    this.blowRequested = false;

    // HURT timeout
    if (this.state === 'HURT' && this.now - this.lastHurtAt >= HORI.invulnerabilityMs) {
      this.state = 'IDLE';
    }

    if (this.state === 'HURT') {
      return;
    }

    // Facing
    if (input.left) this.facing = 'left';
    else if (input.right) this.facing = 'right';

    // Jump request
    if (input.jump && !this.jumpHeld && input.onGround) {
      this.jumpRequested = true;
      this.state = 'JUMP';
      this.jumpLaunched = false;
    }
    this.jumpHeld = input.jump;

    // Blow request (with cooldown)
    if (input.blow && this.now - this.lastBlowAt >= BUBBLE.cooldownMs) {
      this.blowRequested = true;
      this.state = 'BLOW';
    }

    // Movement / ground states
    if (this.state !== 'BLOW' && this.state !== 'JUMP') {
      if (!input.onGround) {
        this.state = 'FALL';
      } else if (input.left || input.right) {
        this.state = 'WALK';
      } else {
        this.state = 'IDLE';
      }
    } else if (this.state === 'JUMP' && input.onGround && this.jumpLaunched) {
      this.state = input.left || input.right ? 'WALK' : 'IDLE';
    }
  }

  notifyJumped(): void {
    this.jumpLaunched = true;
  }

  notifyBlew(): void {
    this.lastBlowAt = this.now;
  }

  notifyHurt(): void {
    if (this.isInvulnerable()) return;
    this.state = 'HURT';
    this.lastHurtAt = this.now;
  }

  isInvulnerable(): boolean {
    return this.now - this.lastHurtAt < HORI.invulnerabilityMs;
  }

  wantsJumpCutoff(velocityY: number): boolean {
    return !this.jumpHeld
      && velocityY < PHYSICS.variableJumpCutoffVy
      && this.state !== 'HURT';
  }
}
```

- [ ] **Step 4: Run test, verify pass**

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayerLogic.ts packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayerLogic.test.ts
git commit -m "feat(hori-bubble): HoriPlayerLogic state machine"
```

---

### Task 9: HoriPlayer Phaser sprite + PreloadScene sprite load

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayer.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Extend `PreloadScene` to load existing Hori sprites**

Append inside `preload()`:

```typescript
import { HORI_SPRITE_KEYS } from '../config/hori';
import { assetUrl } from '../config/canvas';
// …
const horiStates = [
  { key: HORI_SPRITE_KEYS.idle, state: 'idle' },
  { key: HORI_SPRITE_KEYS.run, state: 'run' },
  { key: HORI_SPRITE_KEYS.jump, state: 'jump' },
  { key: HORI_SPRITE_KEYS.hurt, state: 'hurt' },
  { key: HORI_SPRITE_KEYS.celebrate, state: 'celebrate' },
];
for (const { key, state } of horiStates) {
  for (let i = 1; i <= 4; i++) {
    this.load.image(`${key}-${i}`, assetUrl(`/mascot/hori/${state}/${state}-frame-${i}.png`));
  }
}
```

(`blow` sprite is added in Task 30 once generated; for now use `run` frames as a placeholder in Step 3.)

- [ ] **Step 2: Register animations in PreloadScene.create()**

```typescript
import { HORI_ANIM_KEYS } from '../config/hori';
// …
const makeAnim = (animKey: string, spriteKey: string, frameRate: number, repeat: number) => {
  if (this.anims.exists(animKey)) return;
  this.anims.create({
    key: animKey,
    frames: [1,2,3,4].map(i => ({ key: `${spriteKey}-${i}` })),
    frameRate, repeat,
  });
};
makeAnim(HORI_ANIM_KEYS.idle, HORI_SPRITE_KEYS.idle, 6, -1);
makeAnim(HORI_ANIM_KEYS.walk, HORI_SPRITE_KEYS.run, 10, -1);  // run re-used
makeAnim(HORI_ANIM_KEYS.jump, HORI_SPRITE_KEYS.jump, 10, 0);
makeAnim(HORI_ANIM_KEYS.hurt, HORI_SPRITE_KEYS.hurt, 8, 0);
makeAnim(HORI_ANIM_KEYS.celebrate, HORI_SPRITE_KEYS.celebrate, 8, -1);
makeAnim(HORI_ANIM_KEYS.blow, HORI_SPRITE_KEYS.run, 12, 0);   // placeholder; real blow arrives in Task 30
```

- [ ] **Step 3: Create `HoriPlayer.ts`**

```typescript
import Phaser from 'phaser';
import { HoriPlayerLogic, type PlayerInput, type HoriState } from './HoriPlayerLogic';
import { HORI, HORI_ANIM_KEYS, HORI_SPRITE_KEYS } from '../config/hori';
import { PHYSICS } from '../config/physics';
import { CANVAS } from '../config/canvas';

export class HoriPlayer extends Phaser.Physics.Arcade.Sprite {
  readonly logic = new HoriPlayerLogic();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, `${HORI_SPRITE_KEYS.idle}-1`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);    // vertical wrap, not bounds
    this.setMaxVelocity(PHYSICS.walkSpeedBoost * 1.5, PHYSICS.maxFallSpeed);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setDragX(PHYSICS.drag);
    body.setSize(this.width - HORI.hitboxInsetPx * 2, this.height - HORI.hitboxInsetPx * 2);
    this.play(HORI_ANIM_KEYS.idle);
  }

  applyInput(input: PlayerInput, deltaMs: number, walkSpeed: number, jumpVelocity: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    this.logic.update({ ...input, onGround }, deltaMs);

    // Horizontal movement
    if (input.left) body.setAccelerationX(-PHYSICS.acceleration);
    else if (input.right) body.setAccelerationX(PHYSICS.acceleration);
    else body.setAccelerationX(0);
    const capped = Math.max(-walkSpeed, Math.min(walkSpeed, body.velocity.x));
    body.setVelocityX(capped);

    // Jump launch
    if (this.logic.jumpRequested) {
      body.setVelocityY(jumpVelocity);
      this.logic.notifyJumped();
      this.play(HORI_ANIM_KEYS.jump, true);
    }

    // Variable jump cutoff
    if (this.logic.wantsJumpCutoff(body.velocity.y)) {
      body.setVelocityY(PHYSICS.variableJumpCutoffVy);
    }

    // Facing flip
    this.setFlipX(this.logic.facing === 'left');

    // Animation per state (only if changed)
    this.syncAnimation();

    // Hurt flash
    this.setAlpha(this.logic.isInvulnerable()
      ? 0.4 + 0.6 * (Math.floor(performance.now() / 80) % 2)
      : 1);
  }

  private syncAnimation() {
    const s: HoriState = this.logic.state;
    const next = ({
      IDLE: HORI_ANIM_KEYS.idle,
      WALK: HORI_ANIM_KEYS.walk,
      JUMP: HORI_ANIM_KEYS.jump,
      FALL: HORI_ANIM_KEYS.jump,
      BLOW: HORI_ANIM_KEYS.blow,
      HURT: HORI_ANIM_KEYS.hurt,
    } as const)[s];
    if (this.anims.getName() !== next) this.play(next, true);
  }

  wrapVertical() {
    if (this.y > CANVAS.height) this.y = CANVAS.playfieldTop;
    else if (this.y < CANVAS.playfieldTop) this.y = CANVAS.height;
  }
}
```

- [ ] **Step 4: Wire into `GameScene`**

Replace `GameScene` create with:

```typescript
import { parseTilemap } from '../utils/tilemap';
import { HoriPlayer } from '../entities/HoriPlayer';
import level01 from '../data/levels/level-01.json';
import { CANVAS } from '../config/canvas';
import { PHYSICS } from '../config/physics';

// field:
private player!: HoriPlayer;
private platforms!: Phaser.Physics.Arcade.StaticGroup;

create() {
  this.cameras.main.setBackgroundColor('#0f172a');
  const parsed = parseTilemap(level01.tilemap);
  this.platforms = this.physics.add.staticGroup();
  for (const p of parsed.platforms) {
    const rect = this.add.rectangle(p.x + p.width / 2, p.y + p.height / 2, p.width, p.height, 0xf59e0b);
    this.physics.add.existing(rect, true);
    this.platforms.add(rect);
  }
  this.player = new HoriPlayer(this, parsed.spawn.x, parsed.spawn.y);
  this.physics.add.collider(this.player, this.platforms);
}

update(_t: number, dt: number) {
  const kb = this.input.keyboard!;
  const input = {
    left: kb.addKey('LEFT').isDown || kb.addKey('A').isDown,
    right: kb.addKey('RIGHT').isDown || kb.addKey('D').isDown,
    jump: kb.addKey('SPACE').isDown || kb.addKey('UP').isDown,
    blow: kb.addKey('Z').isDown || kb.addKey('X').isDown,
    onGround: false,  // overridden in applyInput via body.blocked
  };
  this.player.applyInput(input, dt, PHYSICS.walkSpeed, PHYSICS.jumpVelocity);
  this.player.wrapVertical();
}
```

- [ ] **Step 5: Manual dev-server verification**

`pnpm dev` → `/games/hori-bubble` → tap start → Hori spawns on Level 1. Walk left/right with arrows, jump with Space. Walking animation plays. Hori falls through bottom → reappears on top. Platforms block movement.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/HoriPlayer.ts packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): HoriPlayer sprite with movement/jump/animations"
```

---

## Chunk 3: Bubble System

### Task 10: BubbleLogic state machine

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/BubbleLogic.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/BubbleLogic.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BubbleLogic } from './BubbleLogic';
import { BUBBLE } from '../config/bubbles';

let b: BubbleLogic;
beforeEach(() => { b = new BubbleLogic('normal', 'right'); });

describe('BubbleLogic', () => {
  it('starts SPAWNED moving in facing direction', () => {
    expect(b.state).toBe('SPAWNED');
    expect(b.vx).toBeGreaterThan(0);
  });

  it('transitions SPAWNED → FLOATING after spawnTravelMs', () => {
    b.update(BUBBLE.spawnTravelMs);
    expect(b.state).toBe('FLOATING');
    expect(b.vx).toBe(0);
  });

  it('auto-pops after lifetime', () => {
    b.update(BUBBLE.lifetimeMs + 1);
    expect(b.state).toBe('POPPED');
    expect(b.hadTrappedEnemy).toBe(false);
  });

  it('traps an enemy when in FLOATING state', () => {
    b.update(BUBBLE.spawnTravelMs);
    const trapped = b.tryTrap();
    expect(trapped).toBe(true);
    expect(b.state).toBe('TRAPPED');
  });

  it('does not trap in SPAWNED state', () => {
    expect(b.tryTrap()).toBe(false);
  });

  it('TRAPPED enemy escapes after trapEscapeMs', () => {
    b.update(BUBBLE.spawnTravelMs);
    b.tryTrap();
    b.update(BUBBLE.trapEscapeMs + 1);
    expect(b.state).toBe('FLOATING');   // enemy escaped, bubble continues
    expect(b.hadTrappedEnemy).toBe(false);
  });

  it('pop(true) sets hadTrappedEnemy=true and POPPED', () => {
    b.update(BUBBLE.spawnTravelMs);
    b.tryTrap();
    b.pop();
    expect(b.state).toBe('POPPED');
    expect(b.hadTrappedEnemy).toBe(true);
  });

  it('pop() on non-trapped sets hadTrappedEnemy=false', () => {
    b.update(BUBBLE.spawnTravelMs);
    b.pop();
    expect(b.state).toBe('POPPED');
    expect(b.hadTrappedEnemy).toBe(false);
  });

  it('trap timer is independent from float timer — float expiring while trapped still pops and lets enemy escape via pop', () => {
    // bubble at 7.9s alive, then trapped, then 200ms later floatTimer hits 8s
    b.update(BUBBLE.lifetimeMs - 100);
    b.update(50); // now FLOATING for a while, still not popped
    expect(b.state).toBe('FLOATING');
    b.tryTrap();
    b.update(100);  // lifetime exceeded — bubble must pop
    expect(b.state).toBe('POPPED');
    // enemy was trapped → counts as fruit-eligible
    expect(b.hadTrappedEnemy).toBe(true);
  });

  it('warning flag triggers in last 1s of trap', () => {
    b.update(BUBBLE.spawnTravelMs);
    b.tryTrap();
    expect(b.isTrapWarning()).toBe(false);
    b.update(BUBBLE.trapEscapeMs - BUBBLE.trapWarningMs + 10);
    expect(b.isTrapWarning()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

- [ ] **Step 3: Implement `BubbleLogic.ts`**

```typescript
import { BUBBLE, type BubbleKind } from '../config/bubbles';
import type { Facing } from './HoriPlayerLogic';

export type BubbleState = 'SPAWNED' | 'FLOATING' | 'TRAPPED' | 'POPPED';

export class BubbleLogic {
  state: BubbleState = 'SPAWNED';
  vx: number;
  vy = 0;
  hadTrappedEnemy = false;
  private floatTimer = 0;     // total ms alive
  private stateTimer = 0;     // ms in current state (SPAWNED/TRAPPED)

  constructor(readonly kind: BubbleKind, facing: Facing) {
    this.vx = facing === 'right' ? BUBBLE.spawnSpeed : -BUBBLE.spawnSpeed;
  }

  update(deltaMs: number): void {
    if (this.state === 'POPPED') return;
    this.floatTimer += deltaMs;
    this.stateTimer += deltaMs;

    // Global lifetime — always wins
    if (this.floatTimer >= BUBBLE.lifetimeMs) {
      // If we were TRAPPED we credit as fruit-eligible (enemy was defeated when bubble popped by time)
      // Per spec §4.2: "floatTimer가 항상 우선 · 적 과일 변환"
      if (this.state === 'TRAPPED') this.hadTrappedEnemy = true;
      this.state = 'POPPED';
      this.vx = 0;
      this.vy = 0;
      return;
    }

    if (this.state === 'SPAWNED' && this.stateTimer >= BUBBLE.spawnTravelMs) {
      this.transition('FLOATING');
      this.vx = 0;
      this.vy = BUBBLE.floatUpSpeed;
    } else if (this.state === 'TRAPPED' && this.stateTimer >= BUBBLE.trapEscapeMs) {
      // Enemy escapes; bubble returns to FLOATING
      this.hadTrappedEnemy = false;
      this.transition('FLOATING');
    }
  }

  tryTrap(): boolean {
    if (this.state !== 'FLOATING') return false;
    this.transition('TRAPPED');
    this.vx = 0;
    this.vy = BUBBLE.floatUpSpeed * 0.3;
    return true;
  }

  pop(): void {
    if (this.state === 'POPPED') return;
    this.hadTrappedEnemy = this.state === 'TRAPPED';
    this.state = 'POPPED';
    this.vx = 0;
    this.vy = 0;
  }

  isTrapWarning(): boolean {
    return this.state === 'TRAPPED'
      && this.stateTimer >= BUBBLE.trapEscapeMs - BUBBLE.trapWarningMs;
  }

  private transition(next: BubbleState) {
    this.state = next;
    this.stateTimer = 0;
  }
}
```

- [ ] **Step 4: Run test, verify pass**

Expected: 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/BubbleLogic.ts packages/client/src/features/arcade-games/hori-bubble/entities/BubbleLogic.test.ts
git commit -m "feat(hori-bubble): BubbleLogic with independent float/trap timers"
```

---

### Task 11: Bubble Phaser sprite + Hori fires bubbles

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/Bubble.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `Bubble.ts`**

```typescript
import Phaser from 'phaser';
import { BubbleLogic } from './BubbleLogic';
import { BUBBLE, type BubbleKind } from '../config/bubbles';
import { VISUAL_ASSETS } from '../config/assets';
import { ensureEmojiTexture } from '../utils/emoji-texture';
import type { Facing } from './HoriPlayerLogic';

export class Bubble extends Phaser.Physics.Arcade.Sprite {
  readonly logic: BubbleLogic;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: BubbleKind, facing: Facing) {
    const asset = VISUAL_ASSETS.bubbles[kind];
    const key = ensureEmojiTexture(scene, asset.glyph, asset.size);
    super(scene, x, y, key);
    this.logic = new BubbleLogic(kind, facing);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(this.logic.vx, this.logic.vy);
    body.setSize(asset.size - 8, asset.size - 8);
  }

  advance(deltaMs: number) {
    this.logic.update(deltaMs);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.logic.vx, this.logic.vy);

    if (this.logic.isTrapWarning()) {
      const flash = Math.floor(performance.now() / 120) % 2;
      this.setTint(flash ? 0xff6b6b : 0xffffff);
    } else if (this.logic.state === 'TRAPPED') {
      this.setTint(0xfca5a5);
    } else {
      this.clearTint();
    }

    if (this.logic.state === 'POPPED' && this.active) {
      this.playPopAndDestroy();
    }
  }

  private playPopAndDestroy() {
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 1, to: 0 },
      duration: BUBBLE.popAnimMs,
      onComplete: () => this.destroy(),
    });
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
  }
}
```

- [ ] **Step 2: Wire bubble spawn in GameScene**

Add field and helpers:

```typescript
private bubbles!: Phaser.Physics.Arcade.Group;

create() {
  // … existing …
  this.bubbles = this.physics.add.group({ runChildUpdate: false });
  this.physics.add.collider(this.bubbles, this.platforms);
}

private spawnBubble() {
  if (this.bubbles.getLength() >= BUBBLE.maxConcurrent) return;
  const b = new Bubble(
    this,
    this.player.x + (this.player.logic.facing === 'right' ? BUBBLE.spawnOffsetPx : -BUBBLE.spawnOffsetPx),
    this.player.y,
    'normal',
    this.player.logic.facing,
  );
  this.bubbles.add(b);
}

update(_t: number, dt: number) {
  // … existing input code …
  if (this.player.logic.blowRequested) {
    this.spawnBubble();
    this.player.logic.notifyBlew();
  }
  this.bubbles.getChildren().forEach(c => (c as Bubble).advance(dt));
}
```

Import `Bubble` and `BUBBLE`.

- [ ] **Step 3: Manual verification**

`pnpm dev` → press `Z` → bubble spawns from Hori, flies forward briefly, then floats up. After ~8s auto-pops. Bubbles collide with platforms.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/Bubble.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): Bubble sprite, Hori fires on Z"
```

---

### Task 12: Bubble-as-platform (jump on bubble)

**Files:**
- Modify: `packages/client/src/features/arcade-games/hori-bubble/entities/Bubble.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: In `Bubble.ts`, add a `pressedFromAbove` helper and delayed pop**

Add method:

```typescript
pressFromAbove(): void {
  // Delayed pop so the bounce reads visually
  this.scene.time.delayedCall(BUBBLE.jumpOffPopDelayMs, () => {
    this.logic.pop();
  });
}
```

- [ ] **Step 2: In `GameScene.create()`, add player↔bubble overlap**

```typescript
this.physics.add.overlap(this.player, this.bubbles, (player, bubble) => {
  const b = bubble as Bubble;
  const p = player as HoriPlayer;
  if (b.logic.state === 'POPPED') return;
  const body = p.body as Phaser.Physics.Arcade.Body;
  const comingFromAbove = body.velocity.y >= 0 && p.y < b.y;
  if (comingFromAbove) {
    body.setVelocityY(BUBBLE.jumpOffVy);
    b.pressFromAbove();
  }
});
```

- [ ] **Step 3: Manual verification**

`pnpm dev` → shoot a bubble, jump on it. Hori should bounce ~250 upward; bubble pops shortly after. Side-approach does not bounce.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/Bubble.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): bubble-as-platform bouncy jump"
```

---

## Chunk 4: Enemies

### Task 13: EnemyLogic base + Walker

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/EnemyLogic.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/EnemyLogic.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { WalkerLogic, JumperLogic, FloaterLogic, BossLogic } from './EnemyLogic';
import { ENEMY } from '../config/enemies';

describe('WalkerLogic', () => {
  it('starts ROAMING with requested direction speed', () => {
    const w = new WalkerLogic('right');
    expect(w.state).toBe('ROAMING');
    expect(w.vx).toBe(ENEMY.walker.speed);
  });

  it('reverse() flips direction after turn delay', () => {
    const w = new WalkerLogic('right');
    w.reverse();
    expect(w.vx).toBe(0);            // pausing
    w.update(ENEMY.walker.turnDelayMs + 1);
    expect(w.vx).toBe(-ENEMY.walker.speed);
  });

  it('trap() sets TRAPPED, untrap after trapDurationMs', () => {
    const w = new WalkerLogic('right');
    w.trap();
    expect(w.state).toBe('TRAPPED');
    expect(w.vx).toBe(0);
    w.update(ENEMY.trapDurationMs + 1);
    expect(w.state).toBe('ROAMING');
  });

  it('kill() sets FRUIT', () => {
    const w = new WalkerLogic('right');
    w.trap();
    w.kill();
    expect(w.state).toBe('FRUIT');
  });

  it('rage mode multiplies speed', () => {
    const w = new WalkerLogic('right');
    w.setRage(true);
    expect(w.vx).toBe(ENEMY.walker.speed * ENEMY.rageModeMultiplier);
  });
});

describe('JumperLogic', () => {
  it('requests jump at fixed interval', () => {
    const j = new JumperLogic();
    j.update(ENEMY.jumper.jumpIntervalMs + 1);
    expect(j.wantsJump).toBe(true);
    j.notifyJumped();
    j.update(10);
    expect(j.wantsJump).toBe(false);
  });
});

describe('FloaterLogic', () => {
  it('produces sinusoidal Y modulation', () => {
    const f = new FloaterLogic();
    const y0 = f.yOffset(0);
    const y1 = f.yOffset(500);
    expect(y0).toBeCloseTo(0, 5);
    expect(Math.abs(y1)).toBeGreaterThan(0);
  });

  it('pursues target with lerp', () => {
    const f = new FloaterLogic();
    f.setPosition(100, 200);
    f.steerToward(200, 200, 16);
    expect(f.vx).toBeGreaterThan(0);
  });
});

describe('BossLogic', () => {
  it('takes 5 hits to die', () => {
    const b = new BossLogic();
    for (let i = 0; i < 4; i++) {
      b.takeHit();
      expect(b.state).toBe('ROAMING');
    }
    b.takeHit();
    expect(b.state).toBe('FRUIT');
  });

  it('throws seeds at interval', () => {
    const b = new BossLogic();
    b.update(ENEMY.boss.seedThrowIntervalMs + 1);
    expect(b.wantsThrow).toBe(true);
    b.notifyThrew();
    expect(b.wantsThrow).toBe(false);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

- [ ] **Step 3: Implement `EnemyLogic.ts`**

```typescript
import { ENEMY } from '../config/enemies';

export type EnemyState = 'ROAMING' | 'TRAPPED' | 'FRUIT';

abstract class EnemyLogic {
  state: EnemyState = 'ROAMING';
  vx = 0;
  vy = 0;
  protected rage = false;
  protected now = 0;
  protected trappedAt = -Infinity;

  setRage(on: boolean) {
    this.rage = on;
    this.applyBaseVelocity();
  }

  trap() {
    if (this.state === 'FRUIT') return;
    this.state = 'TRAPPED';
    this.vx = 0;
    this.vy = 0;
    this.trappedAt = this.now;
  }

  kill() {
    this.state = 'FRUIT';
    this.vx = 0;
    this.vy = 0;
  }

  update(deltaMs: number) {
    this.now += deltaMs;
    if (this.state === 'TRAPPED' && this.now - this.trappedAt >= ENEMY.trapDurationMs) {
      this.state = 'ROAMING';
      this.applyBaseVelocity();
    }
    this.tick(deltaMs);
  }

  protected abstract applyBaseVelocity(): void;
  protected abstract tick(deltaMs: number): void;
}

export class WalkerLogic extends EnemyLogic {
  private direction: 1 | -1;
  private reverseUntil = -Infinity;

  constructor(initial: 'left' | 'right') {
    super();
    this.direction = initial === 'right' ? 1 : -1;
    this.applyBaseVelocity();
  }

  reverse() {
    this.vx = 0;
    this.reverseUntil = this.now + ENEMY.walker.turnDelayMs;
    this.direction = (this.direction * -1) as 1 | -1;
  }

  protected applyBaseVelocity() {
    if (this.state !== 'ROAMING') return;
    const base = ENEMY.walker.speed * (this.rage ? ENEMY.rageModeMultiplier : 1);
    this.vx = this.direction * base;
  }

  protected tick(_dt: number) {
    if (this.state !== 'ROAMING') return;
    if (this.now >= this.reverseUntil) this.applyBaseVelocity();
  }
}

export class JumperLogic extends EnemyLogic {
  wantsJump = false;
  private lastJumpAt = 0;

  protected applyBaseVelocity() { this.vx = 0; }

  protected tick(_dt: number) {
    if (this.state !== 'ROAMING') return;
    if (this.now - this.lastJumpAt >= ENEMY.jumper.jumpIntervalMs) this.wantsJump = true;
  }

  notifyJumped() {
    this.wantsJump = false;
    this.lastJumpAt = this.now;
    this.vy = ENEMY.jumper.jumpVy;
  }
}

export class FloaterLogic extends EnemyLogic {
  private x = 0;
  private y = 0;

  setPosition(x: number, y: number) { this.x = x; this.y = y; }

  protected applyBaseVelocity() {}

  protected tick(_dt: number) {}

  yOffset(tMs: number): number {
    return Math.sin(tMs / 1000 * 2 * Math.PI * ENEMY.floater.sinFrequencyHz) * ENEMY.floater.sinAmplitudePx;
  }

  steerToward(tx: number, _ty: number, _dt: number) {
    const dir = Math.sign(tx - this.x) || 1;
    this.vx = dir * ENEMY.floater.speed * (this.rage ? ENEMY.rageModeMultiplier : 1);
  }
}

export class BossLogic extends EnemyLogic {
  hitsTaken = 0;
  wantsThrow = false;
  private lastThrowAt = 0;

  takeHit() {
    this.hitsTaken++;
    if (this.hitsTaken >= ENEMY.boss.hitsToKill) this.state = 'FRUIT';
  }

  protected applyBaseVelocity() {
    this.vx = ENEMY.boss.speed * (this.rage ? ENEMY.rageModeMultiplier : 1);
  }

  protected tick(_dt: number) {
    if (this.state !== 'ROAMING') return;
    if (this.now - this.lastThrowAt >= ENEMY.boss.seedThrowIntervalMs) this.wantsThrow = true;
  }

  notifyThrew() {
    this.wantsThrow = false;
    this.lastThrowAt = this.now;
  }
}
```

- [ ] **Step 4: Run, verify pass**

Expected: ~11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/EnemyLogic.ts packages/client/src/features/arcade-games/hori-bubble/entities/EnemyLogic.test.ts
git commit -m "feat(hori-bubble): EnemyLogic base with 4 enemy variants"
```

---

### Task 14: Enemy Phaser sprites + integration

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/Enemy.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/WalkerEnemy.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/JumperEnemy.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/FloaterEnemy.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/spawn.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `Enemy.ts` (base)**

```typescript
import Phaser from 'phaser';
import type { EnemyLogic } from './EnemyLogic';
import { VISUAL_ASSETS } from '../config/assets';
import { ensureEmojiTexture } from '../utils/emoji-texture';
import { ENEMY, type EnemyKind } from '../config/enemies';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  abstract readonly logic: EnemyLogic;
  abstract readonly kind: EnemyKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind) {
    const asset = VISUAL_ASSETS.enemies[kind];
    if (asset.kind !== 'emoji') throw new Error('expected emoji asset');
    const key = ensureEmojiTexture(scene, asset.glyph, asset.size);
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(asset.size - ENEMY.hitboxInsetPx * 2, asset.size - ENEMY.hitboxInsetPx * 2);
  }

  abstract advance(dt: number, playerX: number, playerY: number): void;

  syncFromLogic() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(this.logic.vx, this.logic.vy);
    if (this.logic.state === 'TRAPPED') this.setTint(0xfca5a5);
    else if (this.logic.state === 'FRUIT') this.setTint(0xfde68a);
    else this.clearTint();
  }
}
```

- [ ] **Step 2: Create `WalkerEnemy.ts`**

```typescript
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { WalkerLogic } from './EnemyLogic';

export class WalkerEnemy extends Enemy {
  readonly kind = 'walker' as const;
  readonly logic: WalkerLogic;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: 'left' | 'right' = 'right') {
    super(scene, x, y, 'walker');
    this.logic = new WalkerLogic(dir);
  }

  advance(dt: number) {
    this.logic.update(dt);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.logic.state === 'ROAMING' && (body.blocked.left || body.blocked.right)) {
      this.logic.reverse();
    }
    this.syncFromLogic();
    this.setFlipX(this.logic.vx < 0);
  }
}
```

- [ ] **Step 3: Create `JumperEnemy.ts`**

```typescript
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { JumperLogic } from './EnemyLogic';
import { ENEMY } from '../config/enemies';

export class JumperEnemy extends Enemy {
  readonly kind = 'jumper' as const;
  readonly logic = new JumperLogic();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'jumper');
  }

  advance(dt: number) {
    this.logic.update(dt);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.logic.wantsJump && (body.blocked.down || body.touching.down)) {
      body.setVelocityY(ENEMY.jumper.jumpVy);
      this.logic.notifyJumped();
    }
    body.setVelocityX(this.logic.vx);
  }
}
```

- [ ] **Step 4: Create `FloaterEnemy.ts`**

```typescript
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { FloaterLogic } from './EnemyLogic';

export class FloaterEnemy extends Enemy {
  readonly kind = 'floater' as const;
  readonly logic = new FloaterLogic();
  private spawnY: number;
  private age = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'floater');
    this.spawnY = y;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  advance(dt: number, px: number, py: number) {
    this.age += dt;
    this.logic.setPosition(this.x, this.y);
    this.logic.steerToward(px, py, dt);
    this.logic.update(dt);
    this.syncFromLogic();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.logic.vx);
    this.y = this.spawnY + this.logic.yOffset(this.age);
  }
}
```

- [ ] **Step 5: Create `spawn.ts`**

```typescript
import Phaser from 'phaser';
import type { EnemySpawn } from '../data/levels/level-schema';
import { WalkerEnemy } from '../entities/WalkerEnemy';
import { JumperEnemy } from '../entities/JumperEnemy';
import { FloaterEnemy } from '../entities/FloaterEnemy';
import type { Enemy } from '../entities/Enemy';
import { CANVAS } from '../config/canvas';

export function spawnEnemies(scene: Phaser.Scene, spawns: EnemySpawn[]): Enemy[] {
  const enemies: Enemy[] = [];
  for (const s of spawns) {
    const cx = s.x * CANVAS.tileSize + CANVAS.tileSize / 2;
    const cy = CANVAS.playfieldTop + s.y * CANVAS.tileSize + CANVAS.tileSize / 2;
    switch (s.type) {
      case 'walker':
        enemies.push(new WalkerEnemy(scene, cx, cy, s.direction ?? 'right')); break;
      case 'jumper':
        enemies.push(new JumperEnemy(scene, cx, cy)); break;
      case 'floater':
        enemies.push(new FloaterEnemy(scene, cx, cy)); break;
      case 'boss':
        // wired in Task 20
        break;
    }
  }
  return enemies;
}
```

- [ ] **Step 6: Wire into GameScene**

```typescript
private enemies: Enemy[] = [];

create() {
  // …
  this.enemies = spawnEnemies(this, (level01 as unknown as LevelData).enemies);
  this.enemies.forEach(e => this.physics.add.collider(e, this.platforms));

  // bubble ↔ enemy overlap — track explicit pairing so the trapped enemy
  // stays with its own bubble (not whichever trapped enemy happens to be
  // geometrically closest, which breaks with multiple concurrent traps).
  this.physics.add.overlap(this.bubbles, this.enemies as any, (bubble, enemy) => {
    const b = bubble as Bubble;
    const e = enemy as Enemy;
    if (b.logic.state === 'FLOATING' && e.logic.state === 'ROAMING') {
      if (b.logic.tryTrap()) {
        e.logic.trap();
        b.trappedEnemy = e;                 // explicit pairing
        e.x = b.x; e.y = b.y;
      }
    }
  });

  // player ↔ enemy overlap
  this.physics.add.overlap(this.player, this.enemies as any, (_p, enemy) => {
    const e = enemy as Enemy;
    if (e.logic.state === 'ROAMING' && !this.player.logic.isInvulnerable()) {
      this.player.logic.notifyHurt();
      // lose life in Task 17
    }
  });
}

update(_t: number, dt: number) {
  // …
  this.enemies.forEach(e => e.advance(dt, this.player.x, this.player.y));
  // Keep trapped enemies visually pinned to their bubble via explicit pair link.
  this.bubbles.getChildren().forEach(c => {
    const b = c as Bubble;
    if (b.logic.state === 'TRAPPED' && b.trappedEnemy) {
      b.trappedEnemy.x = b.x;
      b.trappedEnemy.y = b.y;
    }
    // Bubble reverted TRAPPED→FLOATING (enemy escaped via timer) — release pair.
    if (b.logic.state === 'FLOATING' && b.trappedEnemy) {
      b.trappedEnemy = null;
    }
  });
}
```

Also add `trappedEnemy: Enemy | null = null;` public field to `Bubble.ts` (from Task 11):

```typescript
// entities/Bubble.ts — add after `readonly logic: BubbleLogic;`
trappedEnemy: Enemy | null = null;
```

- [ ] **Step 7: Manual verify**

`pnpm dev` → Level 1 spawns 2 walkers. Walkers walk, reverse at edges. Fire bubbles → when bubble contacts walker it traps. Player touching a free walker triggers hurt flash.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/ packages/client/src/features/arcade-games/hori-bubble/utils/spawn.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): walker/jumper/floater enemies + bubble-trap integration"
```

---

## Chunk 5: Game Flow — Fruit, Score, HUD, Lives, Game Over

### Task 15: Fruit entity + pop-to-fruit conversion

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/Fruit.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `Fruit.ts`**

```typescript
import Phaser from 'phaser';
import { VISUAL_ASSETS } from '../config/assets';
import { ensureEmojiTexture } from '../utils/emoji-texture';

export type FruitGlyph = string;

export class Fruit extends Phaser.Physics.Arcade.Sprite {
  readonly isExtend: boolean;
  readonly letter: string | null;

  constructor(scene: Phaser.Scene, x: number, y: number, glyph: FruitGlyph, opts: { isExtend?: boolean; letter?: string } = {}) {
    const size = opts.isExtend ? VISUAL_ASSETS.enemies.extend.size : VISUAL_ASSETS.enemies.fruit.size;
    const key = ensureEmojiTexture(scene, glyph, size);
    super(scene, x, y, key);
    this.isExtend = !!opts.isExtend;
    this.letter = opts.letter ?? null;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setBounce(0.3);
    body.setVelocity((Math.random() - 0.5) * 100, -80);
    body.setSize(size - 8, size - 8);
  }

  static random(scene: Phaser.Scene, x: number, y: number): Fruit {
    const glyphs = VISUAL_ASSETS.enemies.fruit.glyphs;
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
    return new Fruit(scene, x, y, glyph);
  }
}
```

- [ ] **Step 2: In GameScene, pop-to-fruit when bubble with trapped enemy pops**

Inside `update()`, after advancing bubbles, spawn fruit when `b.logic.state === 'POPPED' && b.logic.hadTrappedEnemy`:

```typescript
private fruits!: Phaser.Physics.Arcade.Group;

create() {
  this.fruits = this.physics.add.group({ runChildUpdate: false });
  this.physics.add.collider(this.fruits, this.platforms);
  this.physics.add.overlap(this.player, this.fruits, (_p, f) => {
    this.onFruitCollected(f as Fruit);
    (f as Fruit).destroy();
  });
}

update(_t, dt) {
  // … advance bubbles
  this.bubbles.getChildren().forEach(c => {
    const b = c as Bubble;
    if (b.logic.state === 'POPPED' && b.logic.hadTrappedEnemy && !(b as any).__fruitSpawned) {
      (b as any).__fruitSpawned = true;
      this.spawnFruitAt(b.x, b.y);
      // also kill the trapped enemy
      const trappedEnemy = this.enemies.find(en => en.logic.state === 'TRAPPED');
      trappedEnemy?.logic.kill();
      trappedEnemy?.destroy();
      this.enemies = this.enemies.filter(en => en !== trappedEnemy);
    }
  });
}

private spawnFruitAt(x: number, y: number) {
  const f = Fruit.random(this, x, y);
  this.fruits.add(f);
}

private onFruitCollected(_f: Fruit) {
  // score bump lands in Task 16
}
```

Add `Fruit` import.

- [ ] **Step 3: Manual verify**

Trap walker → pop bubble → fruit drops with physics → Hori touches → fruit disappears.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/Fruit.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): fruit drop on bubble-with-enemy pop"
```

---

### Task 16: Rules module (score, combo, EXTEND)

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/rules.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/rules.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameRules } from './rules';
import { SCORE, RULES } from './config/rules';

let r: GameRules;
beforeEach(() => { r = new GameRules(); });

describe('GameRules - scoring', () => {
  it('adds trap score', () => {
    r.onTrap();
    expect(r.score).toBe(SCORE.trap);
  });

  it('adds combo when fruit collected within window', () => {
    r.onFruitCollected(0);
    r.onFruitCollected(RULES.comboWindowMs - 100);
    expect(r.score).toBe(SCORE.fruitCollect + SCORE.fruitCollectCombo);
    expect(r.combo).toBe(2);
  });

  it('resets combo after window', () => {
    r.onFruitCollected(0);
    r.onFruitCollected(RULES.comboWindowMs + 100);
    expect(r.combo).toBe(1);
    expect(r.score).toBe(SCORE.fruitCollect * 2);
  });

  it('multi-kill bonus', () => {
    r.onSpecialKill(3);
    expect(r.score).toBe(SCORE.specialMultiKill);
  });

  it('level clear bonus with time remaining', () => {
    r.onLevelClear(45);
    expect(r.score).toBe(SCORE.levelClearBase + 45 * SCORE.levelClearTimeMultiplier);
  });
});

describe('GameRules - EXTEND', () => {
  it('starts with empty progress', () => {
    expect(r.extendLetters).toEqual([]);
    expect(r.lives).toBe(RULES.startingLives);
  });

  it('collecting all 6 letters adds a life and resets', () => {
    r.onExtendLetter('E');
    r.onExtendLetter('X');
    r.onExtendLetter('T');
    r.onExtendLetter('E');
    r.onExtendLetter('N');
    r.onExtendLetter('D');
    expect(r.lives).toBe(RULES.startingLives + 1);
    expect(r.extendLetters).toEqual([]);
  });

  it('duplicate letter does not advance progress', () => {
    r.onExtendLetter('E');
    r.onExtendLetter('E');
    expect(r.extendLetters).toEqual(['E']);
  });

  it('does not exceed max lives', () => {
    r.setLivesForTest(RULES.maxLives - 1);
    for (const l of RULES.extendLetters) r.onExtendLetter(l);
    expect(r.lives).toBe(RULES.maxLives);
    for (const l of RULES.extendLetters) r.onExtendLetter(l);
    expect(r.lives).toBe(RULES.maxLives);
  });
});

describe('GameRules - lives', () => {
  it('onHurt decrements life', () => {
    r.onHurt();
    expect(r.lives).toBe(RULES.startingLives - 1);
  });

  it('isGameOver when lives hit 0', () => {
    for (let i = 0; i < RULES.startingLives; i++) r.onHurt();
    expect(r.isGameOver).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `rules.ts`**

```typescript
import { SCORE, RULES } from './config/rules';

export class GameRules {
  score = 0;
  lives = RULES.startingLives;
  extendLetters: string[] = [];
  combo = 0;
  isGameOver = false;
  private lastFruitAt = -Infinity;

  onTrap() { this.score += SCORE.trap; }

  onFruitCollected(tMs: number) {
    if (tMs - this.lastFruitAt <= RULES.comboWindowMs) {
      this.combo++;
      this.score += SCORE.fruitCollect + SCORE.fruitCollectCombo;
    } else {
      this.combo = 1;
      this.score += SCORE.fruitCollect;
    }
    this.lastFruitAt = tMs;
  }

  onEnemyToFruit() { this.score += SCORE.fruitFromEnemy; }

  onPowerUpPickup() { this.score += SCORE.powerupPickup; }

  onSpecialKill(_count: number) { this.score += SCORE.specialMultiKill; }

  onBossHit() { this.score += SCORE.bossHit; }

  onBossKill() { this.score += SCORE.bossKill; }

  onLevelClear(secondsRemaining: number) {
    this.score += SCORE.levelClearBase + secondsRemaining * SCORE.levelClearTimeMultiplier;
  }

  onExtendLetter(letter: string) {
    if (this.extendLetters.includes(letter)) return;
    this.extendLetters.push(letter);
    if (this.extendLetters.length === RULES.extendLetters.length) {
      if (this.lives < RULES.maxLives) this.lives++;
      this.extendLetters = [];
    }
  }

  onHurt() {
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives === 0) this.isGameOver = true;
  }

  setLivesForTest(n: number) { this.lives = n; }
}
```

- [ ] **Step 3: Run, verify pass**

Expected: ~12 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/rules.ts packages/client/src/features/arcade-games/hori-bubble/rules.test.ts
git commit -m "feat(hori-bubble): GameRules with score/combo/EXTEND/lives"
```

---

### Task 17: HUDScene + life loss + game over

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/HUDScene.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameOverScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx`

- [ ] **Step 1: Create `HUDScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';
import { RULES } from '../config/rules';

export interface HudState {
  score: number;
  lives: number;
  level: number;
  extendLetters: string[];
  timeLeftSec: number;
  hurryUp: boolean;
}

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private extendText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private hurryText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'HUD' }); }

  create() {
    const style = { fontSize: '16px', color: '#fef3c7', fontStyle: 'bold' };
    this.scoreText  = this.add.text(12, 8, '', style);
    this.livesText  = this.add.text(CANVAS.width - 12, 8, '', style).setOrigin(1, 0);
    this.levelText  = this.add.text(CANVAS.width / 2, 8, '', style).setOrigin(0.5, 0);
    this.extendText = this.add.text(12, 30, '', { ...style, fontSize: '14px', color: '#fde68a' });
    this.timeText   = this.add.text(CANVAS.width - 12, 30, '', { ...style, fontSize: '14px' }).setOrigin(1, 0);
    this.hurryText  = this.add.text(CANVAS.width / 2, 56, '', { fontSize: '22px', color: '#ef4444', fontStyle: 'bold' }).setOrigin(0.5);
  }

  updateState(s: HudState) {
    this.scoreText.setText(`SCORE ${s.score.toString().padStart(6, '0')}`);
    this.livesText.setText(`🫧 × ${s.lives}`);
    this.levelText.setText(`LEVEL ${s.level}`);
    const filled = RULES.extendLetters.map((l, i) =>
      s.extendLetters.includes(l) && s.extendLetters.indexOf(l) === i ? l : '_'
    ).join(' ');
    this.extendText.setText(`EXTEND: ${filled}`);
    this.timeText.setText(`⏰ ${s.timeLeftSec}s`);
    this.hurryText.setText(s.hurryUp ? 'HURRY UP!' : '');
  }
}
```

- [ ] **Step 2: Create `GameOverScene.ts`**

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';
import { loadHighScore, saveHighScore } from '../config/storage';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOver' }); }

  init(data: { score: number; reason: 'lose' | 'win' }) {
    this.data.set('score', data.score);
    this.data.set('reason', data.reason);
  }

  create() {
    const cx = CANVAS.width / 2;
    const score = this.data.get('score') as number;
    const won = this.data.get('reason') === 'win';

    this.cameras.main.setBackgroundColor('#0f172a');
    this.add.text(cx, 180, won ? '🎉 CLEAR!' : 'GAME OVER', {
      fontSize: '40px', color: won ? '#fbbf24' : '#fca5a5', fontStyle: 'bold',
    }).setOrigin(0.5);

    const hi = loadHighScore();
    const newHi = score > hi;
    if (newHi) saveHighScore(score);

    this.add.text(cx, 260, `SCORE  ${score}`, { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
    this.add.text(cx, 300, `HI      ${Math.max(hi, score)}`, { fontSize: '18px', color: '#fbbf24' }).setOrigin(0.5);
    if (newHi) this.add.text(cx, 330, 'NEW HIGH SCORE!', { fontSize: '16px', color: '#34d399' }).setOrigin(0.5);

    const tap = this.add.text(cx, 440, 'TAP TO RETRY', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

    const restart = () => { this.scene.stop('HUD'); this.scene.start('Menu'); };
    this.input.once('pointerdown', restart);
    this.input.keyboard?.once('keydown-SPACE', restart);
  }
}
```

- [ ] **Step 3: Register scenes + wire GameScene to use rules/HUD/GameOver**

`HoriBubbleGame.tsx` scene list:
```typescript
scene: [PreloadScene, MenuScene, GameScene, HUDScene, GameOverScene],
```

Add to `GameScene`:

```typescript
import { GameRules } from '../rules';
import type { HUDScene, HudState } from './HUDScene';
import { RULES } from '../config/rules';

private rules = new GameRules();
private currentLevel = 1;
private levelStartedAt = 0;
private levelTimeLimit = 180;

create() {
  // … existing spawn/colliders …
  this.scene.launch('HUD');
  this.rules = new GameRules();
  this.levelStartedAt = this.time.now;
  this.levelTimeLimit = (level01 as unknown as LevelData).timeLimit ?? 180;
}

update(_t, dt) {
  // … existing …
  // After bubble pop fruit-spawn, credit enemy→fruit:
  // (inside the bubble-popped-with-trapped block)
  this.rules.onEnemyToFruit();

  // Update HUD
  const hud = this.scene.get('HUD') as HUDScene;
  const elapsed = (this.time.now - this.levelStartedAt) / 1000;
  const timeLeft = Math.max(0, Math.floor(this.levelTimeLimit - elapsed));
  const state: HudState = {
    score: this.rules.score,
    lives: this.rules.lives,
    level: this.currentLevel,
    extendLetters: this.rules.extendLetters,
    timeLeftSec: timeLeft,
    hurryUp: timeLeft * 1000 <= RULES.hurryUpWarningAtMsLeft && timeLeft > 0,
  };
  hud.updateState(state);

  // Life loss on hurt
  if (this.player.logic.state === 'HURT' && !(this.player as any).__lifeLostThisHurt) {
    (this.player as any).__lifeLostThisHurt = true;
    this.rules.onHurt();
    if (this.rules.isGameOver) {
      this.scene.stop();
      this.scene.start('GameOver', { score: this.rules.score, reason: 'lose' });
    }
  }
  if (this.player.logic.state !== 'HURT') (this.player as any).__lifeLostThisHurt = false;
}
```

- [ ] **Step 4: Fruit score hook**

In `onFruitCollected`:
```typescript
private onFruitCollected(f: Fruit) {
  this.rules.onFruitCollected(this.time.now);
  if (f.isExtend && f.letter) this.rules.onExtendLetter(f.letter);
  // trap score already credited on trap; missing: credit trap here
}
```

- [ ] **Step 5: Credit trap on enemy trap**

Inside `bubbles ↔ enemies` overlap, after `e.logic.trap()`:
```typescript
this.rules.onTrap();
```

- [ ] **Step 6: Manual verify**

Run. HUD top shows score, lives, level, EXTEND letters, timer. Die 3 times by running into enemy → Game Over screen with score + hi-score. Tap → back to Menu.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/scenes/HUDScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameOverScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx
git commit -m "feat(hori-bubble): HUD, game over, life loss, score integration"
```

---

## Chunk 6: Levels, Level Progression, Boss

### Task 18: Level loader + level progression

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/data/levels/level-02.json` … `level-09.json`
- Create: `packages/client/src/features/arcade-games/hori-bubble/data/levels/index.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Design levels 2-9 following per-level spec**

Create 8 JSON files. Each 16×24 tilemap, exactly one `S`, file schema matches `level-01.json`. Per-level target composition:

| ID | Theme | Enemies | Platform hint | Time |
|---|---|---|---|---|
| 2 | forest | 2× walker | 3 horizontal tiers, wide gaps | 180s |
| 3 | forest | 3× walker | 4 tiers, stair-step | 180s |
| 4 | garden | 1 walker + 2 jumper | 3 tiers, jumpers between top and bottom | 180s |
| 5 | garden | 2 walker + 1 jumper | 4 tiers, narrow mid-layer | 180s |
| 6 | garden | 2 walker + 2 jumper | 4 tiers, with 1 narrow platform center | 180s |
| 7 | orchard | 1 walker + 1 jumper + 1 floater | 4 tiers, open middle | 200s |
| 8 | orchard | 2 walker + 1 jumper + 1 floater | 3 tiers, tight | 200s |
| 9 | orchard | 2 walker + 1 jumper + 2 floater | 3 tiers + 1 "island", open top | 220s |

During execution, after drafting each JSON run the `validateLevel` (throws on bad shape) plus one manual playthrough to confirm Hori can physically reach every platform from spawn. If a playtest reveals the level is unreachable/too hard, revise the JSON in place before moving to the next level.

- [ ] **Step 2: Create `index.ts`**

```typescript
import { validateLevel, type LevelData } from './level-schema';
import level01 from './level-01.json';
import level02 from './level-02.json';
import level03 from './level-03.json';
import level04 from './level-04.json';
import level05 from './level-05.json';
import level06 from './level-06.json';
import level07 from './level-07.json';
import level08 from './level-08.json';
import level09 from './level-09.json';
// level-10 added in Task 19

const all = [level01, level02, level03, level04, level05, level06, level07, level08, level09];
all.forEach(validateLevel);

export const LEVELS: readonly LevelData[] = all as unknown as LevelData[];

export function getLevel(id: number): LevelData {
  const lv = LEVELS.find(l => l.id === id);
  if (!lv) throw new Error(`Level ${id} not found`);
  return lv;
}
```

- [ ] **Step 3: Refactor GameScene to take `levelId` in `init` and load via `getLevel`**

```typescript
init(data: { levelId?: number; carryScore?: number; carryLives?: number; carryExtend?: string[] }) {
  this.currentLevel = data.levelId ?? 1;
  if (data.carryScore !== undefined) this.rules.score = data.carryScore;
  if (data.carryLives !== undefined) this.rules.setLivesForTest(data.carryLives);
  if (data.carryExtend) this.rules.extendLetters = [...data.carryExtend];
}

create() {
  const level = getLevel(this.currentLevel);
  // … parse tilemap, spawn enemies from `level.enemies` …
  this.levelTimeLimit = level.timeLimit ?? 180;
}

private onLevelClear() {
  const secLeft = Math.max(0, Math.floor(this.levelTimeLimit - (this.time.now - this.levelStartedAt) / 1000));
  this.rules.onLevelClear(secLeft);
  if (this.currentLevel >= RULES.levelCount) {
    this.scene.stop('HUD');
    this.scene.start('GameOver', { score: this.rules.score, reason: 'win' });
  } else {
    // celebratory pause, then next level
    this.player.play(HORI_ANIM_KEYS.celebrate);
    this.time.delayedCall(1500, () => {
      this.scene.restart({
        levelId: this.currentLevel + 1,
        carryScore: this.rules.score,
        carryLives: this.rules.lives,
        carryExtend: this.rules.extendLetters,
      });
    });
  }
}

update(_t, dt) {
  // …
  // Check level clear condition
  if (this.enemies.every(e => e.logic.state === 'FRUIT' || !e.active) && this.fruits.getChildren().length === 0 && !(this as any).__clearTriggered) {
    (this as any).__clearTriggered = true;
    this.onLevelClear();
  }
}
```

- [ ] **Step 4: Manual verify**

Play through levels 1→9. Each level validates on load (`validateLevel`). Level transitions show celebrate animation then next level. Score/lives/EXTEND carry.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/data/levels/ packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): levels 2-9 + level progression with validate on load"
```

---

### Task 19: Boss (level 10)

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/BossEnemy.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/data/levels/level-10.json`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/utils/spawn.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/data/levels/index.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `BossEnemy.ts`**

```typescript
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { BossLogic } from './EnemyLogic';
import { ENEMY } from '../config/enemies';

export class BossEnemy extends Enemy {
  readonly kind = 'boss' as const;
  readonly logic = new BossLogic();
  readonly onThrowSeed: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, onThrowSeed: (x:number,y:number)=>void) {
    super(scene, x, y, 'boss');
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.onThrowSeed = onThrowSeed;
  }

  advance(dt: number, _px: number, _py: number) {
    this.logic.update(dt);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Horizontal patrol
    if (body.blocked.left || body.blocked.right) this.logic.vx *= -1;
    body.setVelocityX(this.logic.vx);
    body.setVelocityY(0);
    if (this.logic.wantsThrow) {
      this.onThrowSeed(this.x, this.y + 40);
      this.logic.notifyThrew();
    }
    if (this.logic.state === 'FRUIT') this.destroy();
  }

  takeHit() {
    this.logic.takeHit();
    this.setTint(0xffffff);
    this.scene.time.delayedCall(ENEMY.boss.hurtFlashMs, () => this.clearTint());
  }
}
```

- [ ] **Step 2: Create `level-10.json`** (boss room — 2 platforms + walls + boss spawn at y=2)

```json
{
  "id": 10,
  "theme": "orchard",
  "bgmIntensity": "intense",
  "tilemap": [
    "#......................#",
    "#......................#",
    "#.........BS...........#",
    "#......................#",
    "#......................#",
    "#..=================...#",
    "#......................#",
    "#......................#",
    "#......................#",
    "#..=================...#",
    "#......................#",
    "#......................#",
    "#......................#",
    "#......................#",
    "#......................#",
    "########################"
  ],
  "enemies": [
    { "type": "boss", "x": 11, "y": 2 }
  ],
  "timeLimit": 240
}
```

Note: `B` marks the boss visual anchor; spawn coords come from the enemies array. Tilemap `#` characters are walls. Ensure `parseTilemap` handles `#` (already implemented in Task 4).

- [ ] **Step 3: Extend `spawn.ts` for boss**

```typescript
case 'boss':
  enemies.push(new BossEnemy(scene, cx, cy, (sx, sy) => {
    (scene as any).spawnBossSeed?.(sx, sy);
  }));
  break;
```

- [ ] **Step 4: In `levels/index.ts` add level-10 import**

- [ ] **Step 5: In GameScene, add seed projectile**

```typescript
private bossSeeds!: Phaser.Physics.Arcade.Group;

create() {
  // …
  this.bossSeeds = this.physics.add.group({ runChildUpdate: false });
  this.physics.add.collider(this.bossSeeds, this.platforms, (seed) => seed.destroy());
  this.physics.add.overlap(this.player, this.bossSeeds, () => {
    if (!this.player.logic.isInvulnerable()) this.player.logic.notifyHurt();
  });
  (this as any).spawnBossSeed = (x: number, y: number) => {
    const s = this.add.circle(x, y, 8, 0x15803d);
    this.physics.add.existing(s);
    (s.body as Phaser.Physics.Arcade.Body).setVelocityY(300);
    this.bossSeeds.add(s);
  };
}
```

- [ ] **Step 6: Wire bubble-boss hit**

In `bubbles ↔ enemies` overlap, when enemy is BossEnemy and bubble state === 'FLOATING':
```typescript
if (e instanceof BossEnemy && b.logic.state === 'FLOATING') {
  e.takeHit();
  b.logic.pop();
  this.rules.onBossHit();
  if (e.logic.state === 'FRUIT') {
    this.rules.onBossKill();
    this.spawnFruitShower(e.x, e.y);
  }
}
```

Add `spawnFruitShower`:
```typescript
private spawnFruitShower(x: number, y: number) {
  for (let i = 0; i < 10; i++) {
    this.time.delayedCall(i * 80, () => this.spawnFruitAt(x + (Math.random()-0.5)*80, y));
  }
}
```

- [ ] **Step 7: Manual verify**

Reach level 10. Boss moves horizontally, throws green seeds every ~2.5s. Hitting boss with bubble takes 5 hits. Kill triggers fruit shower then advance to GameOver win.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/BossEnemy.ts packages/client/src/features/arcade-games/hori-bubble/data/levels/level-10.json packages/client/src/features/arcade-games/hori-bubble/utils/spawn.ts packages/client/src/features/arcade-games/hori-bubble/data/levels/index.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): level 10 miniboss with seed attack and fruit shower"
```

---

## Chunk 7: Power-Ups & Special Bubbles

### Task 20: Power-up entity + drop system + stacked effects

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/PowerUp.ts`
- Create: `packages/client/src/features/arcade-games/hori-bubble/config/powerups.test.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/config/powerups.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Extend `powerups.ts` with ActiveEffects class**

```typescript
export class ActiveEffects {
  private expires: Partial<Record<PowerUpKind, number>> = {};

  activate(kind: PowerUpKind, nowMs: number) {
    this.expires[kind] = nowMs + POWERUP.effectDurationMs;
  }

  isActive(kind: PowerUpKind, nowMs: number): boolean {
    const t = this.expires[kind] ?? -Infinity;
    return nowMs < t;
  }

  remainingMs(kind: PowerUpKind, nowMs: number): number {
    const t = this.expires[kind] ?? -Infinity;
    return Math.max(0, t - nowMs);
  }

  allActive(nowMs: number): PowerUpKind[] {
    return (Object.keys(this.expires) as PowerUpKind[]).filter(k => this.isActive(k, nowMs));
  }
}
```

- [ ] **Step 2: Write tests for ActiveEffects**

```typescript
import { describe, it, expect } from 'vitest';
import { ActiveEffects, POWERUP } from './powerups';

describe('ActiveEffects', () => {
  it('activates and reports active within duration', () => {
    const fx = new ActiveEffects();
    fx.activate('speed', 0);
    expect(fx.isActive('speed', 100)).toBe(true);
    expect(fx.isActive('speed', POWERUP.effectDurationMs + 1)).toBe(false);
  });

  it('stacks different kinds', () => {
    const fx = new ActiveEffects();
    fx.activate('speed', 0);
    fx.activate('jump', 0);
    expect(fx.allActive(100).sort()).toEqual(['jump', 'speed']);
  });

  it('reactivating same kind resets expiry', () => {
    const fx = new ActiveEffects();
    fx.activate('speed', 0);
    fx.activate('speed', 5000);
    expect(fx.isActive('speed', 5000 + POWERUP.effectDurationMs - 1)).toBe(true);
  });
});
```

Run, pass.

- [ ] **Step 3: Create `PowerUp.ts`**

```typescript
import Phaser from 'phaser';
import { VISUAL_ASSETS } from '../config/assets';
import { ensureEmojiTexture } from '../utils/emoji-texture';
import type { PowerUpKind } from '../config/powerups';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  readonly kind: PowerUpKind;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PowerUpKind) {
    const asset = VISUAL_ASSETS.powerups[kind];
    const key = ensureEmojiTexture(scene, asset.glyph, asset.size);
    super(scene, x, y, key);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setBounce(0.4);
    body.setSize(asset.size - 6, asset.size - 6);
  }
}
```

- [ ] **Step 4: Wire drop + pickup in GameScene**

```typescript
private powerups!: Phaser.Physics.Arcade.Group;
private effects = new ActiveEffects();
private lastPowerupAt = 0;

create() {
  // …
  this.powerups = this.physics.add.group();
  this.physics.add.collider(this.powerups, this.platforms);
  this.physics.add.overlap(this.player, this.powerups, (_p, pu) => {
    const p = pu as PowerUp;
    this.effects.activate(p.kind, this.time.now);
    this.rules.onPowerUpPickup();
    p.destroy();
  });
}

update(_t, dt) {
  // …
  if (this.time.now - this.lastPowerupAt >= POWERUP.dropIntervalMs) {
    this.lastPowerupAt = this.time.now;
    const kinds = POWERUP.kinds;
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const parsed = parseTilemap(getLevel(this.currentLevel).tilemap);
    const platform = parsed.platforms[Math.floor(Math.random() * parsed.platforms.length)];
    const x = platform.x + Math.random() * platform.width;
    const y = platform.y - 40;
    this.powerups.add(new PowerUp(this, x, y, kind));
  }

  // Apply effect modifiers to player movement
  const walk = this.effects.isActive('speed', this.time.now) ? PHYSICS.walkSpeedBoost : PHYSICS.walkSpeed;
  const jump = this.effects.isActive('jump', this.time.now) ? PHYSICS.jumpVelocityBoost : PHYSICS.jumpVelocity;
  this.player.applyInput(input, dt, walk, jump);
}
```

Range and cooldown effects are threaded through `Bubble` and `HoriPlayerLogic`:

**Range** — extend `Bubble` constructor with optional `rangePx`:

```typescript
// entities/Bubble.ts — modify constructor
constructor(
  scene: Phaser.Scene, x: number, y: number,
  kind: BubbleKind, facing: Facing,
  opts: { rangePx?: number } = {},
) {
  // … existing setup …
  this.maxTravelPx = opts.rangePx ?? BUBBLE.rangePxDefault;
  this.spawnOriginX = x;
}

// entities/Bubble.ts — add field and enforce in advance()
private readonly maxTravelPx: number;
private readonly spawnOriginX: number;

advance(deltaMs: number) {
  this.logic.update(deltaMs);
  if (this.logic.state === 'SPAWNED' && Math.abs(this.x - this.spawnOriginX) >= this.maxTravelPx) {
    // Force transition to FLOATING early if we hit range cap
    (this.logic as any).forceFloating?.();  // requires small addition to BubbleLogic
  }
  // …
}
```

Add `forceFloating()` to `BubbleLogic`:

```typescript
// entities/BubbleLogic.ts
forceFloating(): void {
  if (this.state !== 'SPAWNED') return;
  this.transition('FLOATING');
  this.vx = 0;
  this.vy = BUBBLE.floatUpSpeed;
}
```

(Add a unit test in `BubbleLogic.test.ts`: after `forceFloating()` from `SPAWNED`, state is `FLOATING` and `vx === 0`.)

**Cooldown** — threaded via `HoriPlayerLogic` override:

```typescript
// In GameScene.update, before applyInput:
const cdMs = this.effects.isActive('cooldown', this.time.now) ? BUBBLE.cooldownMsBoost : BUBBLE.cooldownMs;
this.player.logic.cooldownOverrideMs = cdMs;  // add field to HoriPlayerLogic
```

Add to `HoriPlayerLogic`:

```typescript
cooldownOverrideMs: number | null = null;
// In update(): replace `BUBBLE.cooldownMs` with `this.cooldownOverrideMs ?? BUBBLE.cooldownMs`
```

**Spawning with range boost** — in `GameScene.spawnBubble()`:

```typescript
private spawnBubble() {
  if (this.bubbles.getLength() >= BUBBLE.maxConcurrent) return;
  const rangePx = this.effects.isActive('range', this.time.now) ? BUBBLE.rangePxBoost : BUBBLE.rangePxDefault;
  const b = new Bubble(
    this,
    this.player.x + (this.player.logic.facing === 'right' ? BUBBLE.spawnOffsetPx : -BUBBLE.spawnOffsetPx),
    this.player.y,
    this.pendingSpecial ?? 'normal',
    this.player.logic.facing,
    { rangePx },
  );
  this.pendingSpecial = null;
  this.bubbles.add(b);
}
```

- [ ] **Step 5: HUD — show active effect timers**

Extend `HudState` with `activeEffects: { kind: PowerUpKind; remainingMs: number }[]` and render small icons on the right side with remaining duration bar.

- [ ] **Step 6: Manual verify**

Every 20s a 🍭/🎈/👟/⚡ lands on a random platform. Pick up → effect visible in HUD, stacks with others, expires at 15s. Speed feels faster; jump feels higher; cooldown lets you rapid-fire.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/config/powerups.ts packages/client/src/features/arcade-games/hori-bubble/config/powerups.test.ts packages/client/src/features/arcade-games/hori-bubble/entities/PowerUp.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/HUDScene.ts
git commit -m "feat(hori-bubble): powerups with stacked effects and HUD timers"
```

---

### Task 21: Special bubble seeds + transformed bubbles + effects

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/SpecialBubble.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `SpecialBubble.ts`** with water/lightning/fire behaviors

Design:
- **Water** bubble: on FLOATING, every frame trap any enemy in its Y-row (sweeper). When it hits ceiling, pop — traps get converted to fruits at once via `rules.onSpecialKill(n)`.
- **Lightning** bubble: on FLOATING, immediately emit a horizontal lightning beam at Hori's Y and turn all same-row enemies to FRUIT. Then pop.
- **Fire** bubble: on landing (platform collider), ignite that platform for 2s. Enemies crossing platform become FRUIT.

```typescript
import Phaser from 'phaser';
import { Bubble } from './Bubble';
import type { BubbleKind } from '../config/bubbles';
import type { Facing } from './HoriPlayerLogic';

export class SpecialBubble extends Bubble {
  constructor(scene: Phaser.Scene, x: number, y: number, kind: Exclude<BubbleKind, 'normal'>, facing: Facing) {
    super(scene, x, y, kind, facing);
  }
}
```

Actually the specials diverge significantly; we handle the logic in `GameScene` by checking `kind`:

```typescript
private applySpecialEffect(b: Bubble) {
  switch (b.logic.kind) {
    case 'water':
      // gather nearby-row enemies at the bubble's Y band
      const row = b.y;
      const hits = this.enemies.filter(e => Math.abs(e.y - row) < 40 && e.logic.state === 'ROAMING');
      hits.forEach(e => e.logic.kill());
      if (hits.length >= 2) this.rules.onSpecialKill(hits.length);
      break;
    case 'lightning':
      const y = this.player.y;
      const rowHits = this.enemies.filter(e => Math.abs(e.y - y) < 30 && e.logic.state === 'ROAMING');
      rowHits.forEach(e => e.logic.kill());
      if (rowHits.length >= 2) this.rules.onSpecialKill(rowHits.length);
      // visual: draw a yellow line across screen for 200ms
      const line = this.add.rectangle(CANVAS.width/2, y, CANVAS.width, 6, 0xfbbf24);
      this.time.delayedCall(200, () => line.destroy());
      break;
    case 'fire':
      // ignite platform the bubble is resting on; find nearest platform
      // simpler: create a 2-second danger zone at bubble's landing point
      const zone = this.add.rectangle(b.x, b.y + 20, 60, 20, 0xf97316, 0.5);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(zone, this.enemies as any, (_z, en) => {
        const e = en as Enemy;
        if (e.logic.state === 'ROAMING') e.logic.kill();
      });
      this.time.delayedCall(SPECIAL_BUBBLE.fire.platformBurnMs, () => zone.destroy());
      break;
  }
}
```

- [ ] **Step 2: Seed drops + conversion**

When `specialBubbleSeeds` defined in level, spawn 💠🟡🟥 at scheduled times. Overlap with player: next bubble fired becomes that kind.

```typescript
private pendingSpecial: BubbleKind | null = null;

// in create: schedule per level.specialBubbleSeeds

private spawnBubble() {
  const kind: BubbleKind = this.pendingSpecial ?? 'normal';
  this.pendingSpecial = null;
  // create bubble with `kind`
}
```

In random drop (no level hints): 10% chance to drop a random special seed every 30s instead of a powerup.

- [ ] **Step 3: Trigger effect exactly once per bubble**

Extend `Bubble` with `private __specialApplied = false;` flag and in `GameScene.update()`:

```typescript
this.bubbles.getChildren().forEach(c => {
  const b = c as Bubble;
  if (b.logic.kind !== 'normal' && !(b as any).__specialApplied) {
    const shouldTrigger =
      (b.logic.kind === 'lightning' && b.logic.state === 'FLOATING') ||
      (b.logic.kind === 'water' && b.logic.state === 'FLOATING') ||
      (b.logic.kind === 'fire' && (b.body as Phaser.Physics.Arcade.Body).blocked.down);
    if (shouldTrigger) {
      (b as any).__specialApplied = true;
      this.applySpecialEffect(b);
      if (b.logic.kind === 'lightning' || b.logic.kind === 'water') b.logic.pop();
    }
  }
});
```

`applySpecialEffect` must skip Boss (they have their own hit logic) and Blubba (invulnerable):

```typescript
const hits = this.enemies.filter(e =>
  e.kind !== 'boss' &&
  e.logic.state === 'ROAMING' &&
  Math.abs(e.y - row) < 40,
);
```

- [ ] **Step 4: Manual verify**

Fire a water bubble → sweep enemies along its path → pop at ceiling. Lightning shoots horizontal beam instantly clearing row. Fire leaves burn zone for 2s.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/SpecialBubble.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): special bubbles water/lightning/fire with seed drops"
```

---

## Chunk 8: Faithfulness Features

### Task 22: Rage mode (last-enemy speed boost)

- [ ] **Step 1: Add test in `EnemyLogic.test.ts`** (already has `setRage(true)` test — add integration test in a new `GameScene`-free pure helper)

Create `rage.ts`:
```typescript
import type { EnemyLogic } from './EnemyLogic';

// "Alive" = currently roaming. Trapped enemies count as already-handled so
// rage locks onto the last *free* enemy; boss is excluded because it owns
// its own difficulty curve.
export function applyRageIfLast(enemies: { kind: string; logic: EnemyLogic }[]) {
  const alive = enemies.filter(e => e.kind !== 'boss' && e.logic.state === 'ROAMING');
  if (alive.length === 1) alive[0].logic.setRage(true);
}
```

Tests:
```typescript
import { describe, it, expect } from 'vitest';
import { WalkerLogic } from './EnemyLogic';
import { applyRageIfLast } from './rage';

describe('rage mode', () => {
  it('sets rage on the last remaining enemy', () => {
    const a = { logic: new WalkerLogic('right') };
    const b = { logic: new WalkerLogic('right') };
    b.logic.kill();
    applyRageIfLast([a, b]);
    expect((a.logic as any).rage).toBe(true);
  });
});
```

- [ ] **Step 2: Call `applyRageIfLast(this.enemies)` each update in GameScene**

- [ ] **Step 3: Visual — tint red, shake slightly**

First expose a read-only getter on `EnemyLogic`:

```typescript
// In EnemyLogic.ts base class — change `protected rage = false` to private with getter
private _rage = false;
get isRaging(): boolean { return this._rage; }
setRage(on: boolean) { this._rage = on; this.applyBaseVelocity(); }
// Update all `this.rage` references inside subclasses to `this._rage`.
```

Then in `Enemy.syncFromLogic()`:

```typescript
if (this.logic.isRaging && this.logic.state === 'ROAMING') {
  this.setTint(0xff6b6b);
  this.x += (Math.random() - 0.5) * 1.5;   // subtle jitter
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/rage.ts packages/client/src/features/arcade-games/hori-bubble/entities/rage.test.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts packages/client/src/features/arcade-games/hori-bubble/entities/Enemy.ts
git commit -m "feat(hori-bubble): rage mode on last enemy"
```

---

### Task 23: Hurry Up warning + Baron von Blubba ghost

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/entities/BlubbaGhost.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `BlubbaGhost.ts`**

```typescript
import Phaser from 'phaser';
import { ensureEmojiTexture } from '../utils/emoji-texture';

export class BlubbaGhost extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const key = ensureEmojiTexture(scene, '👻', 64);
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setAlpha(0.85);
    this.setTint(0xcbd5e1);
  }

  chase(px: number, py: number, dt: number) {
    const speed = 180;
    const dx = px - this.x;
    const dy = py - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity((dx / len) * speed, (dy / len) * speed);
  }
}
```

- [ ] **Step 2: In GameScene**

```typescript
private blubba: BlubbaGhost | null = null;
private hurryUpShown = false;

update(_t, dt) {
  // …
  const elapsed = (this.time.now - this.levelStartedAt) / 1000;
  const timeLeftMs = Math.max(0, (this.levelTimeLimit - elapsed) * 1000);

  // warning at 90s left
  if (!this.hurryUpShown && timeLeftMs <= RULES.hurryUpWarningAtMsLeft && timeLeftMs > 0) {
    this.hurryUpShown = true;
    this.showHurryBanner();
    // BGM rate change: wired in Task 26
  }
  // Blubba at 0
  if (!this.blubba && timeLeftMs <= 0) {
    this.blubba = new BlubbaGhost(this, CANVAS.width / 2, CANVAS.playfieldTop + 20);
    this.physics.add.overlap(this.player, this.blubba, () => {
      if (!this.player.logic.isInvulnerable()) this.player.logic.notifyHurt();
    });
  }
  this.blubba?.chase(this.player.x, this.player.y, dt);
}

private showHurryBanner() {
  const t = this.add.text(CANVAS.width / 2, CANVAS.height / 2, 'HURRY UP!', {
    fontSize: '48px', color: '#ef4444', fontStyle: 'bold',
  }).setOrigin(0.5).setScale(0.5);
  this.tweens.add({
    targets: t, scale: 1.2, duration: 400, yoyo: true,
    onComplete: () => this.tweens.add({ targets: t, alpha: 0, delay: 1200, duration: 600, onComplete: () => t.destroy() }),
  });
}
```

- [ ] **Step 3: Manual verify**

Let timer run past 90s → "HURRY UP!" banner. Past 0s → purple ghost spawns, chases Hori, unkillable, deals damage on contact. Clearing the level removes it.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/BlubbaGhost.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): Hurry Up warning + Baron von Blubba chase ghost"
```

---

### Task 24: EXTEND alphabet spawns

**Files:**
- Modify: `packages/client/src/features/arcade-games/hori-bubble/entities/Fruit.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Extend `Fruit.random` with EXTEND variant**

Build a letter→glyph map (Korean-style: positional map matches `RULES.extendLetters` array positions):

```typescript
// entities/Fruit.ts — add module-level constant
const EXTEND_GLYPH_BY_INDEX = VISUAL_ASSETS.enemies.extend.glyphs;
// RULES.extendLetters = ['E','X','T','E','N','D']  (two E's are intentional — they're different slots)

static extendLetter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  slotIndex: number,      // 0..5 — slot position in EXTEND sequence, not letter character
): Fruit {
  if (slotIndex < 0 || slotIndex >= EXTEND_GLYPH_BY_INDEX.length) {
    throw new Error(`Fruit.extendLetter: invalid slotIndex ${slotIndex}`);
  }
  const glyph = EXTEND_GLYPH_BY_INDEX[slotIndex];
  const letter = RULES.extendLetters[slotIndex];
  return new Fruit(scene, x, y, glyph, { isExtend: true, letter });
}
```

The `letter` param is no longer ambiguous — callers pass the slot position (0..5) and we derive both glyph and letter from `RULES.extendLetters`. This also fixes the "two E's" ambiguity in the EXTEND sequence.

- [ ] **Step 2: In GameScene, pick 1–2 enemies per level to drop EXTEND letters**

```typescript
private extendDropTargets = new Set<Enemy>();

create() {
  // After enemies spawn:
  const n = Phaser.Math.Between(RULES.extendSpawnPerLevelMin, RULES.extendSpawnPerLevelMax);
  const picks = Phaser.Utils.Array.Shuffle([...this.enemies]).slice(0, Math.min(n, this.enemies.length));
  picks.forEach(e => this.extendDropTargets.add(e));
}

private spawnFruitAt(x: number, y: number, source?: Enemy) {
  if (source && this.extendDropTargets.has(source)) {
    // Next EXTEND slot index not yet collected.
    const nextSlot = RULES.extendLetters.findIndex((_, i) => {
      const letter = RULES.extendLetters[i];
      // count how many times `letter` was already awarded for slots <= i
      const awardedBefore = RULES.extendLetters.slice(0, i).filter(l => l === letter && this.rules.extendLetters.includes(l)).length;
      const currentlyHeld = this.rules.extendLetters.filter(l => l === letter).length;
      return currentlyHeld <= awardedBefore; // this slot is still empty
    });
    const slot = nextSlot === -1 ? 0 : nextSlot;
    const f = Fruit.extendLetter(this, x, y, slot);
    this.fruits.add(f);
  } else {
    this.fruits.add(Fruit.random(this, x, y));
  }
}
```

Also update the bubble-popped-with-trapped block from Task 15 to pass the enemy source:

```typescript
// In the bubble-popped-with-trapped loop in GameScene.update():
if (b.logic.state === 'POPPED' && b.logic.hadTrappedEnemy && !(b as any).__fruitSpawned) {
  (b as any).__fruitSpawned = true;
  const trappedEnemy = this.enemies.find(en => en.logic.state === 'TRAPPED');
  this.spawnFruitAt(b.x, b.y, trappedEnemy);       // pass source
  trappedEnemy?.logic.kill();
  trappedEnemy?.destroy();
  this.enemies = this.enemies.filter(en => en !== trappedEnemy);
}
```

Update `GameRules.onExtendLetter` to accept the slot so duplicates are tracked correctly:

```typescript
// rules.ts — replace onExtendLetter
onExtendLetter(letter: string) {
  // The collection has exactly 6 slots matching RULES.extendLetters indexes.
  // Each letter in rules.extendLetters is pushed at the first empty slot that
  // expects this letter. Two "E" slots (index 0 and 3) must each be filled by
  // a separate E pickup — we model this as a push-only list.
  if (!RULES.extendLetters.includes(letter as typeof RULES.extendLetters[number])) return;
  const expectedSoFar = RULES.extendLetters.slice(0, this.extendLetters.length);
  const nextExpected = RULES.extendLetters[this.extendLetters.length];
  if (letter !== nextExpected) return;   // out-of-order letter ignored
  this.extendLetters.push(letter);
  if (this.extendLetters.length === RULES.extendLetters.length) {
    if (this.lives < RULES.maxLives) this.lives++;
    this.extendLetters = [];
  }
}
```

(Update the rule tests in Task 16 to reflect: letters must be collected in order, duplicate letter at wrong slot is ignored. The "duplicate letter does not advance progress" test still passes with this ordering rule.)

- [ ] **Step 3: Manual verify**

Play a level → defeat the tagged enemy → lands an alphabet letter fruit → pickup → HUD "EXTEND: E _ _ _ _ _". Collect all 6 over play → +1 life + fanfare.

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/entities/Fruit.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts
git commit -m "feat(hori-bubble): EXTEND alphabet drops + HUD slot progression"
```

---

## Chunk 9: Audio

### Task 25: SFX synthesis script

**Files:**
- Create: `scripts/synthesize-bubble-sfx.mjs`

- [ ] **Step 1: Author `synthesize-bubble-sfx.mjs`** — extends `synthesize-runner-sfx.mjs`

First copy the following helpers from `scripts/synthesize-runner-sfx.mjs` (already exist there): `SR`, `toWav`, `writeWav`, basic `sine`, `noise`, envelope helpers, `saveMp3`.

Then author these **new** helpers at the top of the file (semantics and signatures):

| Helper | Signature | Behavior |
|---|---|---|
| `compose(parts, totalSec)` | `(parts: Float32Array[], totalSec: number) => Float32Array` | Sums PCM buffers into a single `totalSec * SR` buffer; each part starts at t=0 unless a fixed delay is encoded by a caller wrapping `part` with silence prefix |
| `glide(f1Hz, f2Hz, durSec)` | linear-ramp sine | Generates `durSec * SR` samples of a sine wave whose frequency linearly interpolates from `f1Hz` to `f2Hz`; apply a fast 10ms attack / 30ms release envelope |
| `noiseBurst(durSec)` | `(durSec: number) => Float32Array` | White noise with a fast exponential decay (τ ≈ durSec/3) |
| `sparkle(durSec)` | `(durSec: number) => Float32Array` | Mix of 3 short decaying sine chirps at 2093/2637/3136 Hz offset by ~40ms each |
| `composeBgmLoop(loopSec)` | `(loopSec: number) => Float32Array` | 8-step sequencer at 120 BPM in C major: root-third-fifth arpeggio + soft square-wave bassline C2/G2; target duration `loopSec` |
| `delayed(part, tSec)` | `(part: Float32Array, tSec: number) => Float32Array` | Prepends `tSec * SR` zero samples so the part starts at `tSec` inside `compose` |

Implementation skeleton:

```javascript
#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ffmpegStatic from 'ffmpeg-static';

const SR = 44100;
const OUT = resolve('packages/client/public/sounds/bubble');
mkdirSync(OUT, { recursive: true });

// --- helpers (see table above for semantics) ---
function sine(freq, durSec) {/* … */}
function noise(durSec) {/* … */}
function noiseBurst(durSec) {/* … */}
function glide(f1, f2, durSec) {/* … */}
function sparkle(durSec) {/* … */}
function delayed(part, tSec) {/* … */}
function compose(parts, totalSec) {/* … */}
function composeBgmLoop(loopSec) {/* … */}
function toWav(pcm) {/* … */}

const sfx = {
  'blow.mp3':          () => compose([noiseBurst(0.1), delayed(glide(600, 1100, 0.2), 0.08)], 0.3),
  'bubble-pop.mp3':    () => compose([sine(1047, 0.1), delayed(noiseBurst(0.05), 0.08)], 0.15),
  'trap.mp3':          () => compose([glide(523, 784, 0.25)], 0.25),
  'fruit-collect.mp3': () => compose([sine(1319, 0.12), delayed(sine(1568, 0.12), 0.1), delayed(sine(2093, 0.11), 0.2)], 0.35),
  'escape.mp3':        () => compose([glide(784, 523, 0.25), delayed(noiseBurst(0.05), 0.2)], 0.3),
  'level-clear.mp3':   () => compose([
    sine(262, 0.18),
    delayed(sine(330, 0.18), 0.18),
    delayed(sine(392, 0.18), 0.36),
    delayed(sine(523, 0.28), 0.54),
    delayed(sparkle(0.4), 0.5),
  ], 0.9),
  'bgm-bubble.mp3':    () => composeBgmLoop(32.0),
};

for (const [name, build] of Object.entries(sfx)) {
  const pcm = build();
  const wav = resolve(OUT, name.replace('.mp3', '.wav'));
  writeFileSync(wav, toWav(pcm));
  execFileSync(ffmpegStatic, ['-y', '-i', wav, '-b:a', '96k', resolve(OUT, name)]);
}
```

Expected final file size ≈ 200-250 lines.

- [ ] **Step 2: Run**

```bash
node scripts/synthesize-bubble-sfx.mjs
ls -la packages/client/public/sounds/bubble/
```

Expected: 7 MP3 files. Play each in a media player to sanity-check timbres.

- [ ] **Step 3: Commit**

```bash
git add scripts/synthesize-bubble-sfx.mjs packages/client/public/sounds/bubble/
git commit -m "feat(hori-bubble): procedural SFX + BGM synthesis for bubble game"
```

---

### Task 26: Audio integration

**Files:**
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/MenuScene.ts`

- [ ] **Step 1: Load audio in PreloadScene**

```typescript
const SFX_NEW = ['blow','bubble-pop','trap','fruit-collect','escape','level-clear'];
SFX_NEW.forEach(n => this.load.audio(`sfx-${n}`, assetUrl(`/sounds/bubble/${n}.mp3`)));
this.load.audio('bgm-bubble', assetUrl('/sounds/bubble/bgm-bubble.mp3'));

// Reuse runner sfx
const REUSE = ['jump','land','hurt','gameover','powerup','milestone'];
REUSE.forEach(n => this.load.audio(`sfx-${n}`, assetUrl(`/sounds/runner/${n}.mp3`)));
```

- [ ] **Step 2: Wire SFX triggers in GameScene**

```typescript
private playSfx(name: string, rate = 1) {
  if (loadMuted()) return;
  this.sound.play(`sfx-${name}`, { rate });
}

// Trigger points:
// blow: when a bubble is spawned
// trap: on trap overlap
// bubble-pop: on bubble POPPED
// fruit-collect: on fruit pickup
// escape: when trapped enemy escapes (detect state transition TRAPPED→ROAMING outside of pop)
// level-clear: on level clear
// jump/land/hurt/gameover/powerup: existing points
```

- [ ] **Step 3: BGM in GameScene**

```typescript
private bgm!: Phaser.Sound.BaseSound;

create() {
  // …
  this.bgm = this.sound.add('bgm-bubble', { loop: true, volume: 0.5 });
  if (!loadMuted()) this.bgm.play();
}

// Hurry Up rate change — stop cleanly and replace the handle
private enterHurryUp() {
  this.bgm.stop();
  this.bgm.destroy();
  this.bgm = this.sound.add('bgm-bubble', { loop: true, volume: 0.5, rate: RULES.bgmRateHurryUp });
  if (!loadMuted()) this.bgm.play();
}

shutdown() {
  this.bgm?.stop();
  this.bgm?.destroy();
}
```

For simplicity we stop and re-play with rate. Store handle to stop on scene shutdown.

- [ ] **Step 4: Mute toggle**

In MenuScene, add `M` key handler to toggle mute and persist.

```typescript
this.input.keyboard?.on('keydown-M', () => {
  const muted = !loadMuted();
  saveMuted(muted);
  this.sound.mute = muted;
});
```

Apply `this.sound.mute = loadMuted()` in each Scene's create.

- [ ] **Step 5: Manual verify**

Playing → bubble blows, pops, fruits collect each play distinct SFX. BGM loops. Mute with M silences everything. Hurry Up speeds up tempo.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/scenes/
git commit -m "feat(hori-bubble): audio integration (SFX + BGM + mute)"
```

---

## Chunk 10: Input (Touch + Gamepad)

### Task 27: Touch controls for mobile/tablet

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/TouchScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Create `TouchScene.ts`** — overlays virtual pad + 2 buttons; exposes state via scene data

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';

export interface TouchState {
  left: boolean; right: boolean; jump: boolean; blow: boolean;
}

export class TouchScene extends Phaser.Scene {
  state: TouchState = { left: false, right: false, jump: false, blow: false };

  constructor() { super({ key: 'Touch' }); }

  create() {
    if (!('ontouchstart' in window)) {
      // desktop — keep scene inert but don't render controls
      return;
    }
    const mkBtn = (x: number, y: number, label: string, setter: (on: boolean) => void) => {
      const g = this.add.circle(x, y, 36, 0xffffff, 0.15).setInteractive();
      this.add.text(x, y, label, { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
      g.on('pointerdown', () => setter(true));
      g.on('pointerup', () => setter(false));
      g.on('pointerout', () => setter(false));
    };
    mkBtn(48, CANVAS.height - 64, '◀', on => (this.state.left = on));
    mkBtn(136, CANVAS.height - 64, '▶', on => (this.state.right = on));
    mkBtn(CANVAS.width - 136, CANVAS.height - 64, '⤒', on => (this.state.jump = on));
    mkBtn(CANVAS.width - 48, CANVAS.height - 64, '🫧', on => (this.state.blow = on));
  }
}
```

- [ ] **Step 2: Launch TouchScene** in `GameScene.create()`

```typescript
this.scene.launch('Touch');
```

Read state in update:
```typescript
const touch = (this.scene.get('Touch') as TouchScene).state;
const input = {
  left: kb.addKey('LEFT').isDown || kb.addKey('A').isDown || touch.left,
  right: kb.addKey('RIGHT').isDown || kb.addKey('D').isDown || touch.right,
  jump: kb.addKey('SPACE').isDown || kb.addKey('UP').isDown || touch.jump,
  blow: kb.addKey('Z').isDown || kb.addKey('X').isDown || touch.blow,
  onGround: false,
};
```

- [ ] **Step 3: Register TouchScene** in the game scene list.

- [ ] **Step 4: Manual verify on mobile/tablet** (Chrome DevTools device emulator acceptable)

Touch buttons appear bottom-left and bottom-right. Hold `◀`/`▶` to move, `⤒` to jump, `🫧` to blow.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/scenes/TouchScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx
git commit -m "feat(hori-bubble): touch controls for mobile/tablet"
```

---

### Task 28: Gamepad support

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/utils/gamepad.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/HUDScene.ts`

- [ ] **Step 1: Create `gamepad.ts`**

```typescript
import Phaser from 'phaser';

export interface GamepadInput {
  left: boolean; right: boolean; jump: boolean; blow: boolean; pause: boolean; connected: boolean;
}

export function readGamepad(scene: Phaser.Scene): GamepadInput {
  const pad = scene.input.gamepad?.pad1;
  if (!pad) return { left: false, right: false, jump: false, blow: false, pause: false, connected: false };
  const dead = 0.35;
  const left = pad.left || pad.leftStick.x < -dead;
  const right = pad.right || pad.leftStick.x > dead;
  return {
    left, right,
    jump: pad.buttons[0]?.pressed ?? false,    // A
    blow: pad.buttons[2]?.pressed ?? false,    // X
    pause: pad.buttons[9]?.pressed ?? false,   // Start
    connected: true,
  };
}
```

- [ ] **Step 2: Enable gamepad in HoriBubbleGame config**

```typescript
input: { gamepad: true }
```

- [ ] **Step 3: Merge into input in GameScene.update()**

```typescript
const gp = readGamepad(this);
const input = {
  left: kb.addKey('LEFT').isDown || kb.addKey('A').isDown || touch.left || gp.left,
  right: kb.addKey('RIGHT').isDown || kb.addKey('D').isDown || touch.right || gp.right,
  jump: kb.addKey('SPACE').isDown || kb.addKey('UP').isDown || touch.jump || gp.jump,
  blow: kb.addKey('Z').isDown || kb.addKey('X').isDown || touch.blow || gp.blow,
  onGround: false,
};
```

- [ ] **Step 4: HUD indicator**

When `gp.connected`, add `🎮` icon to HUD.

- [ ] **Step 5: Manual verify** (with any USB/Bluetooth controller)

Controller D-pad and A/X buttons drive play.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/utils/gamepad.ts packages/client/src/features/arcade-games/hori-bubble/scenes/ packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx
git commit -m "feat(hori-bubble): gamepad input (D-pad/stick + A/X/Start)"
```

---

## Chunk 11: Accessibility, Error Handling, Performance

### Task 29: Accessibility — reduced motion, high contrast, pause menu

**Files:**
- Create: `packages/client/src/features/arcade-games/hori-bubble/scenes/PauseScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`

- [ ] **Step 1: Reduced motion**

At top of `GameScene.create()`:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
this.registry.set('reducedMotion', prefersReducedMotion);
```

Wherever shake/tween is applied (Hurry Up banner, bubble warning shake), wrap in `if (!this.registry.get('reducedMotion'))`.

- [ ] **Step 2: High contrast toggle**

HUD adds a small ⚙ button → opens PauseScene with options: Continue / Restart / Quit / High Contrast toggle / Mute.

Create `PauseScene.ts`:

```typescript
import Phaser from 'phaser';
import { CANVAS } from '../config/canvas';
import { loadMuted, saveMuted } from '../config/storage';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'Pause' }); }

  create() {
    this.add.rectangle(0, 0, CANVAS.width, CANVAS.height, 0x000000, 0.7).setOrigin(0);
    const cx = CANVAS.width / 2;
    this.add.text(cx, 160, 'PAUSE', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);

    const row = (y: number, label: string, onPick: () => void) => {
      const t = this.add.text(cx, y, label, { fontSize: '20px', color: '#fbbf24' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerdown', onPick);
      return t;
    };
    row(240, 'CONTINUE', () => this.resume());
    row(280, 'RESTART LEVEL', () => {
      // scene.resume doesn't re-init; we want a clean restart.
      this.scene.stop('Game');
      this.scene.stop(); // stop Pause
      this.scene.start('Game', { levelId: this.registry.get('currentLevel') ?? 1 });
    });
    row(320, 'QUIT TO HUB', () => window.location.assign('/games'));
    row(360, loadMuted() ? '🔇 UNMUTE' : '🔊 MUTE', () => {
      saveMuted(!loadMuted());
      this.sound.mute = loadMuted();
      this.scene.restart();
    });
    row(400, this.registry.get('highContrast') ? '🟨 HIGH CONTRAST ON' : '⬜ HIGH CONTRAST', () => {
      this.registry.set('highContrast', !this.registry.get('highContrast'));
      this.scene.restart();
    });

    this.input.keyboard?.once('keydown-ESC', () => this.resume());
    this.input.keyboard?.once('keydown-P', () => this.resume());
  }

  private resume() {
    this.scene.stop();
    this.scene.resume('Game');
  }
}
```

- [ ] **Step 3: High-contrast visual**

Enemy/bubble rendering: if `this.registry.get('highContrast')`, add yellow outline. Implement via Phaser `preFX.addGlow` on the sprite in `Enemy.syncFromLogic` (gated).

- [ ] **Step 4: Pause trigger**

In `GameScene.update`:
```typescript
if (Phaser.Input.Keyboard.JustDown(kb.addKey('P')) || Phaser.Input.Keyboard.JustDown(kb.addKey('ESC'))) {
  this.scene.pause();
  this.scene.launch('Pause');
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/features/arcade-games/hori-bubble/scenes/PauseScene.ts packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts packages/client/src/features/arcade-games/hori-bubble/entities/Enemy.ts packages/client/src/features/arcade-games/hori-bubble/components/HoriBubbleGame.tsx
git commit -m "feat(hori-bubble): pause menu with accessibility toggles"
```

---

### Task 30: Hori `blow` sprite generation + polish

**Files:**
- Modify: `docs/hori-sprite-prompts.md`
- Create: `packages/client/public/mascot/hori/blow/blow-frame-{1..4}.png`
- Create: `packages/client/public/mascot/hori/blow/blow.webp`
- Create: `packages/client/public/mascot/hori/blow/blow-sheet-2x2.png`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts` (point `blow` anim at real sprite)

- [ ] **Step 1: Add `blow` section to `docs/hori-sprite-prompts.md`**

Document the Gemini 3 Pro prompt used (per spec §5.1).

- [ ] **Step 2: Run generation** (manual pipeline — human reviewer needed for art approval)

```bash
# Use Gemini 3 Pro web UI with the prompt in docs/hori-sprite-prompts.md
# Save the 2x2 output to packages/client/public/mascot/hori/blow/blow-sheet-2x2.png
python scripts/process-sprite-sheet.py blow 75
```

Outputs: 4 frames + WebP + strip preview.

- [ ] **Step 3: Wire real sprite**

In `PreloadScene.preload()`:
```typescript
for (let i = 1; i <= 4; i++) {
  this.load.image(`${HORI_SPRITE_KEYS.blow}-${i}`, assetUrl(`/mascot/hori/blow/blow-frame-${i}.png`));
}
```

In `create()`:
```typescript
makeAnim(HORI_ANIM_KEYS.blow, HORI_SPRITE_KEYS.blow, 13, 0);   // 75ms × 4 ≈ 13 fps
```

- [ ] **Step 4: Manual verify**

Blow action shows dedicated sprite.

- [ ] **Step 5: Commit**

```bash
git add docs/hori-sprite-prompts.md packages/client/public/mascot/hori/blow/ packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts
git commit -m "feat(hori-bubble): Hori blow sprite + animation"
```

---

### Task 31: Error handling + performance polish

**Files:**
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/PreloadScene.ts`
- Modify: `packages/client/src/features/arcade-games/hori-bubble/scenes/GameScene.ts`
- Create: `packages/client/public/arcade-backgrounds/{forest,garden,orchard}-silhouette.svg`
- Create: `packages/client/public/arcade-fallback/bubble.svg` (and siblings for enemies)

- [ ] **Step 1: SVG backgrounds**

Claude-generated inline SVGs (simple silhouettes, 512×256). Save 3 files.

- [ ] **Step 2: SVG fallback images for emojis**

If ensureEmojiTexture fallback triggers, load SVG at Phaser preload. Create fallback per asset (walker, jumper, floater, boss, bubble).

- [ ] **Step 3: PreloadScene loaderror handler**

```typescript
this.load.on('loaderror', (file: Phaser.Loader.File) => {
  console.error('[hori-bubble] asset failed:', file.key, file.url);
  // continue — emoji textures are generated at runtime, backgrounds fall back to gradient only
});
```

- [ ] **Step 4: Scene-init try/catch**

Wrap `create()` body:
```typescript
try {
  // existing init
} catch (err) {
  console.error('[GameScene] init failed', err);
  const msg = this.add.text(CANVAS.width / 2, CANVAS.height / 2, '레벨을 불러오지 못했어요', {
    fontSize: '18px', color: '#fca5a5',
  }).setOrigin(0.5);
  this.time.delayedCall(1200, () => { msg.destroy(); this.scene.start('Menu'); });
}
```

- [ ] **Step 5: FPS debug overlay**

```typescript
if (new URLSearchParams(location.search).has('debug')) {
  const fps = this.add.text(CANVAS.width - 8, CANVAS.height - 8, '', { fontSize: '10px', color: '#fff' }).setOrigin(1, 1);
  this.events.on('postupdate', () => fps.setText(`${Math.round(this.game.loop.actualFps)} fps`));
}
```

- [ ] **Step 6: Concurrency cap — enforce BUBBLE.maxConcurrent**

Already enforced in `spawnBubble`. Add enemy active-cap guard.

- [ ] **Step 7: Manual verify**

`/games/hori-bubble?debug=1` shows FPS. With DevTools network throttle simulate asset failure — game still boots with placeholders. Intentionally delete `level-05.json`; game shows Menu again instead of crashing.

- [ ] **Step 8: Commit**

```bash
git add packages/client/public/arcade-backgrounds/ packages/client/public/arcade-fallback/ packages/client/src/features/arcade-games/hori-bubble/scenes/
git commit -m "feat(hori-bubble): error handling, SVG fallbacks, FPS overlay"
```

---

## Chunk 12: QA, Docs, Memory, Final Polish

### Task 32: Manual QA checklist document

**Files:**
- Create: `docs/hori-bubble-qa.md`

- [ ] **Step 1: Author checklist** (use spec §8.2 as source of truth)

Include sections: Levels, Mechanics, Faithfulness, Input, Audio, A11y, Perf, Platforms.

- [ ] **Step 2: Commit**

```bash
git add docs/hori-bubble-qa.md
git commit -m "docs(hori-bubble): manual QA checklist"
```

---

### Task 33: Full regression run — `pnpm test` + play through

- [ ] **Step 1: Run all tests**

```bash
pnpm --filter client test
```

Expected: all existing tests PASS + ~30 new bubble tests PASS.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero errors.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

Fix any issues.

- [ ] **Step 4: Dev-server full playthrough** (follow `docs/hori-bubble-qa.md`)

Complete levels 1→10. Record any bugs as open issues inline in the QA file (check failed items + note).

- [ ] **Step 5: Production build sanity**

```bash
pnpm build
```

Expected: client build succeeds. Verify the bubble entrypoint is included in the bundle.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "chore(hori-bubble): QA fixes from regression run"
```

---

### Task 34: Update CLAUDE.md + memory + open PR

**Files:**
- Modify: `CLAUDE.md` (Hori Arcade Games section)
- Modify: `memory/hori-arcade-games.md`

- [ ] **Step 1: Edit `CLAUDE.md`**

In the "Hori 아케이드 게임" section update total count to 7 and add `hori-bubble` to the games table:

```
| hori-bubble | 호리 버블 🫧 | 원작 풍 보글보블 오마주 (10 레벨 + 보스, 거품 트랩/점프/과일, 파워업 4·특수거품 3) |
```

Add the route line `/games/hori-bubble → HoriBubblePage` to the routes block.

- [ ] **Step 2: Edit `memory/hori-arcade-games.md`**

Add a 7th-game row and a short "Bubble Bobble homage" section with:
- Key architectural addition: `entities/*Logic.ts` pure modules composed by Phaser sprites (testable)
- Level JSON tilemap format
- `VISUAL_ASSETS` swap strategy
- Faithfulness features (EXTEND, rage, Hurry Up + Blubba)

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md memory/hori-arcade-games.md
git commit -m "docs: update CLAUDE.md and memory for hori-bubble (7th arcade game)"
```

- [ ] **Step 4: Ask the user before pushing**

Per the global workflow in `~/.claude/CLAUDE.md`, `git push origin main` runs only when the user explicitly says "업데이트 하자" / "정리" / "마무리". Stop here and confirm. Do **not** push autonomously.

If the user approves the push:

```bash
git push origin main
```

Then optionally open a PR with `gh pr create --title "feat: Hori Bubble Bobble arcade game" --body …` pointing at the spec and this plan.

---

## Implementation Notes for Executors

1. **Pure-logic-first TDD**: Every state machine (Hori/Bubble/Enemy/Rules/ActiveEffects) has a `*Logic.ts` module with tests. The Phaser sprite wrapper composes the logic module. Don't put mutable state in the Phaser sprite; put it in the logic module.

2. **Phaser arcade physics quirks**:
   - `Phaser.Physics.Arcade.Sprite` bodies can't have continuous collision response; for bubbles pushing enemies around, expect slight overlap tolerance.
   - `runChildUpdate: false` on groups means entity `advance()` must be called from the scene `update()` loop. This is intentional so `dt` is consistent.

3. **Emoji rendering caveats**:
   - macOS uses Apple Color Emoji (vector outlines), Windows uses Segoe UI Emoji (semi-vector), Linux/Android uses Noto Color Emoji. Visual variance is acceptable for MVP.
   - Emoji textures are cached per `(glyph, size)` tuple so rebuilding is free.
   - For production we probably want to prerender the emoji set to a sprite atlas at build time; that's follow-up.

4. **File size guardrail**: If any single file in `scenes/` grows past ~500 lines (especially `GameScene.ts`), refactor collision handlers and spawn logic into separate methods or helper modules before continuing.

5. **Testing Phaser scenes**: we deliberately avoid it. Scene integration is covered by manual QA. If you need a smoke test, `vitest-canvas-mock` can stand up a Phaser headless-ish environment but it's fragile.

6. **Reference skills**:
   - @superpowers:test-driven-development — for writing the logic-module tests
   - @superpowers:systematic-debugging — if physics tuning goes sideways
   - @superpowers:verification-before-completion — before the final commit

7. **Spec alignment**: If during execution the spec feels wrong for a specific mechanic (e.g., the bubble timer rule), **stop and report** rather than diverge silently. Update the spec first, then continue.

---

## Follow-up (post-MVP, tracked in spec §10.2 and memory follow-ups)

- 2-player co-op
- Supabase `learning_events` integration
- Weekly leaderboard
- Level editor
- Emoji → Gemini sprite swap (flip `VISUAL_ASSETS.kind` to `'sprite'`)
- Additional level packs (11–20)
- Hidden doors, secret rooms, POW blocks
