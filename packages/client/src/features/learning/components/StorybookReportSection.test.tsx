import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { LearningEvent, LearningEventType, StorybookSummary } from '@tangobook/shared';
import { StorybookReportSection } from './StorybookReportSection';

// ── helpers ──────────────────────────────────────────────────────────────────

// ArtStyleGenreCard → useStyleGenreLabel 이 style-genre-map / art-style-library 를
// react-query 로 조회한다. 테스트는 라벨 폴백("그림체 N")만 검증하므로 enabled:false 로 네트워크를 끊고,
// useQueryClient 자체는 Provider 없이는 throw 하므로 감싸야 한다.
function renderSection(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

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
  it('renders completed book title with 끝까지 읽음 ribbon', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', lastPage: true, totalPages: 5 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.getByText('신데렐라')).toBeInTheDocument();
    expect(screen.getByText(/끝까지 읽음/)).toBeInTheDocument();
  });

  it('renders in-progress book with 읽는 중 chip (완독 게이트 없음)', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        created_at: '2026-07-01T05:00:00Z',
      }),
    ];
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.getByText('신데렐라')).toBeInTheDocument();
    expect(screen.getByText('읽는 중')).toBeInTheDocument();
  });

  it('skips book whose id is NOT in storybooks (no "(알 수 없는 책)")', () => {
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
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.queryByText('(알 수 없는 책)')).not.toBeInTheDocument();
    // The section should still render without the unknown book
    expect(screen.queryByText(/끝까지 읽음/)).not.toBeInTheDocument();
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
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    expect(screen.queryByText(/총 페이지/)).not.toBeInTheDocument();
  });

  it('renders weekly hero card with headline (활동 있으면 N권)', () => {
    const storybooks = [book({ id: 'b1', title: '신데렐라' })];
    const events = [
      ev({
        event_type: 'page_read',
        storybook_id: 'b1',
        metadata: { lang: 'ko', page: 1 },
        // 히어로는 렌더 시점 기준 7일 창 — 테스트 고정 날짜 대신 현재 시각 사용
        created_at: new Date().toISOString(),
      }),
    ];
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    // 🔴 오늘 이벤트이므로 헤드라인은 **오늘** 기준이고, 주간 수치는 메타 줄로 내려간다.
    expect(screen.getAllByText(/오늘/).length).toBeGreaterThan(0);
    expect(screen.getByText(/이번 주 1권/)).toBeInTheDocument();
  });

  it('renders encouraging hero when no activity this week', () => {
    // 빈 상태 CTA(<Link>) 때문에 Router 컨텍스트 필요
    renderSection(
      <MemoryRouter>
        <StorybookReportSection events={[]} storybooks={[]} lang="ko" />
      </MemoryRouter>
    );
    expect(screen.getByText('이번 주 첫 책을 기다리고 있어요')).toBeInTheDocument();
    expect(screen.getByText('동화책 보러 가기')).toBeInTheDocument();
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
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
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
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
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
    renderSection(<StorybookReportSection events={events} storybooks={storybooks} lang="ko" />);
    // Should resolve b1__L1 → b1 → '백설공주'
    expect(screen.getByText('백설공주')).toBeInTheDocument();
  });
});
