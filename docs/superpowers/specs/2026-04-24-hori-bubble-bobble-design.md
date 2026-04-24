# Hori Bubble Bobble — 아케이드 게임 설계

**날짜:** 2026-04-24
**작성자:** kil210 + Claude (brainstorming session)
**상태:** Draft → Review
**범위:** MVP (코어 메커닉 + 10 레벨 + 미니보스)

## 1. 목표와 범위

Taito 1986년 *Bubble Bobble*의 코어 경험을 Hori 마스코트 세계관으로 재해석한 **7번째 Hori 아케이드 게임**. 기존 `hori-run/catch/jump/whack/memory/simon`과 동일한 허브(`/games`)에 추가.

**목표:**
- 원작의 코어 감각(거품 뿜기 · 적 트랩 · 거품 점프 · 과일 변환 · 상하 워프)을 충실히 재현
- 4~5세 아이도 즐길 수 있는 부드러운 난이도와 친근한 적 디자인
- 기존 아케이드 게임과 일관된 허브 UX(한 판씩 바로 플레이, 레벨 셀렉트 없음)

**비목표 (follow-up):**
- 2인 협동
- Supabase 학습 이벤트 연동
- 주간 리더보드
- 레벨 에디터 도구
- 레벨 11+ 팩
- 적/거품 스프라이트 고퀄 교체
- 원작 시그니처(숨겨진 문 · 비밀 레벨 · POW 블록)

## 2. 핵심 게임플레이 결정 (brainstorming 결과)

| 결정 | 선택 | 이유 |
|---|---|---|
| 스코프 수준 | B (MVP) | 코어 메커닉 집중, follow-up으로 확장 여지 |
| 화면 구조 | A (원작 충실, 단일 화면 고정) | 보글보글 아이덴티티 유지 · Phaser.Scale.FIT으로 반응형 |
| 워프 | 상하 O, 좌우 X | 원작 정확. 좌우는 벽으로 막음, 아래로 떨어지면 위에서 등장 |
| 레벨 진행 | A (연속 진행, 게임오버 시 처음부터) | 기존 허브 게임들과 일관 |
| 레벨 수 | 10 | 4~5세 기준 충분 · 마지막이 보스 |
| 적 종류 | C (3종 + 미니보스) | 원작 코어 느낌 + 엔딩 감각 |
| 적 외형 | B (Hori 자연물 세계) | tangobook 톤 · 복숭아색 Hori 세계관과 조화 |
| 거품 메커닉 | C (풀 메커닉) | 필수 + 콤보 + 특수거품 3종 |
| Hori 스프라이트 | A (blow 1종만 신규) | MVP 원칙 · run을 walk로 재활용 · flipX로 좌우 |
| 에셋 방식 | 이모지/SVG 1차, 스프라이트 follow-up | 교체 가능한 `VISUAL_ASSETS` config로 추상화 |
| 게임패드 | MVP 포함 | 원작 아케이드 감각 재현에 중요 |
| 원작 충실성 | 최상위 원칙 | 모든 미확정 디테일은 원작 기준으로 결정 |

## 3. 아키텍처 · 파일 구조

