import { useTranslation } from 'react-i18next';
import { Mascot } from '@/design-system';
import type { WeekDay } from '../lib/aggregate';

interface Props {
  /** 오늘 읽은 시간(분). 0 이면 '오늘은 아직'. */
  todayMinutes: number;
  /** 오늘 읽은 책 제목 (가장 최근 1권). */
  todayBookTitle?: string;
  /** 지난주(7~14일 전) 읽은 책 수 — 이번 주와 비교해 늘었는지 보여준다. */
  prevWeekBooks: number;
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
export function WeeklyHeroCard({
  todayMinutes,
  todayBookTitle,
  prevWeekBooks,
  weekBooks,
  weekMinutes,
  streak,
  days,
}: Props) {
  const { t } = useTranslation('learning');
  const active = weekBooks > 0;

  /**
   * 🔴 **헤드라인은 「오늘」이다** — 부모가 이 화면을 여는 시각은 대부분 아이를 재운 뒤고,
   *    묻고 싶은 건 "오늘 뭐 했어?" 인데 예전엔 이번 주 얘기만 해서 7일 도트를 눈으로 세야 했다.
   *    오늘 안 했으면 나무라지 않고 사실만 말한다.
   */
  const didToday = todayMinutes > 0;
  const headline = didToday
    ? todayBookTitle
      ? t('weeklyHero.todayWithBook', { title: todayBookTitle, minutes: todayMinutes })
      : t('weeklyHero.todayMinutes', { minutes: todayMinutes })
    : active
      ? t('weeklyHero.todayNone')
      : t('weeklyHero.headlineEmpty');

  /**
   * 🔴 칭찬을 데이터와 무관하게 늘 켜두면 칭찬을 안 믿게 된다 — 지난주와 견줘 말한다.
   */
  const sub = !active
    ? t('weeklyHero.subEmpty')
    : weekBooks > prevWeekBooks
      ? t('weeklyHero.subUp', { delta: weekBooks - prevWeekBooks })
      : weekBooks === prevWeekBooks
        ? t('weeklyHero.subSame')
        : t('weeklyHero.subDown');

  const meta: string[] = [];
  if (weekBooks > 0) meta.push(t('weeklyHero.metaBooks', { count: weekBooks }));
  if (weekMinutes > 0) meta.push(t('weeklyHero.metaMinutes', { minutes: weekMinutes }));
  if (streak >= 2) meta.push(t('weeklyHero.metaStreak', { streak }));

  return (
    <div className="rounded-3xl bg-gradient-to-br from-peach-100 to-coral-100 p-5 sm:p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Mascot state={didToday ? 'celebrating' : 'waving'} size="lg" character="hori" />
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
