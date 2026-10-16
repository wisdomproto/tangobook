import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { FREE_PLAYS } from '../lib/free-play-options';
import './home-play.css';

export function HomePlaySection() {
  const { t } = useTranslation('shell');
  return (
    <section className="home-play-section" aria-labelledby="home-play-heading">
      <div className="home-play-heading">
        <h2 id="home-play-heading">{t('freePlay.title')}</h2>
        <p>{t('freePlay.subtitle')}</p>
      </div>
      <div className="home-play-options">
        {FREE_PLAYS.map(({ kind, art }) => (
          <Link
            className="home-play-button"
            data-play={kind}
            key={kind}
            to={`/library/play/${kind}`}
            aria-label={t(`freePlay.${kind}`)}
          >
            <span className="home-play-art" aria-hidden="true">
              <img
                src={`/images/learning/vocabulary-menu-v1/${art}`}
                alt=""
                width={640}
                height={480}
                draggable={false}
                loading="lazy"
              />
            </span>
            <span className="home-play-label">
              {t(`freePlay.${kind}`)}
              <ArrowRight size={20} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
