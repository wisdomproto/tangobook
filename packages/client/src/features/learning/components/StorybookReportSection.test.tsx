import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { LearningEvent, LearningEventType, StorybookSummary } from '@tangobook/shared';
import { StorybookReportSection } from './StorybookReportSection';

// ── helpers ──────────────────────────────────────────────────────────────────

let idSeq = 0;
function ev(partial: Partial<LearningEvent>): LearningEvent {
  idSeq += 1;
  return {
    id: `e-${idSeq}`,
    profile_id: 'p1',
    event_type: 'page_read' as LearningEventType,
    storybook_id: null,
    game_type: null,
    word: null,
    metadata: {},
    created_at: '2026-07-01T05:00:00Z',
    ...partial,
  };
}

function book(
  partial: Partial<StorybookSummary> & { id: string; title: string }
): StorybookSummary {
  return {
    type: 'general',
    coverImage: undefined,
    artStyle: undefined,
    ...partial,
  } as StorybookSummary;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('StorybookReportSection', () => {
  it('renders completed book title when book is present in storybooks', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', lastPage: true, totalPages: 5 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.getByText('신데렐라')).toBeInTheDocument();
    expect(screen.getByText('1회 완독')).toBeInTheDocument();
  });

  it('skips completed book whose id is NOT in storybooks (no "(알 수 없는 책)")', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      // b2 is NOT in storybooks
      ev({
        event_type: 'page_read',
        storybook_id: 'b2',
        metadata: { lang: 'ko', lastPage: true, totalPages: 5 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.queryByText('(알 수 없는 책)')).not.toBeInTheDocument();
    // The section should still render without the unknown book
    expect(screen.queryByText('1회 완독')).not.toBeInTheDocument();
  });

  it('does NOT render "총 페이지" text anywhere (regression guard)', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.queryByText(/총 페이지/)).not.toBeInTheDocument();
  });

  it('renders 3 summary cards with 이번 주 / 분 / 연속 labels', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.getByText('이번 주')).toBeInTheDocument();
    expect(screen.getByText('분')).toBeInTheDocument();
    expect(screen.getByText('연속')).toBeInTheDocument();
  });

  it('renders 만난 단어 chips for word_exposed events', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        created_at: '2026-07-01T05:00:00Z',
      }),
      ev({
        event_type: 'word_exposed',
        word: '사과',
        metadata: { lang: 'ko' },
        created_at: '2026-07-01T05:01:00Z',
      }),
      ev({
        event_type: 'word_exposed',
        word: '바나나',
        metadata: { lang: 'ko' },
        created_at: '2026-07-01T05:02:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.getByText('이런 단어들을 만났어요')).toBeInTheDocument();
    expect(screen.getByText('사과')).toBeInTheDocument();
    expect(screen.getByText('바나나')).toBeInTheDocument();
  });

  it('does not render 만난 단어 section when no word events', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.queryByText('이런 단어들을 만났어요')).not.toBeInTheDocument();
  });

  it('resolves variant suffix (__L1) to base book', () => {
    const storybooks = [book({ id: 'b1', title: '백설공주' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1__L1',
        metadata: { lang: 'ko', lastPage: true, totalPages: 4 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    render(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    // Should resolve b1__L1 → b1 → '백설공주'
    expect(screen.getByText('백설공주')).toBeInTheDocument();
  });
});
