import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../src/i18n';
import '../src/index.css';
import { LearningOverview } from '../src/features/learning/components/LearningOverview';
import type { LearningEvent, StorybookSummary } from '@tangobook/shared';
import cover from '../../../docs/marketing/assets/strategy-20261005/duck-book-cover.webp';
await i18n.changeLanguage('ko');
const labels = [
  '오리',
  '나무',
  '사과',
  '바다',
  '가방',
  '나비',
  '기차',
  '토끼',
  '강아지',
  '별',
  '고양이',
  '하마',
  '개구리',
  '달',
  '자동차',
];
const now = new Date();
const ts = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
};
const events: LearningEvent[] = labels.flatMap((word, index) => [
  {
    id: 'ex' + index,
    profile_id: 'demo',
    event_type: 'word_exposed',
    word,
    storybook_id: 'demo-book',
    game_type: null,
    created_at: ts(index % 5),
    metadata: { lang: 'ko', source: 'storybook' },
  },
  ...(index % 3 === 0
    ? [
        {
          id: 'pr' + index,
          profile_id: 'demo',
          event_type: 'word_correct' as const,
          word,
          storybook_id: 'demo-book',
          game_type: 'korean-block',
          created_at: ts(0),
          metadata: {
            lang: 'ko' as const,
            source: 'storybook' as const,
            skill: 'building' as const,
            firstAttempt: true,
            evidence: 'first-attempt' as const,
          },
        },
      ]
    : []),
]);
for (const word of ['cat', 'Apple', 'duck', 'elephant', 'aVeryLongWordForResponsiveTesting'])
  events.push({
    id: word,
    profile_id: 'demo',
    event_type: 'word_exposed',
    word,
    storybook_id: 'demo-book',
    game_type: null,
    created_at: ts(0),
    metadata: { lang: 'en', source: 'storybook' },
  });
const books = [
  { id: 'demo-book', title: '오리와 이야기 놀이', coverImage: cover },
] as StorybookSummary[];
function Frame() {
  const [mode, setMode] = useState('normal');
  useEffect(() => {
    const measure = () =>
      parent.postMessage(
        {
          type: 'report-qa',
          width: window.innerWidth,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          modal: !!document.querySelector('dialog[open]'),
        },
        '*'
      );
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <BrowserRouter>
      <main className="mx-auto max-w-5xl bg-cream-50 px-4 py-5">
        <p className="text-xs text-ink-500">검수용 가상 아이·기록 / 실제 제품 컴포넌트</p>
        <h1 className="my-4 text-2xl font-black">하린이의 학습 이야기</h1>
        <div className="mb-3 flex gap-2">
          <button className="rounded bg-white p-2" onClick={() => setMode('normal')}>
            예시 기록
          </button>
          <button className="rounded bg-white p-2" onClick={() => setMode('empty')}>
            기록 없음
          </button>
          <button className="rounded bg-white p-2" onClick={() => setMode('partial')}>
            일부 기록
          </button>
        </div>
        <LearningOverview
          events={mode === 'empty' ? [] : events}
          storybooks={books}
          capped={mode === 'partial'}
        />
      </main>
    </BrowserRouter>
  );
}
function Preview() {
  const [width, setWidth] = useState(390);
  const [message, setMessage] = useState('측정 중');
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.source === document.querySelector('iframe')?.contentWindow &&
        event.data?.type === 'report-qa'
      )
        setMessage(
          `뷰포트 ${event.data.width}px · 가로 넘침 ${event.data.overflow ? '있음' : '없음'} · 상세 ${event.data.modal ? '열림' : '닫힘'}`
        );
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);
  return (
    <div style={{ padding: 16, background: '#efe8de', minHeight: '100vh' }}>
      <h1>실제 리포트 컴포넌트 폭별 검수</h1>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        {[320, 360, 390, 430, 768, 1280].map((value) => (
          <button
            key={value}
            onClick={() => setWidth(value)}
            style={{ padding: 12, background: width === value ? '#ff724f' : 'white' }}
          >
            {value}px
          </button>
        ))}
      </div>
      <p>{message}</p>
      <iframe
        title="리포트 검수"
        src="/dev/learning-report-preview.html?frame=1"
        style={{ width, height: 1150, border: 0, background: '#fff8f0', marginTop: 12 }}
      />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? (
    location.search.includes('frame=1') ? (
      <Frame />
    ) : (
      <Preview />
    )
  ) : (
    <p>Development preview only.</p>
  )
);
