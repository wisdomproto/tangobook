import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import { KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';
import { PhonicsSummaryCard } from './PhonicsSummaryCard';

const units: ReadonlyArray<{ id: string; title: string }> = KOREAN_PHONICS_CURRICULUM.flatMap(
  (l) => [...l.units]
);
const total = units.length;

const book = (id: string): StorybookSummary =>
  ({ id, title: id, type: 'phonics' }) as unknown as StorybookSummary;

const readEvent = (unitId: string): LearningEvent =>
  ({
    id: unitId,
    event_type: 'page_read',
    storybook_id: unitId,
    created_at: new Date().toISOString(),
    metadata: { source: 'phonics' },
  }) as unknown as LearningEvent;

const show = (events: LearningEvent[]) =>
  render(
    <MemoryRouter>
      <PhonicsSummaryCard events={events} storybooks={units.map((u) => book(u.id))} lang="ko" />
    </MemoryRouter>
  );

describe('PhonicsSummaryCard', () => {
  it('마친 단원 수를 문장으로 말한다', () => {
    show([readEvent(units[0].id), readEvent(units[1].id)]);
    expect(screen.getByText(new RegExp(`${total}단원 중 2단원`))).toBeInTheDocument();
  });

  // 🔴 "지금 뭘 하고 있나" = 아직 안 한 **첫** 단원. 커리큘럼 순서가 곧 학습 순서다.
  it('다음에 할 단원과 그리로 가는 링크를 준다', () => {
    show([readEvent(units[0].id)]);
    expect(screen.getByText(new RegExp(units[1].title))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이어서 하기' })).toHaveAttribute(
      'href',
      `/library/phonics/korean/${units[1].id}`
    );
  });

  // 🔴 기록이 하나도 없으면 **카드를 안 그린다** — 아래 표가 이미 빈 상태를 보여주는데
  //    위에서 "아직 시작 안 함" 을 선언하면, 기록이 있는데도 그렇게 뜨는 순간 거짓말이 된다.
  it('기록이 없으면 카드를 그리지 않는다', () => {
    const { container } = show([]);
    expect(container).toBeEmptyDOMElement();
  });
});
