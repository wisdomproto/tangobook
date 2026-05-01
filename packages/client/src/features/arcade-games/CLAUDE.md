# Hori 아케이드 게임

학습 게임(`features/games/`)과 별개의 **아케이드 허브** — Phaser 4, Hori 마스코트 스프라이트.

## 6 게임

- **hori-run** — 무한 러너
- **hori-catch** — 떨어지는 아이템 받기
- **hori-jump** — 점프 플랫포머
- **hori-whack** — 두더지잡기 3×3
- **hori-memory** — 4×3 카드 매칭
- **hori-simon** — 사이먼 세즈 C4/E4/G4/C5 4패드

## 폴더 구조

```
features/arcade-games/{game-id}/
  components/<Name>Game.tsx     # React-Phaser 래퍼
  scenes/{Preload,Game}Scene.ts
  config/*.ts                   # 물리값/스프라이트키/게임룰
```

## 라우트

- `/games` (GamesHubPage)
- `/games/hori-{run,catch,whack,memory,simon,jump}` (router/index.tsx)
- 각각 ErrorBoundary로 감쌈
- 진입점: LibraryPage AuthCornerBar `🎮 놀이터`

## 에셋

- 스프라이트: `public/mascot/hori/{idle,run,jump,hurt,celebrate}/` — state 당 4프레임 PNG + WebP 애니 + 2×2 원본/클린 시트 + 가로 strip 프리뷰
- 사운드: `public/sounds/runner/{jump,land,hurt,gameover,bgm,coin,powerup,milestone}.mp3` + 사이먼 패드 `note-{c4,e4,g4,c5}.mp3`

## 의존성

`phaser@^4.0.0`

## 유틸 스크립트

- `scripts/process-sprite-sheet.py` — Gemini 2×2 출력 → 4프레임 PNG + WebP 애니. 마젠타 chroma-key → alpha flood-fill, 프레임 정렬, bbox 스케일 클램프. `python scripts/process-sprite-sheet.py <state> [duration_ms]`
- `scripts/synthesize-runner-sfx.mjs` — 13 SFX 절차적 합성 (sine/bell/noise + envelope) → ffmpeg MP3

## 스프라이트 가이드

`docs/hori-sprite-prompts.md` — Gemini 3 Pro 프롬프트 템플릿, 마젠타 배경 이유, 골든 idle 레퍼런스 전략, 포즈 리스트.

상세: [memory/hori-arcade-games.md](../../../../../memory/hori-arcade-games.md)
