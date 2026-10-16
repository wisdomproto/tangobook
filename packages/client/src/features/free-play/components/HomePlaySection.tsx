import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import {
  FREE_PLAYS,
  freePlayLanguage,
  freePlayLabelKey,
  freePlayArt,
} from '../lib/free-play-options';
import './home-play.css';

export function HomePlaySection() {
  const { t } = useTranslation('shell');
  const [params, setParams] = useSearchParams();
  const lang = freePlayLanguage(params.get('playLang'));
  return (
    <section className="home-play-section" aria-labelledby="home-play-heading">
      <div className="home-play-heading">
        <h2 id="home-play-heading">{t('freePlay.title')}</h2>
        <div className="home-play-languages" role="group" aria-label={t('freePlay.language')}>
          {(['ko', 'en'] as const).map((language) => (
            <button
              key={language}
              type="button"
              aria-pressed={lang === language}
              data-language={language}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('playLang', language);
                setParams(next, { replace: true, preventScrollReset: true });
              }}
            >
              {t(`freePlay.${language}`)}
            </button>
          ))}
        </div>
        <p>{t('freePlay.subtitle')}</p>
      </div>
      <div className="home-play-options">
        {FREE_PLAYS.map(({ kind }) => (
          <Link
            className="home-play-button"
            data-play={kind}
            key={kind}
            to={`/library/play/${kind}?lang=${lang}`}
            aria-label={t(freePlayLabelKey(kind, lang))}
          >
            <span className="home-play-art" aria-hidden="true">
              <img
                src={`/images/learning/vocabulary-menu-v1/${freePlayArt(kind, lang)}`}
                alt=""
                width={640}
                height={480}
                draggable={false}
                loading="lazy"
              />
            </span>
            <span className="home-play-label">
              {t(freePlayLabelKey(kind, lang))}
              <ArrowRight size={20} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
