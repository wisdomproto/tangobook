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
  it('이번 주 읽은 책이 있으면 "N권을 만났어요" 헤드라인', () => {
    render(<WeeklyHeroCard weekBooks={1} weekMinutes={0} streak={0} days={days} />);
    expect(screen.getByText(/이번 주 책 1권을 만났어요/)).toBeInTheDocument();
    expect(screen.getByText(/꾸준히 잘하고 있어요/)).toBeInTheDocument();
  });

  it('이번 주 읽은 책이 없으면 응원 톤 빈 상태 헤드라인', () => {
    render(<WeeklyHeroCard weekBooks={0} weekMinutes={0} streak={0} days={days} />);
    expect(screen.getByText('이번 주 첫 책을 기다리고 있어요')).toBeInTheDocument();
    expect(screen.getByText(/오늘 한 권, 함께 펼쳐볼까요/)).toBeInTheDocument();
  });

  it('읽은 시간·연속일 메타는 조건부 (분>0, streak≥2)', () => {
    render(<WeeklyHeroCard weekBooks={3} weekMinutes={12} streak={2} days={days} />);
    expect(screen.getByText(/이번 주 약 12분/)).toBeInTheDocument();
    expect(screen.getByText(/연속 2일/)).toBeInTheDocument();
  });
});