```
packages/client/src/features/arcade-games/hori-bubble/
├── components/
│   └── HoriBubbleGame.tsx          # React-Phaser 래퍼 (scene list + physics config)
├── scenes/
│   ├── PreloadScene.ts             # 에셋 로딩 (스프라이트, SFX, 레벨 JSON)
│   ├── MenuScene.ts                # 시작 화면 (TAP TO START + 최고점수)
│   ├── GameScene.ts                # 코어 게임플레이 (Hori, 적, 거품, 플랫폼)
│   ├── HUDScene.ts                 # 점수·목숨·레벨·파워업 타이머 오버레이
│   └── GameOverScene.ts            # 게임오버/클리어 연출
├── entities/
│   ├── HoriPlayer.ts               # Hori 스프라이트 + 이동/점프/거품발사 상태머신
│   ├── Enemy.ts                    # 적 베이스 클래스
│   ├── WalkerEnemy.ts              # 도토리 🌰 (좌우 왕복)
│   ├── JumperEnemy.ts              # 복숭아 🍑 (위아래 점프)
│   ├── FloaterEnemy.ts             # 꿀벌 🐝 (공중 부유 + Hori 추적)
│   ├── BossEnemy.ts                # 왕호박 🎃 (레벨 10)
│   ├── Bubble.ts                   # 거품 🫧 (일반 + 트랩 상태)
│   ├── SpecialBubble.ts            # 💧⚡🔥 특수 거품
│   ├── PowerUp.ts                  # 🍭🎈👟⚡ 파워업 아이템
│   └── Fruit.ts                    # 적이 과일로 변한 상태 (🍎🍓🍇🍊🍒 + EXTEND 무지개)
├── config/
│   ├── canvas.ts                   # 480×640 고정 + Scale.FIT + ASSET_VERSION
│   ├── physics.ts                  # 중력 500, 점프 -330, 이동 120 등
│   ├── hori.ts                     # 스프라이트 키 + 애니 프레임/레이트
│   ├── enemies.ts                  # 적별 속도/HP/AI 파라미터
│   ├── bubbles.ts                  # 거품 수명(8s)·쿨다운(300ms)·트랩시간(5s) + 특수거품 효과
│   ├── powerups.ts                 # 파워업 효과·지속시간(15s)·드랍 주기(20s)
│   ├── rules.ts                    # 레벨/목숨(3)/점수 규칙
│   ├── assets.ts                   # VISUAL_ASSETS: 이모지/스프라이트 매핑
│   └── storage.ts                  # localStorage 키
├── data/
│   └── levels/
│       ├── level-01.json … level-10.json  # 타일맵 + 적 배치 + 배경 테마
│       └── level-schema.ts                 # TypeScript 타입 (LevelData, EnemySpawn 등)
├── utils/
│   ├── tilemap.ts                  # JSON 문자열 → Phaser StaticGroup 플랫폼 변환
│   ├── emoji-texture.ts            # 이모지 → Phaser Texture 캐시 헬퍼
│   ├── spawn.ts                    # 적/파워업 스폰 유틸
│   └── wrap.ts                     # 상하 워프 helper
└── index.ts                         # public export

packages/client/src/pages/
└── HoriBubblePage.tsx              # /games/hori-bubble (ErrorBoundary)

packages/client/public/
├── mascot/hori/blow/               # 신규 스프라이트 (4프레임 PNG + WebP + 시트)
├── sounds/bubble/                  # 신규 SFX 7종 + BGM 1
└── arcade-backgrounds/             # SVG 배경 3종 (forest/garden/orchard)

scripts/
└── synthesize-bubble-sfx.mjs       # 신규 SFX 절차 합성

docs/
├── hori-sprite-prompts.md          # 기존 문서에 "blow" 섹션 추가
├── hori-bubble-qa.md               # 수동 QA 체크리스트
└── superpowers/specs/
    └── 2026-04-24-hori-bubble-bobble-design.md  # 본 문서
```

**외부 영향 (기존 파일 변경):**
- `packages/client/src/router/index.tsx` — `/games/hori-bubble` 라우트 추가 (ErrorBoundary 래핑)
- `packages/client/src/pages/GamesHubPage.tsx` — 7번째 게임 카드 (🫧 "호리 버블")
- `memory/hori-arcade-games.md` — 7번째 게임 섹션 업데이트
- `CLAUDE.md` — Hori Arcade 섹션에 hori-bubble 추가

**기존 코드 영향: 최소** (router + HUB 단순 추가 · 기존 게임 동작 변경 없음)

## 4. 게임 메커닉 · 물리 · 상태머신

### 4.1 Hori 상태머신 (`HoriPlayer.ts`)

