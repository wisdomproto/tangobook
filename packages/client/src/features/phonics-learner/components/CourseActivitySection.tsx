import { courseThemes, type CourseLanguage } from '@/design-system';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import type { CourseActivityMode } from '../lib/course-presentation';
import { CourseActivityVisual, courseActivityIcons } from './CourseActivityVisual';

export interface CourseActivityItem {
  key: string;
  href: string;
  title: string;
  order: number;
  done: boolean;
  iconUrl?: string;
  mode: CourseActivityMode;
  preview: string[];
}

/** 한글/영어 과정의 같은 선택·완료 계약. 활동별 데이터와 학습 순서는 호출부가 정한다. */
export function CourseActivitySection({
  language,
  title,
  subtitle,
  items,
  nextKey,
}: {
  language: CourseLanguage;
  title: string;
  subtitle: string;
  items: CourseActivityItem[];
  nextKey?: string;
}) {
  const theme = courseThemes[language];
  const id = useId();
  const { t } = useTranslation('phonics');
  if (!items.length) return null;
  return (
    <section aria-labelledby={id} className="course-activity-section" style={theme.style}>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className={`text-section-title font-display ${theme.text}`}>
          {title}
        </h2>
        <p className="text-base leading-relaxed text-ink-600 break-keep">{subtitle}</p>
      </div>
      <div className="course-activity-grid" data-count={items.length}>
        {items.map((item) => {
          const Icon = courseActivityIcons[item.mode];
          return (
            <Link
              key={item.key}
              to={item.href}
              className="course-activity-card"
              data-completed={item.done || undefined}
              data-next={item.key === nextKey || undefined}
            >
              <div className="flex items-center justify-between gap-2 text-sm font-semibold text-ink-600">
                <span className={`grid size-7 place-items-center rounded-full ${theme.badge}`}>
                  {item.order}
                </span>
                {item.key === nextKey && (
                  <span className="course-activity-next-label">{t('study.nextActivity')}</span>
                )}
                {item.done && (
                  <span className="inline-flex items-center gap-1 text-mint-700">
                    ✓ <span>{t('study.activityDone')}</span>
                  </span>
                )}
              </div>
              <CourseActivityVisual
                mode={item.mode}
                preview={item.preview}
                iconUrl={item.iconUrl}
              />
              <div className="course-activity-caption">
                <h3 className="font-display text-base font-bold leading-snug text-ink-900 break-keep">
                  {item.title}
                </h3>
                <div className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-ink-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon size={15} aria-hidden="true" />
                    {t(`study.mode.${item.mode}`)}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" className="course-activity-arrow" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
