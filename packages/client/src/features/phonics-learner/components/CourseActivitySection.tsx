import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface CourseActivityItem {
  key: string;
  href: string;
  title: string;
  order: number;
  done: boolean;
  iconUrl?: string;
  illustration?: ReactNode;
}

/** 한글/영어 과정의 같은 선택·완료 계약. 활동별 데이터와 학습 순서는 호출부가 정한다. */
export function CourseActivitySection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: CourseActivityItem[];
}) {
  const id = useId();
  const { t } = useTranslation('phonics');
  if (!items.length) return null;
  return (
    <section aria-labelledby={id} className="course-activity-section">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-section-title font-display">
          {title}
        </h2>
        <p className="text-base leading-relaxed text-ink-600 break-keep">{subtitle}</p>
      </div>
      <div className="course-activity-grid">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className="course-activity-card"
            data-completed={item.done || undefined}
          >
            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-ink-600">
              <span className="grid size-7 place-items-center rounded-full bg-cream-100 text-ink-700">
                {item.order}
              </span>
              {item.done && (
                <span className="inline-flex items-center gap-1 text-mint-700">
                  ✓ <span>{t('study.activityDone')}</span>
                </span>
              )}
            </div>
            <div className="course-activity-art" aria-hidden="true">
              {item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="h-full max-h-20 w-full object-contain" />
              ) : (
                item.illustration
              )}
            </div>
            <h3 className="font-display text-base font-bold leading-snug text-ink-900 break-keep sm:text-lg">
              {item.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