```
IDLE ─(좌/우 입력)→ WALK ─(↑)→ JUMP ─(y속도+)→ FALL ─(땅)→ IDLE
  │                   │                         │
  └───(Z 거품버튼)────┴─────────────────────────┘
                      ↓ 0.3초 블로우 애니
                     BLOW → 거품 1개 발사 → 이전 상태 복귀
  │
  └─(적 접촉 & 무적 아님)→ HURT → 0.5초 무적 깜빡 → 이전 상태
```

**물리 기본값 (`config/physics.ts`):**
- 시스템: Phaser `arcade`
- 중력: `500 px/s²`
- 걸음 속도: `120 px/s` (파워업 시 180)
- 점프 초속도: `-330 px/s` (파워업 시 -400)
- 가변 점프: `Space` 누른 시간에 따라 `velocity.y` 조정 (원작의 짧은 탭/긴 홀드 구분)
- 가속/감속: `acceleration 800`, `drag 600` (즉시 속도 변경 X — 원작의 약간 미끄러지는 감각)
- 거품 쿨다운: `300ms`

### 4.2 거품 생명주기 (`Bubble.ts`)

```
SPAWNED (Hori 앞 16px) ─(0.6초 전진 @ 250 px/s)→ FLOATING (유속 -30 px/s 위로)
                                                      │
      ┌───────────────────────────────────────────────┤
      │                                               │
  (적 충돌)                                      (플레이어 점프 착지)
      ↓                                               ↓
   TRAPPED (적 가둠, 5초 카운트다운)              플랫폼 역할 (1회 발판)
      │                                               │
  (5초 경과 or 플레이어 점프 착지)              (0.3초 후 팡)
      ↓                                               ↓
   POPPED (팡 이펙트)                           POPPED
      ↓                                               ↓
   (적이 있으면) FRUIT 스폰                       소멸
   (적 없으면) 소멸
```

- 거품 수명: 8초 (그 안에 터지지 않으면 자동 팡, 적은 탈출)
- TRAPPED 마지막 1초: 빨강 tint + shake (탈출 직전 경고)
- 거품 위 점프: `velocity.y = -250`, 0.3초 후 pop
- 특수 거품(💧⚡🔥): 땅 충돌 시 효과 발동 (섹션 4.4)

### 4.3 적 AI (`Enemy.ts` + 파생)

| 적 | 이모지 | 행동 | 속도 |
|---|---|---|---|
| walker (도토리) | 🌰 | 플랫폼 위 좌우 왕복, 끝 도달 시 방향 반대 | 60 px/s |
| jumper (복숭아) | 🍑 | 위아래 점프 (바닥 ↔ 중간층) | 점프력 -280 |
| floater (꿀벌) | 🐝 | 플랫폼 무시, Hori 향해 sin 곡선 접근 | 50 px/s |
| boss (왕호박) | 🎃 | 화면 위쪽 좌우 이동, 주기적으로 씨앗 투척 | 80 px/s |

**공통 state:** `ROAMING → (거품 접촉) → TRAPPED → (5초 경과) → ROAMING / (거품 팡) → FRUIT`

**분노 모드:** 레벨에 남은 적이 1마리만 남으면 그 적 이동속도 +50%, 빨갛게 깜빡 (원작 "Skel Monsta" 오마주)

### 4.4 특수 거품 효과

| 거품 | 효과 | 지속 |
|---|---|---|
| 💧 물 | 떠다니며 경로상 모든 적 가둠 (직선 sweeper) | 1회성 |
| ⚡ 번개 | 가로로 번개 쏘아 같은 층 모든 적 즉시 과일화 | 1회성 |
| 🔥 불 | 착지한 플랫폼에 2초간 불길, 적 지나가면 과일화 | 2초 |

특수거품은 레벨 진행 중 무작위 타이밍에 아이템(💧/⚡/🔥 씨앗)으로 드랍, Hori가 접촉하면 다음 거품이 해당 타입으로 1회 전환.

