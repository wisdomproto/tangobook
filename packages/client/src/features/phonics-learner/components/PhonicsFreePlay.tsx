import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, X } from 'lucide-react';
import { courseThemes } from '@/design-system';
import {
  StorybookSprite,
  type StorybookSpriteName,
} from '@/design-system/primitives/StorybookSprite';
import { FREE_GAME_TYPES, freePlayCatalog, type FreeGameType } from '../lib/free-play-catalog';
import type { JourneyLanguage } from '../lib/learning-journey';
import { activityTitle, levelName, unitTitle } from '../lib/activity-title';
import { ToyHangul } from './ToyHangul';
import './phonics-free-play.css';
import './workspace-buttons.css';
import { useFreePlayShelf } from '../lib/free-play-shelf-store';

function GameArt({ game, lang }: { game: FreeGameType; lang: JourneyLanguage }) {
  if (game.art === 'letter')
    return lang === 'korean' ? (
      <ToyHangul text="ㅏ" decorative />
    ) : (
      <StorybookSprite name="english" size={96} />
    );
  const file = game.art === 'blocks' ? `blocks-${lang === 'korean' ? 'ko' : 'en'}.webp` : game.art;
  if (file.endsWith('.webp'))
    return (
      <img
        src={`/images/learning/vocabulary-menu-v1/${file}`}
        alt=""
        width={640}
        height={480}
        draggable={false}
      />
    );
  return <StorybookSprite name={file as StorybookSpriteName} size={96} />;
}

/** A play shelf, not another curriculum: choose an activity first, then its content. */
export function PhonicsFreePlay({ lang, unitId }: { lang: JourneyLanguage; unitId?: string }) {
  const { t } = useTranslation('phonics');
  const catalog = useMemo(() => freePlayCatalog(lang), [lang]);
  const games = FREE_GAME_TYPES.filter((game) => catalog.some((entry) => entry.game === game.id));
  const section = useFreePlayShelf((state) => state.sections[lang]);
  const choose = useFreePlayShelf((state) => state.choose);
  const [selected, setSelected] = useState<FreeGameType | null>(null);
  const [book, setBook] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const choices = catalog.filter((entry) => entry.game === selected?.id);
  const books = [...new Map(choices.map((entry) => [entry.unit.levelKey, entry.unit])).values()];
  const currentBook = books.some((unit) => unit.levelKey === book) ? book : books[0]?.levelKey;
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    else if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);
  function close() {
    dialog.current?.close();
    setSelected(null);
    opener.current?.focus();
  }
  return (
    <section
      className={`phonics-free-play phonics-free-play--${lang}`}
      style={courseThemes[lang].style}
    >
      <div className="free-play-content">
        <header className="free-play-header">
          <Link
            className="workspace-icon-button"
            to={`/library/phonics/${lang}`}
            aria-label={t('journey.chooseMode')}
          >
            <StorybookSprite name="back" size={28} />
          </Link>
          <h1>
            <StorybookSprite name="book" size={38} />
            <span>
              {t(`journey.${lang}`)}
              <small>{t('journey.free')}</small>
            </span>
          </h1>
          <Link
            className="workspace-icon-button"
            to={`/library/phonics/${lang}?mode=curriculum`}
            aria-label={t('journey.curriculumMode')}
            title={t('journey.curriculumMode')}
          >
            <StorybookSprite name="compass" size={28} />
          </Link>
        </header>
        <div className="free-play-tabs" role="group" aria-label={t('freeShelf.categories')}>
          {(['letters', 'words'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={section === value}
              onClick={() => choose(lang, value)}
            >
              {t(`freeShelf.${value}`)}
            </button>
          ))}
        </div>
        <div className="free-play-game-grid">
          {games
            .filter((game) => game.section === section)
            .map((game) => (
              <button
                key={game.id}
                type="button"
                className="free-play-game"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setBook(
                    catalog.find((entry) => entry.game === game.id && entry.unit.id === unitId)
                      ?.unit.levelKey ?? ''
                  );
                  setSelected(game);
                }}
              >
                <span className="free-play-game-art">
                  <GameArt game={game} lang={lang} />
                  {game.id === 'listenBlock' && (
                    <span className="free-play-listen-badge">
                      <StorybookSprite name="listen" size={32} />
                    </span>
                  )}
                </span>
                <span className="free-play-game-label">
                  {t(`freeShelf.games.${game.id}`)}
                  <ArrowRight size={20} aria-hidden="true" />
                </span>
              </button>
            ))}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="free-play-picker"
        aria-labelledby="free-play-picker-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const r = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom
            )
              close();
          }
        }}
      >
        <header>
          <h2 id="free-play-picker-title">{selected ? t(`freeShelf.games.${selected.id}`) : ''}</h2>
          <button
            type="button"
            className="workspace-icon-button"
            onClick={close}
            aria-label={t('freeShelf.close')}
          >
            <X size={24} />
          </button>
        </header>
        <p>{t('freeShelf.chooseContent')}</p>
        <div className="free-play-book-tabs" role="group" aria-label={t('freeShelf.books')}>
          {books.map((unit) => (
            <button
              key={unit.levelKey}
              type="button"
              aria-pressed={currentBook === unit.levelKey}
              aria-label={levelName(t, unit)}
              title={levelName(t, unit)}
              onClick={() => setBook(unit.levelKey)}
            >
              {lang === 'english' ? `Book ${unit.levelIndex}` : levelName(t, unit)}
            </button>
          ))}
        </div>
        <div className="free-play-targets">
          {choices
            .filter((entry) => entry.unit.levelKey === currentBook)
            .map((entry) => (
              <Link
                key={entry.href}
                to={entry.href}
                onClick={close}
                data-selected={entry.unit.id === unitId || undefined}
              >
                <span>
                  <strong>
                    {entry.activity.kind === 'word-learning'
                      ? entry.unit.id.startsWith('en-b1') && entry.game === 'trace'
                        ? t('freeShelf.firstLetter')
                        : unitTitle(t, entry.unit)
                      : activityTitle(t, entry.activity)}
                  </strong>
                  {((entry.activity.kind !== 'word-learning' &&
                    activityTitle(t, entry.activity) !== unitTitle(t, entry.unit)) ||
                    entry.game === 'trace') && <small>{unitTitle(t, entry.unit)}</small>}
                </span>
                <StorybookSprite name="play" size={25} />
              </Link>
            ))}
        </div>
      </dialog>
    </section>
  );
}
