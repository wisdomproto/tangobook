import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { courseThemes } from '@/design-system';
import {
  StorybookSprite,
  type StorybookSpriteName,
} from '@/design-system/primitives/StorybookSprite';
import { activityTitle } from '../lib/activity-title';
import { courseActivityMode } from '../lib/course-presentation';
import type { ActivityDef } from '../lib/korean-phonics-units';
import type { JourneyLanguage } from '../lib/learning-journey';
import './guided-activity-transition.css';

export const GUIDED_COMPLETION_MS = 1400;
export type GuidedCompletion = {
  kind: 'activity' | 'chapter' | 'review';
  nextActivity?: ActivityDef;
};

export function GuidedActivityTransition({
  lang,
  kind,
  nextActivity,
}: GuidedCompletion & { lang: JourneyLanguage }) {
  const { t } = useTranslation('phonics');
  const mode = nextActivity && courseActivityMode(nextActivity.kind);
  const icon: StorybookSpriteName =
    mode === 'write' || mode === 'draw'
      ? 'write'
      : mode === 'build' || mode === 'match'
        ? 'combine'
        : mode === 'find'
          ? 'compass'
          : nextActivity
            ? 'listen'
            : 'book';
  const title = t(kind === 'chapter' ? 'transition.chapterDone' : 'transition.activityDone');
  return (
    <div
      className="guided-completion storybook-scope"
      style={courseThemes[lang].style}
      role="status"
      aria-label={title}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="guided-completion-ribbon">
        <div className="guided-completion-heading">
          <StorybookSprite name="check" size={62} />
          <strong>{title}</strong>
        </div>
        <div className="guided-completion-next">
          <StorybookSprite name={icon} size={58} />
          <div>
            <span>
              {t(kind === 'activity' ? 'transition.nextActivity' : 'transition.backToMap')}
            </span>
            <strong>{nextActivity ? activityTitle(t, nextActivity) : t('flow.pathTitle')}</strong>
          </div>
          <ArrowRight className="guided-completion-arrow" size={28} aria-hidden="true" />
        </div>
        <div className="guided-completion-track" aria-hidden="true">
          <span style={{ animationDuration: `${GUIDED_COMPLETION_MS}ms` }} />
        </div>
      </div>
    </div>
  );
}
