export { LanguageTabs } from './components/LanguageTabs';
export { MasteryBadge } from './components/MasteryBadge';
export { MasteryDistributionBar } from './components/MasteryDistributionBar';
export { ReportEmptyState } from './components/ReportEmptyState';
export { VocabularyMasteryCard } from './components/VocabularyMasteryCard';
export { StorybookReportSection } from './components/StorybookReportSection';
export { PhonicsReportSection } from './components/PhonicsReportSection';
export { KoreanPhonicsHeatmap } from './components/KoreanPhonicsHeatmap';
export { EnglishPhonicsSkillTree } from './components/EnglishPhonicsSkillTree';
export { RewardsOverviewCard } from './components/RewardsOverviewCard';
export { CollectionProgressCard } from './components/CollectionProgressCard';
export { HoriInventoryCard } from './components/HoriInventoryCard';
export { PlaygroundStatsCard } from './components/PlaygroundStatsCard';
export { VocabularyTabContent } from './components/VocabularyTabContent';

export {
  useLogEvent,
  useLogEventsBatch,
  type LogEventArgs,
  type LogEventBatchItem,
} from './hooks/useLogEvent';
export { useLearningEvents } from './hooks/useLearningEvents';
export { useGameLogger, type GameWordResult, type LogGameArgs } from './hooks/useGameLogger';

export { eventsApi } from './api/events.api';
export { computeMastery, masteryState, type MasteryStats, type MasteryState } from './lib/mastery';
export {
  groupByWord,
  groupBySyllable,
  groupByPhoneme,
  countDistinctBooks,
  groupByArtStyle,
  type ArtStyleStat,
} from './lib/aggregate';
export {
  ArtStyleDistributionCard,
  getArtStyleLabel,
  getArtStyleEmoji,
} from './components/ArtStyleDistributionCard';
export {
  buildKoreanPhonicsGrid,
  KOREAN_PHONICS_LEVELS,
  type KoreanPhonicsCell,
  type KoreanPhonicsGrid,
} from './lib/korean-phonics-grid';
export {
  ENGLISH_PHONICS_BOOKS,
  type EnglishBookId,
  type EnglishPhonicsBook,
} from './lib/english-phonics-skills';
export {
  readPhonicsUnitIds,
  koreanLevelProgress,
  englishBookProgress,
  countPhonicsBooksByLanguage,
  type LevelProgress,
} from './lib/phonics-progress';
