import { courseThemes } from '@/design-system';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Storybook } from '@tangobook/shared';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { getKoreanUnit, getActivityPlan } from '../lib/korean-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { isPhonicsActivityAvailable } from '../lib/phonics-game-adapter';
import { usePhonicsProgress } from '../lib/progress-store';
import { activityTitle, unitTitle } from '../lib/activity-title';
import { CourseActivitySection, type CourseActivityItem } from './CourseActivitySection';

export default function KoreanPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t } = useTranslation('phonics');
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('korean');
  const completed = unitCompletedActivities(unitId);
  const storybook = useStorybook(unitId).data as Storybook | undefined;

  if (!unit)
    return (
      <div className="px-4 py-6 text-ink-700">
        <p>{t('common.unknownUnit')}</p>
        <Link
          to="/library/phonics/korean"
          className={`inline-flex min-h-11 items-center underline ${courseThemes.korean.text} ${courseThemes.korean.focus}`}
        >
          {t('common.backToKorean')}
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
        href: `/library/phonics/korean/${unitId}/${activity.key}`,
        title: activityTitle(t, activity),
        order: activity.order,
        done: completed.includes(activity.key),
        iconUrl: KIND_ICON_URL[activity.kind],
        illustration: <span className="text-5xl">{activity.emoji}</span>,
      }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {!embedded && (
        <Link
          to="/library/phonics/korean"
          className="mb-4 inline-flex min-h-11 items-center font-semibold text-ink-600"
        >
          {t('common.backToUnitList')}
        </Link>
      )}
      <h1 className="text-page-title font-display mb-6">{unitTitle(t, unit)}</h1>
      {!plan.activities.length ? (
        <div className="rounded-card border border-ink-100 bg-white p-6 text-ink-600">
          {t('common.noActivitiesYet')}
        </div>
      ) : (
        <div className="space-y-8">
          <CourseActivitySection
            language="korean"
            title={t('section.learn')}
            subtitle={t('section.learnSubtitleWrite')}
            items={items('learn')}
          />
          <CourseActivitySection
            language="korean"
            title={unit.isReview ? unitTitle(t, unit) : t('section.wordPlay')}
            subtitle={t('section.wordPlaySubtitle')}
            items={items('play')}
          />
        </div>
      )}
    </div>
  );
}

const KIND_ICON_URL: Partial<Record<ActivityDef['kind'], string>> = {
  // 학습 — 듣기/누르기/음절 = 블록 두 개 합쳐지는 일러
  'vowel-listen': '/icons/activity/cvc-learn.webp',
  'consonant-tap': '/icons/activity/cvc-learn.webp',
  'consonant-blend-listen': '/icons/activity/cvc-learn.webp',
  'coda-blend-listen': '/icons/activity/cvc-learn.webp',
  // 복습 — 익숙한 활동과 같은 그림을 써서 "해본 것"으로 읽히게 한다
  'word-listen-choose': '/icons/activity/cvc-learn.webp',
  'review-listen': '/icons/activity/cvc-learn.webp',
  // 🔴 글자 사냥은 **아이콘을 주지 않는다** → 🔎 이모지 폴백. 예전엔 `connect-dots.webp` 를 썼는데,
  //    학습 단원에도 들어오면서 같은 화면 아래쪽 「낱말 그리기」와 **그림이 똑같아졌다**.
  //    글자를 못 읽는 아이는 그림으로 활동을 구분한다 — 같은 그림 두 장은 같은 활동으로 읽힌다.
  'review-flip': '/icons/game/korean-block.webp',
  'review-match': '/icons/game/line-matching.webp',
  'review-write': '/icons/game/word-writing-ko.webp',
  // 학습 — 쓰기 = 미소짓는 연필
  'vowel-write': '/icons/activity/cvc-write.webp',
  'consonant-write': '/icons/activity/cvc-write.webp',
  // 게임
  'game-korean-block': '/icons/game/korean-block.webp',
  // 🔴 영어판(word-writing.webp)은 연필이 알파벳 A 를 쓴다 — 한글 단원엔 한글판을 쓴다.
  'game-word-writing': '/icons/game/word-writing-ko.webp',
  'game-connect-dots': '/icons/game/connect-dots.webp',
  'game-line-matching': '/icons/game/line-matching.webp',
};