### 4.5 파워업 (`PowerUp.ts`)

레벨 시작 후 20초마다 무작위 위치에 하나 드랍, Hori 접촉 시 15초 지속:

| 아이템 | 효과 |
|---|---|
| 🍭 사탕 | 이동속도 1.5배 |
| 🎈 풍선 | 거품 사거리 2배 |
| 👟 운동화 | 점프 높이 1.3배 |
| ⚡ 번개 | 거품 쿨다운 50% |

동시 중첩 가능. HUD에 남은 시간 아이콘 바 표시.

### 4.6 레벨 클리어 조건

- **일반 레벨**: 화면 내 모든 적 → 과일 → 수집 완료
- **보스 레벨 (10)**: 왕호박에게 거품 5회 명중. 명중마다 0.5초 스턴 + 깜빡. 최종 처치 시 거대 폭발 + 과일 10개 비
- 클리어 시 1.5초 축하 연출 (Hori `celebrate` 포즈) → 다음 레벨

### 4.7 EXTEND 보너스 (원작 시그니처, MVP 포함)

- 과일 종류 중 6개는 **무지개 알파벳 과일** (E·X·T·E·N·D)
- 각 레벨에서 무작위로 1~2개 스폰. 수집 시 HUD에 알파벳 누적
- 6글자 전부 모으면 +1 목숨 + 특별 팡파르, 다음 레벨부터 리셋
- 원작 아이덴티티의 핵심 요소

### 4.8 게임오버 / 리트라이

- 목숨 3개 시작. 적 접촉 · 씨앗 맞기 · 상하 워프 직후 적과 즉시 겹침 → 목숨 -1
- 피격 후 1.5초 무적 + 깜빡
- 목숨 0 → GameOverScene (점수, 최고점수, TAP TO RETRY)
- 리트라이 시 레벨 1부터 재시작

### 4.9 Hurry Up

- 레벨 제한시간 180초 (레벨별 조정 가능)
- 90초 남았을 때 BGM rate 1.2배 + HUD 중앙 "HURRY UP!" 팝업
- 제한시간 초과 시 화면 상단에서 **Baron von Blubba 오마주 유령** 하나 등장 (빠르게 플레이어 추적, 무적, 지울 수 없음) — 원작 충실 요소

## 5. 에셋 파이프라인

### 5.1 신규 스프라이트

**Hori `blow` 포즈** (기존 `scripts/process-sprite-sheet.py` 재사용)
- Gemini 3 Pro 프롬프트: 기존 idle 레퍼런스 + "호리가 크게 숨을 들이쉬고 앞쪽으로 비눗방울을 후후— 뿜는 포즈. 입 크게 O자, 뺨 볼록, 분홍 볼터치. 2×2 그리드, 마젠타 배경."
- 4프레임: 숨 들이쉼 → 입 O자 최대 → 거품 막 나옴 → 평온
- 출력: `public/mascot/hori/blow/{blow-frame-1~4.png, blow.webp, blow-sheet-2x2.png}`
- 좌우는 Phaser `flipX`로 처리

**적/거품/과일/파워업:** 이모지 기반 (섹션 5.2). 신규 스프라이트 없음.

**배경:** SVG 3장 (forest · garden · orchard, 512×256 실루엣) — Claude로 인라인 생성 후 저장

### 5.2 이모지 기반 에셋 (`config/assets.ts`)

```typescript
export const VISUAL_ASSETS = {
  enemies: {
    walker:  { kind: 'emoji', glyph: '🌰', size: 40 },
    jumper:  { kind: 'emoji', glyph: '🍑', size: 40 },
    floater: { kind: 'emoji', glyph: '🐝', size: 40 },
    boss:    { kind: 'emoji', glyph: '🎃', size: 96 },
    trapped: { kind: 'emoji', glyph: '😵', size: 24 },  // 거품 내부 오버레이
    fruit:   { kind: 'emoji', glyphs: ['🍎','🍓','🍇','🍊','🍒'], size: 36 },
    extend:  { kind: 'emoji', glyphs: ['🅴','🆇','🆃','🅴','🅽','🅳'], size: 44 },
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
};
```

