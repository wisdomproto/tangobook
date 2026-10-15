import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type { Storybook } from '@tangobook/shared';
import { findImageData } from '../lib/phonics-game-adapter';

/** Chapter vocabulary overview, followed by one clear entry into the highlighted word. */
export function WordMeetingOverview({
  words,
  word,
  book,
  onStart,
}: {
  words: string[];
  word: string;
  book: Storybook;
  onStart: () => void;
}) {
  const { t } = useTranslation('phonics');
  return (
    <main
      className="word-meeting-overview"
      data-language={book.id.startsWith('en-') ? 'en' : 'ko'}
      data-many={words.length > 4 || undefined}
    >
      <h1>{t('wordJourney.chapterWords')}</h1>
      <div className="word-meeting-deck" role="list">
        {words.map((item, i) => {
          const active = item === word;
          const image = findImageData(book, item).imageUrl;
          return (
            <div
              key={i}
              role="listitem"
              className="word-meeting-target"
              data-current={active}
              aria-current={active ? 'step' : undefined}
            >
              {image && <img src={image} alt="" draggable={false} />}
              <span className="font-display">{item}</span>
              {active && (
                <span className="word-meeting-target-label">{t('wordJourney.thisWord')}</span>
              )}
            </div>
          );
        })}
      </div>
      <button className="word-meet-button" type="button" onClick={onStart}>
        {t('wordJourney.startWord', { word })} <ArrowRight size={25} />
      </button>
    </main>
  );
}
