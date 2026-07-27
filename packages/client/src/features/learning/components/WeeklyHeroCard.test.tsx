/** WeeklyHeroCard — 이번 주 한 줄 요약 헤드라인 (구 ParentReportsPage 헤더 카피의 현 위치). */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyHeroCard } from './WeeklyHeroCard';
import type { WeekDay } from '../lib/aggregate';

const days: WeekDay[] = ['일', '월', '화', '수', '목', '금', '토'].map((label, i) => ({
  key: `d${i}`,
  label,
  active: false,
}));

describe('WeeklyHeroCard', () => {
  // 🔴 헤드라인은 **오늘** — 부모가 이 화면을 여는 시각은 아이를 재운 뒤고, 묻고 싶은 건 "오늘 뭐 했어".
  it('오늘 읽었으면 오늘 읽은 책·시간이 헤드라인', () => {
    render(
      <WeeklyHeroCard
        todayMinutes={12}
        todayBookTitle="토끼와 거북이"
        prevWeekBooks={0}
        weekBooks={1}
        weekMinutes={12}
        streak={0}
        days={days}
      />
    );
    expect(screen.getByText(/토끼와 거북이/)).toBeInTheDocument();
    expect(screen.getAllByText(/12분/).length).toBeGreaterThan(0);
  });

  it('오늘 안 했지만 이번 주 활동이 있으면 나무라지 않고 사실만', () => {
    render(
      <WeeklyHeroCard
        todayMinutes={0}
        prevWeekBooks={0}
        weekBooks={1}
        weekMinutes={0}
        streak={0}
        days={days}
      />
    );
    expect(screen.getByText('오늘은 아직이에요')).toBeInTheDocument();
  });

  // 🔴 칭찬을 데이터와 무관하게 늘 켜두면 칭찬을 안 믿게 된다 — 지난주와 견준다.
  it('지난주보다 늘면 늘었다고, 줄면 쉬어갔다고 말한다', () => {
    const { unmount } = render(
      <WeeklyHeroCard
        todayMinutes={0}
        prevWeekBooks={1}
        weekBooks={3}
        weekMinutes={0}
        streak={0}
        days={days}
      />
    );
    expect(screen.getByText(/2권 늘었어요/)).toBeInTheDocument();
    unmount();
    render(
      <WeeklyHeroCard
        todayMinutes={0}
        prevWeekBooks={5}
        weekBooks={2}
        weekMinutes={0}
        streak={0}
        days={days}
      />
    );
    expect(screen.getByText(/쉬어갔어요/)).toBeInTheDocument();
  });

  it('이번 주 읽은 책이 없으면 응원 톤 빈 상태 헤드라인', () => {
    render(
      <WeeklyHeroCard
        todayMinutes={0}
        prevWeekBooks={0}
        weekBooks={0}
        weekMinutes={0}
        streak={0}
        days={days}
      />
    );
    expect(screen.getByText('이번 주 첫 책을 기다리고 있어요')).toBeInTheDocument();
    expect(screen.getByText(/오늘 한 권, 함께 펼쳐볼까요/)).toBeInTheDocument();
  });

  it('읽은 시간·연속일 메타는 조건부 (분>0, streak≥2)', () => {
    render(
      <WeeklyHeroCard
        todayMinutes={0}
        prevWeekBooks={0}
        weekBooks={3}
        weekMinutes={12}
        streak={2}
        days={days}
      />
    );
    expect(screen.getByText(/이번 주 약 12분/)).toBeInTheDocument();
    expect(screen.getByText(/연속 2일/)).toBeInTheDocument();
  });
});