**교체 지점:** 나중에 스프라이트 준비되면 `kind: 'sprite'`로 바꾸고 `textureKey: 'walker-sheet'` 등 지정. 렌더러는 kind 분기만 처리.

### 5.3 `utils/emoji-texture.ts`

```typescript
export function ensureEmojiTexture(scene: Phaser.Scene, glyph: string, size: number): string {
  const key = `emoji:${glyph}:${size}`;
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, size, size);
  const ctx = canvas.getContext();
  ctx.font = `${size * 0.85}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(glyph, size / 2, size / 2);
  canvas.refresh();
  return key;
}
```

오프스크린 캔버스에 한 번만 렌더하고 Phaser Texture로 캐시. `scene.physics.add.sprite(x, y, key)` 그대로 사용. 이모지 폰트 누락 시 체크섬 감지 → SVG fallback 경로 사용.

### 5.4 사운드 (`scripts/synthesize-bubble-sfx.mjs` 신규)

`scripts/synthesize-runner-sfx.mjs` 확장. 절차 합성 → ffmpeg MP3.

| SFX | 설계 | 길이 |
|---|---|---|
| `blow.mp3` | 짧은 noise burst + 피치 상승 bell | 0.3s |
| `bubble-pop.mp3` | 사인파 C6 + 짧은 noise click | 0.15s |
| `trap.mp3` | 둥근 sine C5→G5 glide | 0.25s |
| `fruit-collect.mp3` | 사인 E6→G6→C7 아르페지오 | 0.35s |
| `escape.mp3` | 반대 방향 glide G5→C5 + 소량 noise | 0.3s |
| `level-clear.mp3` | C4-E4-G4-C5 팡파르 + sparkle | 0.9s |
| `bgm-bubble.mp3` | 경쾌한 8-step 루프 (C 메이저, 120 BPM, 32초) | 32s |

**재사용** (`public/sounds/runner/`): `jump.mp3` · `land.mp3` · `hurt.mp3` · `gameover.mp3` · `powerup.mp3` · `milestone.mp3`

**Hurry Up**: `bgm-bubble.mp3` 재생 rate 1.2배

### 5.5 배경

레벨 테마 3종(`forest`/`garden`/`orchard`):
- Phaser `Graphics`로 그라디언트 렌더
- SVG 실루엣 1장씩 (먼 나무/언덕/과일나무) 겹치기
- 레벨별 theme 지정(`level-XX.json`의 `theme` 필드)

### 5.6 신규 작업량 총합

| 항목 | 양 | 예상 시간 |
|---|---|---|
| Hori blow 스프라이트 | 4프레임 PNG + WebP | 2h |
| SVG 배경 실루엣 | 3장 | 1h |
| SFX | 7 MP3 | 3h |
| BGM | 1 MP3 (32s 루프) | 2h |
| **총 아트/사운드** | | **~8h (1일)** |

## 6. 레벨 데이터 · 점수 · 입력

### 6.1 레벨 JSON 포맷 (`data/levels/level-schema.ts`)

```typescript
export interface LevelData {
  id: number;                    // 1~10
  theme: 'forest' | 'garden' | 'orchard';
  bgmIntensity?: 'calm' | 'normal' | 'intense';
  tilemap: string[];             // 16줄 × 24문자
  // '.' = 빈 · '=' = 플랫폼 · 'S' = 스폰 · '#' = 벽 (레벨 10 보스룸)
  enemies: EnemySpawn[];
  powerupDrops?: PowerUpDrop[];  // 미지정 시 20초마다 랜덤
  specialBubbleSeeds?: { at: number; type: 'water'|'lightning'|'fire' }[];
  timeLimit?: number;            // 기본 180초
}

