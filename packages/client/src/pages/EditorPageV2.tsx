import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBookManifest } from '@/features/book-v2';
import { StateScreen } from '@/components/StateScreen';
import { cn } from '@/lib/cn';
import type { ReadingLevel } from '@tangobook/shared';

// ────────────────────────────────────────────────────────────────────────────
// 8 본문 탭 정의 — 의존 축 명시 (Phase 3b 후속 sprint에서 각 탭 구현)
// ────────────────────────────────────────────────────────────────────────────

type ContentTabId =
  | 'meta'
  | 'text'
  | 'style'
  | 'page'
  | 'audiobook'
  | 'longform'
  | 'marketing'
  | 'games';

const CONTENT_TABS: { id: ContentTabId; icon: string; label: string; deps: string }[] = [
  { id: 'meta', icon: '📋', label: '메타', deps: '책 단위' },
  { id: 'text', icon: '📝', label: '텍스트', deps: '레벨 + 언어' },
  { id: 'style', icon: '🎨', label: '스타일', deps: '그림체' },
  { id: 'page', icon: '🖼️', label: '페이지', deps: '그림체 + 레벨' },
  { id: 'audiobook', icon: '🎧', label: '오디오북', deps: '책 단위 (렌더 시 3축)' },
  { id: 'longform', icon: '🎬', label: '동영상', deps: '레벨 + 언어 + 그림체' },
  { id: 'marketing', icon: '📰', label: '마케팅', deps: '언어' },
  { id: 'games', icon: '🎮', label: '게임', deps: '레벨 + 언어' },
];

// ────────────────────────────────────────────────────────────────────────────
// 좌측 트리 — 레벨만 (스펙 §5)
// ────────────────────────────────────────────────────────────────────────────

const ALL_LEVELS: ReadingLevel[] = ['L1', 'L2', 'L3', 'L4'];
const LEVEL_LABEL: Record<ReadingLevel, string> = {
  L1: '씨앗',
  L2: '새싹',
  L3: '나무',
  L4: '숲',
};

