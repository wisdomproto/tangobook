// 게임 등록 (side-effect imports) — 새 게임 추가 시 여기에 import 1줄 추가 (11종)
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
