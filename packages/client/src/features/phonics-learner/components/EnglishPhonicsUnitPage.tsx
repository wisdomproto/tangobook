import { courseThemes } from '@/design-system';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import {
  getEnglishUnit,
  getEnglishActivityPlan,
  getEnglishRequiredActivities,
} from '../lib/english-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { isPhonicsActivityAvailable } from '../lib/phonics-game-adapter';
import { usePhonicsProgress } from '../lib/progress-store';
import { activityTitle, unitTitle } from '../lib/activity-title';
import { CourseUnitHero } from './CourseUnitHero';
import { courseActivityMode, courseActivityPreview } from '../lib/course-presentation';
import { CourseActivitySection, type CourseActivityItem } from './CourseActivitySection';

export default function EnglishPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t } = useTranslation('phonics');
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getEnglishUnit(unitId);
  const plan = getEnglishActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('english');
  const completed = unitCompletedActivities(unitId);
  const storybook = useStorybook(unitId).data as Storybook | undefined;

  if (!unit)
    return (
      <div className="px-4 py-6 text-ink-700">
        <p>{t('common.unknownUnit')}</p>
        <Link
          to="/library/phonics/english"
          className={`inline-flex min-h-11 items-center underline ${courseThemes.english.text} ${courseThemes.english.focus}`}
        >
          {t('common.backToEnglish')}
        </Link>
      </div>
    );

  const items = (section: 'learn' | 'play'): CourseActivityItem[] =>
    plan.activities
      .filter(
        (activity) =>
          activity.section === section &&
          (section === 'learn' || isPhonicsActivityAvailable(activity.kind, storybook))
      )
      .map((activity) => ({
        key: activity.key,
        href: `/library/phonics/english/${unitId}/${activity.key}`,
        title: activityTitle(t, activity),
        order: activity.order,
        done: completed.includes(activity.key),
        mode: courseActivityMode(activity.kind),
        preview: courseActivityPreview(activity),
        iconUrl: KIND_ICON_URL[activity.kind],
      }));

  const learnItems = items('learn');
  const playItems = items('play');
  const visibleItems = [...learnItems, ...playItems];
  const nextKey = visibleItems.find((item) => !item.done)?.key;

  return (
    <div className="course-unit-content mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      {!embedded && (
        <Link
          to="/library/phonics/english"
          className="mb-4 inline-flex min-h-11 items-center font-semibold text-ink-600"
        >
          {t('common.backToUnitList')}
        </Link>
      )}
      <CourseUnitHero
        language="english"
        unit={unit}
        required={getEnglishRequiredActivities(unitId)}
        completed={completed}
        items={visibleItems}
      />
      {!plan.activities.length ? (
        <div className="rounded-card border border-ink-100 bg-white p-6 text-ink-600">
          {t('common.noActivitiesYet')}
        </div>
      ) : (
        <div className="space-y-8">
          <CourseActivitySection
            language="english"
            title={t('section.learn')}
            subtitle={t('section.learnSubtitleListen')}
            items={learnItems}
            nextKey={nextKey}
          />
          <CourseActivitySection
            language="english"
            title={unit.isReview ? unitTitle(t, unit) : t('section.games')}
            subtitle={t('section.gamesSubtitle')}
            items={playItems}
            nextKey={nextKey}
          />
        </div>
      )}
    </div>
  );
}

const KIND_ICON_URL: Partial<Record<ActivityDef['kind'], string>> = {
  // 학습 — Book 1 알파벳 배우기/쓰기 모두 카드 안에서 큰 글자 직접 렌더 (ActivityCard 분기 참고)
  // 학습 — CVC 배우기/쓰기 (Book 2)
  'cvc-pattern-learn': '/icons/activity/cvc-learn.webp',
  'word-listen-choose': '/icons/activity/cvc-learn.webp',
  'review-listen': '/icons/activity/cvc-learn.webp',
  'review-write': '/icons/activity/cvc-write.webp',
  'cvc-pattern-write': '/icons/activity/cvc-write.webp',
  'alphabet-letter-write': '/icons/activity/cvc-write.webp',
  // 게임 (한글 파닉스 동일 webp 재사용)
  'game-english-block': '/icons/game/korean-block.webp', // 블록 일러
  'game-word-writing': '/icons/game/word-writing.webp',
  'game-connect-dots': '/icons/game/connect-dots.webp',
  'game-line-matching': '/icons/game/line-matching.webp',
};