export default function EditorPageV2() {
  const { bid = '' } = useParams();
  const { data: manifest, isLoading, isError } = useBookManifest(bid);

  const [activeLevel, setActiveLevel] = useState<ReadingLevel | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<string>('ko');
  const [activeContentTab, setActiveContentTab] = useState<ContentTabId>('meta');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center text-ink-500">
        로딩 중...
      </div>
    );
  }

  if (isError || !manifest) {
    return (
      <StateScreen
        mascotState="sad"
        title="책을 찾을 수 없어"
        description="라이브러리로 돌아가세요"
      />
    );
  }

  // 레벨/그림체/언어 자동 선택 (사용자가 아직 선택 안 했으면)
  const usedLevels = manifest.usedVariants.levels;
  const usedStyles = manifest.usedVariants.styles;
  const usedLanguages = manifest.usedVariants.languages;
  const effectiveLevel = activeLevel ?? usedLevels[0] ?? null;
  const effectiveStyle = activeStyle ?? usedStyles[0] ?? null;
  const effectiveLang = usedLanguages.includes(activeLang)
    ? activeLang
    : (usedLanguages[0] ?? 'ko');

  return (
    <div className="min-h-screen bg-cream-50">
      {/* 상단 바 */}
      <header className="bg-white border-b border-ink-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/library" className="text-ink-500 hover:text-ink-900 text-sm font-bold">
            ← 라이브러리
          </Link>
          <span className="text-ink-300">/</span>
          <h1 className="font-black text-lg text-ink-900 font-display">{manifest.title}</h1>
          <span className="text-xs text-ink-500 font-bold">
            {manifest.type === 'phonics' ? '🔤 파닉스' : '📖 동화책'}
          </span>
        </div>
        <div className="text-xs text-ink-500 font-bold">
          {usedLevels.length} 레벨 · {usedLanguages.length} 언어 · {usedStyles.length} 그림체
        </div>
      </header>

      <div className="flex h-[calc(100vh-49px)]">
        {/* 좌측 트리: 레벨 (스펙 §5 결정) */}
        <aside className="w-56 bg-white border-r border-ink-100 p-3 overflow-y-auto">
          <div className="text-[11px] font-black text-ink-500 uppercase tracking-wider mb-2 px-2">
            📂 레벨
          </div>
          <ul className="space-y-1">
            {ALL_LEVELS.map((lv) => {
              const active = effectiveLevel === lv;
              const inUse = usedLevels.includes(lv);
              return (
                <li key={lv}>
                  <button
                    onClick={() => setActiveLevel(lv)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2',
                      active
                        ? 'bg-coral-500 text-white shadow-soft'
                        : inUse
                          ? 'bg-peach-50 text-ink-900 hover:bg-peach-100'
                          : 'text-ink-300 hover:bg-ink-50'
                    )}
                  >
                    <span className="text-base">{lv}</span>
                    <span className="text-[11px] opacity-80">{LEVEL_LABEL[lv]}</span>
                    {inUse && <span className="ml-auto text-xs">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            disabled
            title="다음 sprint에서 구현"
            className="mt-3 w-full px-3 py-2 rounded-md border border-dashed border-ink-200 text-xs text-ink-300 font-bold opacity-50 cursor-not-allowed"
          >
            + 레벨 추가
          </button>
        </aside>

        {/* 우측 영역 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 우측 상단: 그림체 큰 탭 + 언어 드롭다운 (잠정 D안) */}
          <div className="bg-white border-b border-ink-100 px-5 py-3 flex items-center gap-3">
            <div className="flex gap-2 flex-wrap flex-1">
              {usedStyles.length === 0 ? (
                <span className="text-xs text-ink-300 font-bold py-2">
                  그림체 없음 — 메타 탭에서 추가
                </span>
              ) : (
                usedStyles.map((style) => {
                  const active = effectiveStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => setActiveStyle(style)}
                      className={cn(
                        'px-4 py-2 rounded-md font-black text-sm transition-all',
                        active
                          ? 'bg-coral-500 text-white shadow-pop'
                          : 'bg-peach-50 text-ink-700 hover:bg-peach-100'
                      )}
                    >
                      🎨 {style}
                    </button>
                  );
                })
              )}
              <button
                disabled
                title="다음 sprint에서 구현"
                className="px-3 py-2 rounded-md border border-dashed border-ink-200 text-xs text-ink-300 font-bold opacity-50 cursor-not-allowed"
              >
                + 그림체
              </button>
            </div>
            {/* 언어 드롭다운 (작은) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-ink-500 font-bold">🌐</span>
              <select
                value={effectiveLang}
                onChange={(e) => setActiveLang(e.target.value)}
                className="bg-white border border-ink-200 rounded-md px-2 py-1.5 font-bold text-ink-900"
              >
                {usedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 본문 탭 헤더 */}
          <div className="bg-white border-b border-ink-100 px-5 flex gap-1 overflow-x-auto">
            {CONTENT_TABS.map((tab) => {
              const active = activeContentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveContentTab(tab.id)}
                  className={cn(
                    'px-3 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5',
                    active
                      ? 'border-coral-500 text-coral-500'
                      : 'border-transparent text-ink-500 hover:text-ink-900'
                  )}
                  title={tab.deps}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-5">
            <ContentTabPlaceholder
              tabId={activeContentTab}
              context={{
                bid: manifest.id,
                level: effectiveLevel,
                language: effectiveLang,
                style: effectiveStyle,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Placeholder — 각 탭은 후속 sprint에서 구현
// ────────────────────────────────────────────────────────────────────────────

function ContentTabPlaceholder(props: {
  tabId: ContentTabId;
  context: { bid: string; level: ReadingLevel | null; language: string; style: string | null };
}) {
  const { tabId, context } = props;
  const tab = CONTENT_TABS.find((t) => t.id === tabId)!;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-soft p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{tab.icon}</span>
        <div>
          <h2 className="text-2xl font-black text-ink-900 font-display">{tab.label}</h2>
          <p className="text-xs text-ink-500 font-bold mt-0.5">의존 축: {tab.deps}</p>
        </div>
      </div>
      <div className="border-t border-ink-100 pt-4 mt-4">
        <p className="text-sm text-ink-500 mb-3">현재 컨텍스트:</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink-500 font-bold">📚 책</dt>
            <dd className="font-mono text-ink-900">{context.bid}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 font-bold">📂 레벨</dt>
            <dd className="font-mono text-ink-900">{context.level ?? '(없음)'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 font-bold">🌐 언어</dt>
            <dd className="font-mono text-ink-900">{context.language}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 font-bold">🎨 그림체</dt>
            <dd className="font-mono text-ink-900">{context.style ?? '(없음)'}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 px-4 py-3 bg-peach-50 rounded-md text-xs text-ink-700 font-bold">
        💡 이 탭은 다음 sprint에서 구현됩니다 (Phase 3b-{tabIndexFor(tabId)}).
      </div>
    </div>
  );
}

function tabIndexFor(tabId: ContentTabId): number {
  const map: Record<ContentTabId, number> = {
    meta: 3,
    text: 4,
    style: 5,
    page: 6,
    audiobook: 7,
    longform: 7,
    marketing: 7,
    games: 7,
  };
  return map[tabId];
}
