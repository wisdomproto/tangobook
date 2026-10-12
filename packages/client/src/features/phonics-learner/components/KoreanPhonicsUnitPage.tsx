import { courseThemes } from '@/design-system';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KOREAN_BASIC_VOWEL_GROUPS, type Storybook } from '@tangobook/shared';
import { useState } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { getKoreanUnit, getActivityPlan, getRequiredActivities } from '../lib/korean-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { isPhonicsActivityAvailable } from '../lib/phonics-game-adapter';
import { usePhonicsProgress } from '../lib/progress-store';
import { learnedVowelCards } from '../lib/korean-vowel-play';
import { activityTitle, unitTitle } from '../lib/activity-title';
import { CourseUnitHero } from './CourseUnitHero';
import { courseActivityMode, courseActivityPreview } from '../lib/course-presentation';
import { CourseActivitySection, type CourseActivityItem } from './CourseActivitySection';
import { ToyHangul } from './ToyHangul';

export default function KoreanPhonicsUnitPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t } = useTranslation('phonics');
  const { unitId = '' } = useParams<{ unitId: string }>();
  const unit = getKoreanUnit(unitId);
  const plan = getActivityPlan(unitId);
  const { unitCompletedActivities } = usePhonicsProgress('korean');
  const completed = unitCompletedActivities(unitId);
  const group = KOREAN_BASIC_VOWEL_GROUPS.find((item) => item.id === unitId);
  const [selection, setSelection] = useState<{ unitId: string; index: number } | null>(null);
  const learned = learnedVowelCards(unitId, unitCompletedActivities);
  const storybook = useStorybook(
    unit?.isReview || unit?.levelKey === 'hangul-vowels'
      ? undefined
      : (unit?.sourceUnitId ?? unitId)
  ).data as Storybook | undefined;

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
        mode: courseActivityMode(activity.kind),
        preview:
          group && activity.section === 'play'
            ? learned.map((card) => card.letter)
            : courseActivityPreview(activity),
        iconUrl: KIND_ICON_URL[activity.kind],
        repetitions:
          activity.kind === 'vowel-listen' && unit.levelKey === 'hangul-vowels' ? 3 : undefined,
      }));

  const learnItems = items('learn');
  const playItems = group && learned.length < 2 ? [] : items('play');
  const visibleItems = [...learnItems, ...playItems];
  const nextKey = visibleItems.find((item) => !item.done)?.key;
  const nextLearnIndex = group
    ? group.lessons.findIndex(
        (_, index) =>
          !completed.includes(`listen-${index + 1}`) || !completed.includes(`write-${index + 1}`)
      )
    : -1;
  const selectedIndex =
    selection?.unitId === unitId ? selection.index : Math.max(0, nextLearnIndex);

  return (
    <div
      className="course-unit-content mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6"
      data-vowel-group={group ? true : undefined}
    >
      {!embedded && (
        <Link
          to="/library/phonics/korean"
          className="mb-4 inline-flex min-h-11 items-center font-semibold text-ink-600"
        >
          {t('common.backToUnitList')}
        </Link>
      )}
      <CourseUnitHero
        language="korean"
        unit={unit}
        required={getRequiredActivities(unitId)}
        completed={completed}
        items={visibleItems}
      />
      {!plan.activities.length ? (
        <div className="rounded-card border border-ink-100 bg-white p-6 text-ink-600">
          {t('common.noActivitiesYet')}
        </div>
      ) : (
        <div className="space-y-8">
          {group ? (
            <div className="vowel-group-learning">
              <div className="vowel-group-step-heading">
                <h2 className="font-display text-section-title text-ink-900">
                  {t('vowelGroup.oneAtATime')}
                </h2>
                <p className="text-sm text-ink-600">{t('vowelGroup.stepSubtitle')}</p>
              </div>
              <div className="vowel-group-steps" aria-label={t('vowelGroup.chooseLetter')}>
                {group.lessons.map((lesson, index) => {
                  const done =
                    completed.includes(`listen-${index + 1}`) &&
                    completed.includes(`write-${index + 1}`);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className="vowel-group-step"
                      aria-pressed={selectedIndex === index}
                      aria-label={t('activity.consonantLearn', { letter: lesson.vowel })}
                      data-completed={done || undefined}
                      onClick={() => setSelection({ unitId, index })}
                    >
                      <span className="vowel-group-step-number">{done ? '✓' : index + 1}</span>
                      <ToyHangul text={lesson.vowel} decorative />
                      <span className="vowel-group-step-caption">
                        {t(done ? 'study.activityDone' : 'section.learn')}
                      </span>
                    </button>
                  );
                })}
              </div>
              <CourseActivitySection
                language="korean"
                title={t('vowelGroup.currentLetter', {
                  letter: group.lessons[selectedIndex].vowel,
                })}
                subtitle={t('section.learnSubtitleWrite')}
                items={learnItems.slice(selectedIndex * 2, selectedIndex * 2 + 2)}
                nextKey={nextKey}
              />
            </div>
          ) : (
            <CourseActivitySection
              language="korean"
              title={t('section.learn')}
              subtitle={t('section.learnSubtitleWrite')}
              items={learnItems}
              nextKey={nextKey}
            />
          )}
          {group && learned.length < 2 && (
            <div className="vowel-group-play-intro">
              <span className="vowel-group-seed" aria-hidden>
                🌱
              </span>
              <div>
                <h2 className="font-display text-xl text-ink-900">{t('vowelGroup.play')}</h2>
                <p className="mt-1 text-sm text-ink-600">{t('vowelGroup.learnFirst')}</p>
              </div>
            </div>
          )}
          <CourseActivitySection
            language="korean"
            title={
              group
                ? t('vowelGroup.play')
                : unit.isReview
                  ? unitTitle(t, unit)
                  : t('section.wordPlay')
            }
            subtitle={
              group
                ? t(group.reviewAll ? 'vowelGroup.reviewSubtitle' : 'vowelGroup.playSubtitle')
                : t('section.wordPlaySubtitle')
            }
            items={playItems}
            nextKey={nextKey}
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
