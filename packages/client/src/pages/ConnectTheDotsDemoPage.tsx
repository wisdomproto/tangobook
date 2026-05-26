import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectTheDotsPlayer } from '@/features/games/components/players/ConnectTheDotsPlayer';
import type { ConnectTheDotsData, DotKeypoint } from '@tangobook/shared';

/**
 * 점잇기 paint-fill 데모 — 다양한 polygon 모양으로 색칠 채점 검증.
 *
 * 사용자 정책 (2026-05-25):
 *   - 점 순서대로 탭 → polygon 영역 색칠로 변경
 *   - 첫 점/마지막 점 자동 close
 *   - 큰 붓으로 전부 칠하면 통과
 *
 * 데모 데이터: data URL 흰 배경 + 다양한 polygon 모양 (사각형/별/하트/삼각형).
 * mock storybookId — TTS lookup 실패해도 게임 흐름은 동작.
 */

const WHITE_BG = encodeURI(
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="100%" height="100%" fill="white"/><text x="500" y="350" font-size="48" text-anchor="middle" fill="%23dddddd" font-family="sans-serif">DEMO</text></svg>'
);

interface DemoShape {
  name: string;
  korean: string;
  keypoints: DotKeypoint[];
}

const SHAPES: DemoShape[] = [
  {
    name: 'square',
    korean: '사각형',
    keypoints: [
      { x: 0.25, y: 0.25, order: 1 },
      { x: 0.75, y: 0.25, order: 2 },
      { x: 0.75, y: 0.75, order: 3 },
      { x: 0.25, y: 0.75, order: 4 },
    ],
  },
  {
    name: 'triangle',
    korean: '삼각형',
    keypoints: [
      { x: 0.5, y: 0.2, order: 1 },
      { x: 0.85, y: 0.8, order: 2 },
      { x: 0.15, y: 0.8, order: 3 },
    ],
  },
  {
    name: 'star',
    korean: '별',
    keypoints: [
      { x: 0.5, y: 0.15, order: 1 },
      { x: 0.6, y: 0.4, order: 2 },
      { x: 0.88, y: 0.4, order: 3 },
      { x: 0.66, y: 0.58, order: 4 },
      { x: 0.74, y: 0.85, order: 5 },
      { x: 0.5, y: 0.7, order: 6 },
      { x: 0.26, y: 0.85, order: 7 },
      { x: 0.34, y: 0.58, order: 8 },
      { x: 0.12, y: 0.4, order: 9 },
      { x: 0.4, y: 0.4, order: 10 },
    ],
  },
  {
    name: 'heart',
    korean: '하트',
    keypoints: [
      { x: 0.5, y: 0.85, order: 1 },
      { x: 0.15, y: 0.5 },
      { x: 0.18, y: 0.25, order: 3 },
      { x: 0.32, y: 0.18, order: 4 },
      { x: 0.5, y: 0.3, order: 5 },
      { x: 0.68, y: 0.18, order: 6 },
      { x: 0.82, y: 0.25, order: 7 },
      { x: 0.85, y: 0.5, order: 8 },
    ].map((p, i) => ({ ...p, order: p.order ?? i + 1 })) as DotKeypoint[],
  },
];

export default function ConnectTheDotsDemoPage() {
  const [shapeIdx, setShapeIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const shape = SHAPES[shapeIdx];
  const gameData: ConnectTheDotsData = {
    type: 'connect-the-dots',
    items: [
      {
        pageNumber: 1,
        originalImageUrl: WHITE_BG,
        keypoints: shape.keypoints,
        objectName: shape.korean,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center gap-4">
        <Link to="/library" className="text-sm text-slate-600 hover:text-slate-900">
          ← 라이브러리
        </Link>
        <h1 className="text-lg font-bold text-ink-900">🎨 점잇기 → 색칠 데모</h1>
        <div className="ml-auto flex items-center gap-2">
          {SHAPES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => {
                setShapeIdx(i);
                setResetKey((k) => k + 1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                i === shapeIdx
                  ? 'bg-coral-500 text-white shadow-pop'
                  : 'bg-white text-ink-700 border border-peach-200'
              }`}
            >
              {s.korean} ({s.keypoints.length}점)
            </button>
          ))}
          <span className="text-sm text-ink-500 ml-2">완료: {completedCount}</span>
        </div>
      </header>

      <ConnectTheDotsPlayer
        key={resetKey + '-' + shapeIdx}
        storybookId="demo-storybook"
        gameData={gameData}
        difficulty="medium"
        onComplete={(score) => setCompletedCount((c) => c + score)}
        onBack={() => {
          setResetKey((k) => k + 1);
        }}
      />
    </div>
  );
}
