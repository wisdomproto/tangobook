// 게임 등록 (side-effect imports) — 새 게임 추가 시 여기에 import 1줄 추가 (15종)
// 🔴 학습자 화면은 이 레지스트리를 안 본다 — `vocabulary-unit/lib/game-data-adapter` 의
//    `getAvailableGames()` 에도 같이 등록해야 아이에게 보인다(2026-08-31: 3종이 이래서 안 보였다).
import './games/connect-the-dots.register';
import './games/korean-block.register';
import './games/english-block.register';
import './games/korean-word-writing.register';
import './games/english-word-writing.register';
import './games/korean-speaking.register.tsx';
import './games/english-speaking.register.tsx';
import './games/korean-line-matching.register.tsx';
import './games/english-line-matching.register.tsx';
import './games/korean-story-image.register.tsx';
import './games/english-story-image.register.tsx';
import './games/hidden-object.register.tsx';
import './games/korean-character-matching.register.tsx';
import './games/korean-page-order.register.tsx';
import './games/korean-object-scene.register.tsx';

export {
  getAllGames,
  getGameEntry,
  getGamesForType,
  getGamesForPhonicsLevel,
  getGamesForContext,
  groupGamesByCategory,
  GAME_CATEGORY_LABELS,
  registerGame,
} from './game-registry';

export type {
  GameRegistryEntry,
  GamePlayerProps,
  GameConfigPanelProps,
  ContentRequirement,
} from './game-registry';
