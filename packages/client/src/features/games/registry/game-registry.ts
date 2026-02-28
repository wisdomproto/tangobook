import type { ComponentType } from 'react';
import type { GameTypeId, GameConfig, GameDifficulty, Storybook } from '@tangobook/shared';

/** 게임이 필요로 하는 컨텐츠 조건 */
export interface ContentRequirement {
  needsVocabularyImages: boolean;
  needsKeyObjectImages: boolean;
  needsCharacterImages: boolean;
  needsIllustrations: boolean;
  needsPhonicsData: boolean;
}

/** 모든 게임 플레이어 컴포넌트가 받는 props */
export interface GamePlayerProps {
  gameData: unknown;
  difficulty: GameDifficulty;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
}

/** 게임 설정 패널 컴포넌트가 받는 props */
export interface GameConfigPanelProps {
  storybook: Storybook;
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}

/** 레지스트리 엔트리 — 게임 1개의 메타데이터 + 컴포넌트 */
export interface GameRegistryEntry {
  id: GameTypeId;
  nameKo: string;
  descriptionKo: string;
  icon: string;
  supportedTypes: Array<'storybook' | 'phonics'>;
  supportedLevels?: number[]; // 파닉스 전용: [1] = Level1, [2,3,4,5] = Level2~5
  contentRequirements: ContentRequirement;
  defaultConfig: GameConfig;
  ConfigPanel: ComponentType<GameConfigPanelProps>;
  PlayerComponent: ComponentType<GamePlayerProps>;
}

const GAME_REGISTRY = new Map<GameTypeId, GameRegistryEntry>();

export function registerGame(entry: GameRegistryEntry): void {
  GAME_REGISTRY.set(entry.id, entry);
}

export function getGameEntry(id: GameTypeId): GameRegistryEntry | undefined {
  return GAME_REGISTRY.get(id);
}

export function getAllGames(): GameRegistryEntry[] {
  return Array.from(GAME_REGISTRY.values());
}

export function getGamesForType(storybookType: 'storybook' | 'phonics'): GameRegistryEntry[] {
  return getAllGames().filter((g) => g.supportedTypes.includes(storybookType));
}

/** 파닉스 레벨(book1~book5)에 맞는 게임만 필터링 */
export function getGamesForPhonicsLevel(level: string): GameRegistryEntry[] {
  const phonicsGames = getGamesForType('phonics');
  const levelNum = parseInt(level.replace(/\D/g, ''), 10) || 0;
  return phonicsGames.filter((g) => {
    if (!g.supportedLevels) return true;
    return g.supportedLevels.includes(levelNum);
  });
}
