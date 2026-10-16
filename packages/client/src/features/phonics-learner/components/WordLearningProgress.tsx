import { useTranslation } from 'react-i18next';
import type { WordLearningStage } from '../lib/word-learning-run';

/** Same noninteractive stage indicator in the lesson and its development preview. */
export function WordLearningProgress({
  stages,
  current,
  index,
  total,
  language,
  word,
}: {
  stages: WordLearningStage[];
  current: WordLearningStage;
  index: number;
  total: number;
  language?: 'ko' | 'en';
  word?: string;
}) {
  const { t } = useTranslation('phonics');
  return (
    <div
      className="word-learning-progress"
      data-language={language}
      aria-label={t('wordJourney.progress')}
    >
      {stages.map((stage) => (
        <span key={stage} data-current={stage === current}>
          {t(`wordJourney.${stage}`)}
        </span>
      ))}
      {word && <strong className="word-learning-target">{word}</strong>}
      <small>
        {index + 1} / {total}
      </small>
    </div>
  );
}
