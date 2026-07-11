import { useTranslation } from 'react-i18next';
import { Mascot } from '@/design-system';
import type { WeekDay } from '../lib/aggregate';

interface Props {
  /** 이번 주(7일) 읽은 책 수 */
  weekBooks: number;
  /** 이번 주(7일) 읽은 시간(분) */
  weekMinutes: number;
  /** 연속 읽기 일수 */
  streak: number;
  /** 최근 7일 리듬 (weekActivity) */
  days: WeekDay[];
}

/**
 * 리포트 최상단 히어로 — "숫자 대시보드"가 아니라 "우리 아이 이야기"로 시작.
 * 호리 + 이번 주 한 줄 요약 + 읽기 리듬 도트. 숫자 0일 때도 응원 톤 유지.
 */
export function WeeklyHeroCard({ weekBooks, weekMinutes, streak, days }: Props) {
  const { t } = useTranslation('learning');
  const active = weekBooks > 0;
  const headline = active
    ? t('weeklyHero.headlineActive', { count: weekBooks })
    : t('weeklyHero.headlineEmpty');
  const sub = active ? t('weeklyHero.subActive') : t('weeklyHero.subEmpty');

  const meta: string[] = [];
  if (weekMinutes > 0) meta.push(t('weeklyHero.metaMinutes', { minutes: weekMinutes }));
  if (streak >= 2) meta.push(t('weeklyHero.metaStreak', { streak }));

  return (
    <div className="rounded-3xl bg-gradient-to-br from-peach-100 to-coral-100 p-5 sm:p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Mascot state={active ? 'celebrating' : 'waving'} size="lg" character="hori" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl sm:text-2xl font-black text-ink-900 leading-tight break-keep">
            {headline}
          </h3>
          <p className="mt-1 text-sm font-bold text-ink-600 break-keep">{sub}</p>
          {meta.length > 0 && (
            <p className="mt-2 text-sm font-black text-ink-700">{meta.join(' · ')}</p>
          )}
        </div>
      </div>

      {/* 최근 7일 읽기 리듬 — 엄마가 3초 만에 패턴 파악 */}
      <div className="mt-4 flex justify-between gap-1 rounded-2xl bg-white/50 px-3 py-2.5 sm:px-5">
        {days.map((d, i) => {
          const isToday = i === days.length - 1;
          return (
            <div key={d.key} className="flex flex-col items-center gap-1">
              <span
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs ' +
                  (d.active
                    ? 'bg-coral-500 text-white font-black shadow-soft'
                    : 'bg-ink-100 text-transparent')
                }
                aria-label={
                  d.active
                    ? t('weeklyHero.readOn', { label: d.label })
                    : t('weeklyHero.notReadOn', { label: d.label })
                }
              >
                {d.active ? '✓' : '·'}
              </span>
              <span
                className={
                  'text-[10px] font-bold ' +
                  (isToday ? 'text-coral-600' : d.active ? 'text-ink-600' : 'text-ink-300')
                }
              >
                {isToday ? t('weeklyHero.today') : d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
