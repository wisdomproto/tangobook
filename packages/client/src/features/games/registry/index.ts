// 게임 등록 (side-effect imports) — 새 게임 추가 시 여기에 import 1줄 추가
import './games/vocabulary-matching.register';
import './games/word-writing.register';
import './games/connect-the-dots.register';
import './games/word-quiz.register';
import './games/picture-sequence.register';
import './games/odd-one-out.register';
import './games/word-image-matching.register';
import './games/blending-listening.register';
import './games/letter-sound.register';
import './games/word-listening.register';

export {
  getAllGames,
  getGameEntry,
  getGamesForType,
  getGamesForPhonicsLevel,
  registerGame,
} from './game-registry';

export type {
  GameRegistryEntry,
  GamePlayerProps,
  GameConfigPanelProps,
  ContentRequirement,
} from './game-registry';
