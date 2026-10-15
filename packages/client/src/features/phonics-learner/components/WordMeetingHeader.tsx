import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GameHeader } from '@/features/games/components/GameHeader';

export function WordMeetingHeader({
  onBack,
  onRestart,
}: {
  onBack: () => void;
  onRestart?: () => void;
}) {
  const { t } = useTranslation('phonics');
  return (
    <GameHeader
      title={t('wordJourney.meet')}
      current={1}
      total={1}
      onBack={onBack}
      rightExtra={
        onRestart && (
          <button
            type="button"
            onClick={onRestart}
            aria-label={t('wordJourney.restart')}
            title={t('wordJourney.restart')}
            className="word-meeting-restart"
          >
            <RotateCcw size={24} />
          </button>
        )
      }
    />
  );
}
