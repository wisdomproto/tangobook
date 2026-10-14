import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play } from 'lucide-react';
import { courseThemes } from '@/design-system';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { activityTitle, unitTitle } from '../lib/activity-title';
import { journeyActivityUrl, journeyProgress, type JourneyLanguage } from '../lib/learning-journey';
import { ToyHangul } from './ToyHangul';
import './curriculum-entry-dialog.css';

type Step = NonNullable<ReturnType<typeof journeyProgress>['current']>;

/** Only explicit mode entry requests this prompt; chapter returns remain unobstructed. */
export function CurriculumEntryDialog({
  lang,
  step,
  started,
}: {
  lang: JourneyLanguage;
  step: Step;
  started: boolean;
}) {
  const { t } = useTranslation('phonics');
  const [search, setSearch] = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = () => {
    const params = new URLSearchParams(search);
    params.delete('resume');
    setSearch(params, { replace: true });
  };
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="curriculum-entry-dialog"
      style={courseThemes[lang].style}
      aria-labelledby="curriculum-entry-title"
      aria-describedby="curriculum-entry-activity"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <div className="curriculum-entry-art" aria-hidden="true">
        {lang === 'korean' ? (
          <ToyHangul text={step.unit.phonemes[0]?.replace('받침', '') ?? ''} decorative />
        ) : (
          <StorybookSprite name="english" size={112} />
        )}
      </div>
      <p className="curriculum-entry-language">{t(`journey.${lang}`)}</p>
      <h2 id="curriculum-entry-title">{unitTitle(t, step.unit)}</h2>
      <p id="curriculum-entry-activity">{activityTitle(t, step.activity)}</p>
      <Link
        className="curriculum-entry-primary"
        data-sound="play"
        onClick={dismiss}
        to={journeyActivityUrl(lang, step.unit.id, step.activity.key)}
      >
        <Play size={23} fill="currentColor" aria-hidden="true" />
        {t(started ? 'journey.continue' : 'entry.firstStart')}
        <ArrowRight size={22} aria-hidden="true" />
      </Link>
      <button type="button" className="curriculum-entry-map" onClick={dismiss}>
        {t('entry.viewMap')}
      </button>
    </dialog>
  );
}
