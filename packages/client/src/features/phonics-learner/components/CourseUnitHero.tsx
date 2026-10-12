import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseThemes, type CourseLanguage } from '@/design-system';
import { levelName, unitTitle } from '../lib/activity-title';
import { courseUnitPreview } from '../lib/course-presentation';
import { progressPercent } from '../lib/unit-progress';
import type { KoreanUnitSummary } from '../lib/korean-phonics-units';
import type { EnglishUnitSummary } from '../lib/english-phonics-units';
import type { CourseActivityItem } from './CourseActivitySection';

export function CourseUnitHero({
  language,
  unit,
  required,
  completed,
  items,
}: {
  language: CourseLanguage;
  unit: KoreanUnitSummary | EnglishUnitSummary;
  required: readonly string[];
  completed: string[];
  items: CourseActivityItem[];
}) {
  const { t } = useTranslation('phonics');
  const theme = courseThemes[language];
  const letters = courseUnitPreview(unit);
  const done = required.filter((key) => completed.includes(key)).length;
  const percent = progressPercent(done, required.length);
  const next = items.find((item) => !item.done);
  const action = next ?? items[0];
  const title = unitTitle(t, unit).replace(/^unit\s+\d+:\s*/i, '');
  return (
    <header className="course-unit-hero" style={theme.style} data-language={language}>
      <div className="course-unit-intro">
        <p className="mb-2 text-sm font-semibold text-ink-600">{levelName(t, unit)}</p>
        <h1 className="font-display text-page-title break-keep">{title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {action && (
            <Link
              to={action.href}
              className={`inline-flex min-h-12 items-center gap-3 rounded-xl px-4 text-base font-bold ${theme.action} ${theme.focus}`}
            >
              {next
                ? t(done > 0 ? 'study.resumeActivity' : 'study.startActivity')
                : t('study.repeatActivity')}
              {next ? (
                <ArrowRight size={20} aria-hidden="true" />
              ) : (
                <RotateCcw size={19} aria-hidden="true" />
              )}
            </Link>
          )}
          {required.length > 0 && (
            <div className="course-unit-progress">
              <p className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-ink-600">
                {percent === 100 && (
                  <Check size={16} className="text-mint-700" aria-hidden="true" />
                )}
                {t('study.unitProgress', { done, total: required.length })}
              </p>
              <div
                role="progressbar"
                aria-label={t('study.progressLabel')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-1.5 overflow-hidden rounded-full bg-white/80"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, background: 'var(--course-accent)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {letters.length > 0 && (
        <div
          className="course-unit-preview"
          aria-label={t(unit.isReview ? 'study.reviewLetters' : 'study.unitLetters')}
        >
          <p className="mb-2 text-sm font-semibold text-ink-600">
            {t(unit.isReview ? 'study.reviewLetters' : 'study.unitLetters')}
          </p>
          <div className="course-unit-letter-list">
            {letters.slice(0, 4).map((letter, index) => (
              <span className="course-unit-letter" key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
            {letters.length > 4 && (
              <span className="text-base font-bold text-ink-600">+{letters.length - 4}</span>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