export interface EnemySpawn {
  type: 'walker' | 'jumper' | 'floater' | 'boss';
  x: number;                     // tile coord
  y: number;
  direction?: 'left' | 'right';
}
```

**예시 `level-01.json`:**
```json
{
  "id": 1,
  "theme": "forest",
  "tilemap": [
    "........................",
    "........................",
    "...=========.=========...",
    "........................",
    "=====.......S.......=====",
    "........................",
    "...=========.=========...",
    "........................",
    "=====................=====",
    "........................",
    "========================"
  ],
  "enemies": [
    { "type": "walker", "x": 4, "y": 2, "direction": "right" },
    { "type": "walker", "x": 18, "y": 2, "direction": "left" }
  ]
}
```

**난이도 커브:**
- **1~3**: walker 1~2마리, 플랫폼 넓음 (forest)
- **4~6**: walker + jumper 섞기, 공간 좁아짐 (garden)
- **7~9**: floater 등장, 적 3~4마리, 좁은 공간 (orchard)
- **10**: 보스룸 (플랫폼 2줄, 왕호박 + 주기적 씨앗)

**타일 해상도:** 24×16 그리드, 20px 타일 → playfield 480×320 + HUD 상단 영역

### 6.2 점수 시스템

| 이벤트 | 점수 |
|---|---|
| 적 거품 가둠 | +50 |
| 적 과일화 (거품 팡) | +100 |
| 과일 수집 | +200 (기본) · +500 (콤보 시) |
| 파워업 획득 | +300 |
| 특수거품 단일 사용으로 2+ 적 처치 | +1000 |
| 레벨 클리어 | +1000 + 남은 시간×10 |
| 보스 명중 | +500/회 |
| 보스 처치 | +5000 |

**콤보 룰:** 1초 이내 과일 2개 수집 = 콤보 시작. 3개 이상 시 HUD에 "COMBO x3" 팝업.

### 6.3 저장 (`config/storage.ts`)

`localStorage` 키:
- `hori-bubble.highScore`
- `hori-bubble.lastPlayedAt`
- `hori-bubble.muted`

Supabase `learning_events` 연동은 follow-up. 게스트 모드/Auth 비활성에서도 정상 동작.

### 6.4 입력 시스템

**데스크톱 (키보드):**
- `←` / `→`: 이동
- `Space` / `↑`: 점프 (길게 홀드 시 높이 증가)
- `Z` / `X`: 거품
- `P` / `Esc`: 일시정지
- `M`: 음소거

**모바일/태블릿 (터치):**
- 좌측 가상 D-pad (←/→만)
- 우측 2버튼: `JUMP` · `BUBBLE`
- 우상단 ⚙: 일시정지 메뉴

**게임패드 (MVP 포함, Phaser 4 내장 API):**
- D-pad 또는 좌스틱: 이동
- `A` (index 0): 점프
- `X` (index 2): 거품
- `Start` (index 9): 일시정지
- 연결 감지 시 HUD에 🎮 아이콘 · 세션 중 3종 입력 동시 지원

**접근성:**
- `prefers-reduced-motion`: shake 효과 비활성
- 고대비 토글 (⚙ 메뉴): 적 실루엣 노란 outline · 거품 진한 테두리
- 색약 대응: 특수거품은 색 + 아이콘(💧⚡🔥) 동시 표시

### 6.5 일시정지

`CONTINUE` · `RESTART LEVEL` · `QUIT TO HUB` — 언제든 접근 가능.

## 7. 원작 충실성 체크리스트

구현 중 매 기능마다 "원작은 이 상황에서 뭐 했나"를 기준으로 결정:

| 요소 | 원작 | 우리 구현 |
|---|---|---|
| 화면 워프 | 상하 O, 좌우 X | ✅ §4.2, §2 |
| Hori 걸음 | 약간 미끄러지는 가속/감속 | `acceleration/drag` (§4.1) |
| 점프 궤적 | 짧은 탭 vs 긴 홀드 구분 | 가변 점프 (§4.1) |
| 거품 비행 | 일정 거리 → 멈춤 → 위로 | §4.2 |
| 거품 위 점프 | 살짝 튀는 착지감, 거품은 팡 | §4.2 |
| 적 탈출 카운트 | 마지막에 빨갛게 깜빡 | TRAPPED 마지막 1초 빨강 tint + shake (§4.2) |
| Hurry Up | BGM 가속 + 유령 등장 | §4.9 Baron von Blubba 오마주 유령 포함 |
| 분노 모드 | 마지막 1마리 가속 + 색 변화 | §4.3 |
| 보스 연출 | 피격마다 경직 + 폭발 + 과일 비 | §4.6 |
| EXTEND | E·X·T·E·N·D 수집 시 1UP | §4.7 |

## 8. 테스트 전략

### 8.1 단위 테스트 (Vitest)

| 파일 | 대상 |
|---|---|
| `entities/Bubble.test.ts` | 생명주기 상태 전이 |
| `entities/HoriPlayer.test.ts` | 상태머신 (IDLE↔WALK↔JUMP↔BLOW↔HURT) |
| `entities/Enemy.test.ts` | walker 반사 · jumper 리듬 · floater sin 경로 · boss 씨앗 주기 |
| `utils/tilemap.test.ts` | JSON 문자열 → 플랫폼 좌표 변환 |
| `utils/wrap.test.ts` | 상하 워프 경계값 |
| `config/powerups.test.ts` | 중첩 적용, 지속시간 카운트다운 |
| `rules.test.ts` | 콤보 점수 · 특수거품 다중 처치 · 레벨 클리어 보너스 · EXTEND |

**목표:** ~30 tests PASS

### 8.2 수동 QA 체크리스트 (`docs/hori-bubble-qa.md`)

- [ ] 10 레벨 순차 플레이, 각 레벨 클리어
- [ ] 목숨 3 소진 시 GameOver
- [ ] 각 적 행동 원작과 체감 유사 (walker/jumper/floater)
- [ ] 거품 위 점프 착지감
- [ ] 상하 워프 부드러움 (프레임 드롭 X)
- [ ] 분노 모드 (마지막 1마리)
- [ ] Hurry Up 메시지 + BGM 가속 + Baron von Blubba 유령
- [ ] 특수 거품 3종 효과 정확
- [ ] 파워업 4종 중첩
- [ ] EXTEND 과일 6개 수집 → 목숨 +1
- [ ] 보스 5 hit 클리어
- [ ] 키보드 · 터치 · 게임패드 3종 입력
- [ ] Pause/Resume 복구
- [ ] 음소거 토글
- [ ] 모바일 Safari/Chrome · 태블릿 세로/가로
- [ ] `prefers-reduced-motion`
- [ ] 저성능 기기 60fps (iPad 2019 기준)

**Playwright E2E는 MVP에서 제외** — Phaser Canvas 다루기 어렵고 ROI 낮음.

### 8.3 성능 타겟

- **60 fps** 유지: iPad 2019 · 중급 Android 태블릿 · 일반 데스크톱
- 프로파일링: `?debug=1` 쿼리 파라미터로 Phaser FPS 오버레이 활성
- 거품 최대 동시: 20개 (초과 시 오래된 것 자동 팡)
- 적 최대 동시: 8마리

## 9. 에러 처리

| 실패 | 처리 |
|---|---|
| 레벨 JSON 파싱 실패 | GameScene init try/catch → 에러 모달 + "메뉴로" |
| 스프라이트/SFX 로드 실패 | PreloadScene `loaderror` 리스너 → 플레이스홀더(빨간 박스) 폴백, 크래시 방지 |
| localStorage 접근 실패 | try/catch · 메모리 폴백 · 게임은 정상, 최고점수 세션 한정 |
| Phaser 초기화 실패 (WebGL) | React ErrorBoundary → "호리 버블을 실행할 수 없어요" + `/games` 링크 |
| 게임 상태 꼬임 | 일시정지 메뉴의 `RESTART LEVEL` |
| 이모지 폰트 누락 | `ensureEmojiTexture` 체크섬 → SVG fallback |

## 10. 배포 · 롤아웃 순서

### 10.1 구현 단계 (writing-plans에서 세부 분할)

1. **스캐폴딩** — 폴더·config·빈 Scene + 라우트 + HUB 카드 → 빈 검은 화면
2. **플랫폼 · Hori 이동/점프** — 타일맵 파서, HoriPlayer 상태머신, 물리
3. **거품 시스템** — 기본 거품 (SPAWNED→FLOATING→POPPED), 거품 위 점프
4. **적 시스템** — walker · jumper · floater, 거품 트랩/탈출
5. **점수 · HUD · 목숨 · 게임오버**
6. **레벨 전환 · 10레벨 JSON · 보스**
7. **파워업 · 특수거품**
8. **분노 모드 · Hurry Up · Baron von Blubba · EXTEND**
9. **사운드 합성 · BGM · SFX 연결**
10. **입력: 터치 · 게임패드**
11. **접근성 · 에러 처리 · 성능 튜닝**
12. **테스트 · 수동 QA**
13. **CLAUDE.md · memory · 커밋 · PR**

### 10.2 Follow-up (MVP 이후)

- 2인 협동
- Supabase `learning_events` 연동 (플레이 시간 · 최고점수 · 클리어 레벨)
- 주간 리더보드
- 레벨 에디터 도구
- 적/거품 스프라이트 교체 (이모지 → Gemini 생성)
- 레벨 11~20 팩
- 원작 시그니처: 숨겨진 문 · 비밀 레벨 · POW 블록

## 11. 의존성

- 신규: 없음 (`phaser@^4.0.0` 기존)
- 기존 활용:
  - `scripts/process-sprite-sheet.py` (Hori blow)
  - `scripts/synthesize-runner-sfx.mjs` → `synthesize-bubble-sfx.mjs`로 확장
  - 기존 SFX 6종 재사용
  - 기존 ErrorBoundary, 게임 허브 패턴

## 12. 위험 요소

| 위험 | 영향 | 완화 |
|---|---|---|
| Phaser 물리 파라미터 밸런스 (원작 느낌 재현) | 게임 재미 저하 | Step 2에서 Hori 이동/점프 감각을 원작 플레이 영상과 비교하며 튜닝. QA 중 반복 수정 |
| 이모지 렌더링 OS 차이 (Windows Segoe · iOS Apple · Android Noto) | 시각 일관성 부족 | `utils/emoji-texture.ts` 체크섬 fallback · 핵심 적은 SVG fallback 준비 |
| 모바일 터치 4~5세 UX | 조작 어려움 | 버튼 크기 72×72+, 가상 D-pad dead zone 크게, 햅틱 피드백 |
| 저성능 기기 성능 | 프레임 드롭 | 거품 동시수 제한 · 파티클 최소 · `?debug=1` 프로파일링 |
| 게임패드 브라우저별 매핑 차이 | 입력 혼동 | Phaser 내장 매핑 + 표준 XInput 매핑 가정 · 설정에서 재매핑은 follow-up |

## 13. 참고

- 기존 아케이드 게임 메모: `memory/hori-arcade-games.md`
- 스프라이트 생성 가이드: `docs/hori-sprite-prompts.md`
- CLAUDE.md 해당 섹션: "Hori 아케이드 게임 (2026-04-24)"
- 이번 설계의 브레인스토밍 목업 (세션 전용): `.superpowers/brainstorm/2066-1777011919/`
