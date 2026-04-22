import type { ComponentType } from 'react';
import type {
  GameTypeId,
  GameConfig,
  GameDifficulty,
  GameCategory,
  Storybook,
} from '@tangobook/shared';

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
  storybookId: string; // [신규] 말하기 게임 등 진척 추적용
  gameData: unknown;
  difficulty: GameDifficulty;
  onComplete: (score: number, maxScore: number) => void;
  onBack: () => void;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
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
  category: GameCategory;
  nameKo: string;
  descriptionKo: string;
  icon: string;
  supportedTypes: Array<'storybook' | 'phonics'>;
  supportedLevels?: number[]; // 파닉스 전용: [1] = Level1, [2,3,4,5] = Level2~5
  contentRequirements: ContentRequirement;
  defaultConfig: GameConfig;
  hidden?: boolean; // 목록에 표시하지 않음 (레거시 호환용)
  ConfigPanel: ComponentType<GameConfigPanelProps>;
  PlayerComponent: ComponentType<GamePlayerProps>;
  language?: 'ko' | 'en'; // 언어 전용 게임. 없으면 언어 중립
}

const GAME_REGISTRY = new Map<GameTypeId, GameRegistryEntry>();

export function registerGame(entry: GameRegistryEntry): void {
  GAME_REGISTRY.set(entry.id, entry);
}

export function getGameEntry(id: GameTypeId): GameRegistryEntry | undefined {
  return GAME_REGISTRY.get(id);
}

export function getAllGames(): GameRegistryEntry[] {
  return Array.from(GAME_REGISTRY.values()).filter((g) => !g.hidden);
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

// ─── 카테고리 기반 필터링 ───

export const GAME_CATEGORY_LABELS: Record<GameCategory, string> = {
  common: '공통 게임',
  storybook: '동화책 전용',
  phonics: '파닉스 공통',
  'english-phonics': '영어 파닉스 전용',
  'korean-phonics': '한글 파닉스 전용',
};

/** 스토리북 컨텍스트에 맞는 게임 목록 반환 (카테고리 + 레벨 필터) */
export function getGamesForContext(
  storybookType: 'storybook' | 'phonics',
  phonicsLanguage?: string,
  phonicsLevel?: string
): GameRegistryEntry[] {
  const all = getAllGames();

  let allowed: GameCategory[];
  if (storybookType === 'storybook') {
    allowed = ['common', 'storybook'];
  } else if (phonicsLanguage === 'korean') {
    allowed = ['common', 'phonics', 'korean-phonics'];
  } else {
    allowed = ['common', 'phonics', 'english-phonics'];
  }

  let filtered = all.filter((g) => allowed.includes(g.category));

  if (storybookType === 'phonics' && phonicsLevel) {
    const levelNum = parseInt(phonicsLevel.replace(/\D/g, ''), 10) || 0;
    filtered = filtered.filter((g) => {
      if (!g.supportedLevels) return true;
      return g.supportedLevels.includes(levelNum);
    });
  }

  return filtered;
}

/** 게임 목록을 카테고리별로 그룹화 (UI 표시용) */
export function groupGamesByCategory(
  games: GameRegistryEntry[]
): { category: GameCategory; label: string; games: GameRegistryEntry[] }[] {
  const order: GameCategory[] = [
    'common',
    'storybook',
    'phonics',
    'korean-phonics',
    'english-phonics',
  ];
  const grouped = new Map<GameCategory, GameRegistryEntry[]>();

  for (const game of games) {
    if (!grouped.has(game.category)) grouped.set(game.category, []);
    grouped.get(game.category)!.push(game);
  }

  return order
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({
      category: cat,
      label: GAME_CATEGORY_LABELS[cat],
      games: grouped.get(cat)!,
    }));
}
