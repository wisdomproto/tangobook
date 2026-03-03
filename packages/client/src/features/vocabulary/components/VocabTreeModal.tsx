import { useState, useMemo } from 'react';
import { useVocabularyList, useBulkSyncVocabulary } from '../hooks/useVocabulary';
import type { VocabEntry, VocabSource } from '@tangobook/shared';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── 트리 노드 구조 ───

interface TreeNode {
  label: string;
  icon: string;
  children: TreeNode[];
  wordCount?: number;
  entry?: VocabEntry;
  source?: VocabSource;
  crossRefs?: { storybookTitle: string; sourceType: string }[];
}

function buildTree(entries: VocabEntry[]): TreeNode[] {
  // 콘텐츠별 그룹핑: storybookId → { title, sources with words }
  const contentMap = new Map<
    string,
    {
      title: string;
      isPhonics: boolean;
      level?: string;
      unit?: string;
      words: { entry: VocabEntry; source: VocabSource }[];
    }
  >();

  for (const entry of entries) {
    for (const src of entry.sources) {
      let content = contentMap.get(src.storybookId);
      if (!content) {
        const isPhonics = src.sourceType.startsWith('phonics-');
        content = {
          title: src.storybookTitle,
          isPhonics,
          level: src.phonicsLevel,
          unit: src.phonicsUnit,
          words: [],
        };
        contentMap.set(src.storybookId, content);
      }
      content.words.push({ entry, source: src });
    }
  }

  // 교차 참조 맵: word → 등장 콘텐츠 목록
  const crossRefMap = new Map<string, { storybookTitle: string; sourceType: string }[]>();
  for (const entry of entries) {
    if (entry.sources.length > 1) {
      const uniqueTitles = new Map<string, string>();
      for (const s of entry.sources) {
        if (!uniqueTitles.has(s.storybookId)) {
          uniqueTitles.set(s.storybookId, s.storybookTitle);
        }
      }
      if (uniqueTitles.size > 1) {
        crossRefMap.set(
          entry.word,
          entry.sources.map((s) => ({
            storybookTitle: s.storybookTitle,
            sourceType: s.sourceType,
          }))
        );
      }
    }
  }

  // 파닉스 / 동화책 분류
  const phonicsContents: typeof contentMap = new Map();
  const storybookContents: typeof contentMap = new Map();

  for (const [id, content] of contentMap) {
    if (content.isPhonics) phonicsContents.set(id, content);
    else storybookContents.set(id, content);
  }

  const buildWordNodes = (
    words: { entry: VocabEntry; source: VocabSource }[],
    currentStorybookId: string
  ): TreeNode[] => {
    // 같은 단어 중복 제거
    const seen = new Set<string>();
    return words
      .filter((w) => {
        if (seen.has(w.entry.word)) return false;
        seen.add(w.entry.word);
        return true;
      })
      .sort((a, b) => a.entry.word.localeCompare(b.entry.word))
      .map((w) => {
        const crossRefs = crossRefMap.get(w.entry.word)?.filter(
          (r) =>
            // 현재 콘텐츠가 아닌 다른 출처만
            !w.entry.sources.some(
              (s) =>
                s.storybookId === currentStorybookId &&
                s.sourceType === r.sourceType &&
                s.storybookTitle === r.storybookTitle
            ) || w.entry.sources.length > 1
        );
        const otherSources = crossRefs?.filter((r) => r.storybookTitle !== w.source.storybookTitle);

        const children: TreeNode[] = [];

        // 문장이 있으면 표시
        if (w.source.sentences?.length) {
          for (const sentence of w.source.sentences) {
            children.push({
              label: sentence,
              icon: '💬',
              children: [],
            });
          }
        }

        return {
          label: `${w.entry.word}${w.entry.korean ? ` (${w.entry.korean})` : ''}`,
          icon: w.source.imageUrl ? '🖼️' : '🏷️',
          children,
          entry: w.entry,
          source: w.source,
          crossRefs: otherSources?.length ? otherSources : undefined,
        };
      });
  };

  const result: TreeNode[] = [];

  // 파닉스 그룹
  if (phonicsContents.size > 0) {
    const phonicsChildren: TreeNode[] = [];
    // level별 그룹
    const byLevel = new Map<
      string,
      { id: string; content: typeof contentMap extends Map<string, infer V> ? V : never }[]
    >();
    for (const [id, content] of phonicsContents) {
      const level = content.level || 'unknown';
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push({ id, content });
    }

    for (const [level, contents] of byLevel) {
      const levelChildren: TreeNode[] = contents
        .sort((a, b) => a.content.title.localeCompare(b.content.title))
        .map((c) => ({
          label: c.content.title,
          icon: '📄',
          wordCount: new Set(c.content.words.map((w) => w.entry.word)).size,
          children: buildWordNodes(c.content.words, c.id),
        }));

      phonicsChildren.push({
        label: level,
        icon: '📗',
        wordCount: levelChildren.reduce((sum, c) => sum + (c.wordCount ?? 0), 0),
        children: levelChildren,
      });
    }

    result.push({
      label: '파닉스',
      icon: '🔤',
      wordCount: new Set(
        [...phonicsContents.values()].flatMap((c) => c.words.map((w) => w.entry.word))
      ).size,
      children: phonicsChildren,
    });
  }

  // 동화책 그룹
  if (storybookContents.size > 0) {
    const sbChildren: TreeNode[] = [...storybookContents.entries()]
      .sort((a, b) => a[1].title.localeCompare(b[1].title))
      .map(([id, content]) => ({
        label: content.title,
        icon: '📖',
        wordCount: new Set(content.words.map((w) => w.entry.word)).size,
        children: buildWordNodes(content.words, id),
      }));

    result.push({
      label: '동화책',
      icon: '📚',
      wordCount: new Set(
        [...storybookContents.values()].flatMap((c) => c.words.map((w) => w.entry.word))
      ).size,
      children: sbChildren,
    });
  }

  // 교차 참조
  if (crossRefMap.size > 0) {
    const crossChildren: TreeNode[] = [...crossRefMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([word, refs]) => {
        const entry = entries.find((e) => e.word === word)!;
        const uniqueTitles = [...new Set(refs.map((r) => r.storybookTitle))];
        return {
          label: `${word}${entry.korean ? ` (${entry.korean})` : ''}`,
          icon: '🔗',
          entry,
          children: uniqueTitles.map((title) => ({
            label: title,
            icon: refs.find((r) => r.storybookTitle === title)?.sourceType.startsWith('phonics-')
              ? '🔤'
              : '📖',
            children: [],
          })),
        };
      });

    result.push({
      label: '교차 참조',
      icon: '🔗',
      wordCount: crossRefMap.size,
      children: crossChildren,
    });
  }

  return result;
}

// ─── 트리 노드 컴포넌트 ───

function CrossRefPopover({ entry, onClose }: { entry: VocabEntry; onClose: () => void }) {
  // 현재 소스 외 다른 출처들 (중복 storybookId 제거)
  const sources = entry.sources;

  return (
    <div className="absolute left-0 top-full mt-1 z-10 w-80 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-slate-200 dark:border-slate-600">
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          📍 {entry.word} — 등장 위치 ({sources.length}곳)
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-600/50">
        {sources.map((src, i) => (
          <div key={i} className="px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
              <span>{src.sourceType.startsWith('phonics-') ? '🔤' : '📖'}</span>
              <span className="truncate">{src.storybookTitle}</span>
              <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                {src.sourceType.replace('storybook-', '').replace('phonics-', '')}
              </span>
            </div>
            {src.pages && src.pages.length > 0 && (
              <div className="mt-1 text-[10px] text-violet-500 dark:text-violet-400">
                📄 p.{src.pages.join(', ')}
              </div>
            )}
            {src.phonicPattern && (
              <div className="mt-1 text-[10px] text-emerald-500 dark:text-emerald-400">
                🔡 패턴: {src.phonicPattern}
              </div>
            )}
            {src.sentences && src.sentences.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {src.sentences.map((sentence, j) => (
                  <p
                    key={j}
                    className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed"
                  >
                    💬 {sentence}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreeNodeView({
  node,
  depth,
  searchQuery,
}: {
  node: TreeNode;
  depth: number;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [showCrossRef, setShowCrossRef] = useState(false);
  const hasChildren = node.children.length > 0;

  // 검색 필터
  const matchesSearch =
    !searchQuery ||
    node.label.toLowerCase().includes(searchQuery) ||
    node.children.some(
      (c) =>
        c.label.toLowerCase().includes(searchQuery) ||
        c.entry?.word.includes(searchQuery) ||
        c.entry?.korean.includes(searchQuery)
    );

  if (!matchesSearch && searchQuery) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
          depth === 0 ? 'font-semibold text-sm' : depth === 1 ? 'text-sm' : 'text-xs'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <span className="w-4 text-center text-slate-400 text-xs select-none">
            {expanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <span>{node.icon}</span>
        <span className="text-slate-700 dark:text-slate-200 truncate">{node.label}</span>
        {node.wordCount != null && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {node.wordCount}개
          </span>
        )}
        {node.entry && new Set(node.entry.sources.map((s) => s.storybookId)).size > 1 && (
          <span className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCrossRef(!showCrossRef);
              }}
              className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full shrink-0 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
            >
              +{new Set(node.entry.sources.map((s) => s.storybookId)).size - 1}
            </button>
            {showCrossRef && (
              <CrossRefPopover entry={node.entry} onClose={() => setShowCrossRef(false)} />
            )}
          </span>
        )}
        {node.source?.imageUrl && (
          <img
            src={node.source.imageUrl}
            alt=""
            className="w-6 h-6 rounded object-cover shrink-0 ml-1"
          />
        )}
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child, i) => (
          <TreeNodeView key={i} node={child} depth={depth + 1} searchQuery={searchQuery} />
        ))}
    </div>
  );
}

// ─── 메인 모달 ───

export function VocabTreeModal({ open, onClose }: Props) {
  const { data: entries, isLoading } = useVocabularyList();
  const bulkSync = useBulkSyncVocabulary();
  const [search, setSearch] = useState('');

  const tree = useMemo(() => {
    if (!entries?.length) return [];
    return buildTree(entries);
  }, [entries]);

  const totalWords = entries?.length ?? 0;
  const phonicsWords =
    entries?.filter((e) => e.sources.some((s) => s.sourceType.startsWith('phonics-'))).length ?? 0;
  const storybookWords =
    entries?.filter((e) => e.sources.some((s) => s.sourceType.startsWith('storybook-'))).length ??
    0;
  const crossRefWords =
    entries?.filter((e) => {
      const uniqueBooks = new Set(e.sources.map((s) => s.storybookId));
      return uniqueBooks.size > 1;
    }).length ?? 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-[720px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌳</span>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">어휘 DB</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">총 {totalWords}개</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bulkSync.mutate()}
              disabled={bulkSync.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 disabled:opacity-50 transition-colors"
            >
              {bulkSync.isPending ? '동기화 중...' : '전체 동기화'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 통계 바 */}
        <div className="flex gap-4 px-5 py-2.5 border-b border-slate-100 dark:border-slate-700/50 text-xs">
          <span className="text-emerald-600 dark:text-emerald-400">🔤 파닉스 {phonicsWords}</span>
          <span className="text-blue-600 dark:text-blue-400">📚 동화책 {storybookWords}</span>
          <span className="text-amber-600 dark:text-amber-400">🔗 교차 {crossRefWords}</span>
        </div>

        {/* 검색 */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-700/50">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="단어 검색..."
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>

        {/* 트리 */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              불러오는 중...
            </div>
          ) : tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm mb-2">어휘 DB가 비어있습니다</p>
              <p className="text-xs">「전체 동기화」를 눌러 기존 콘텐츠를 연결하세요</p>
            </div>
          ) : (
            tree.map((node, i) => (
              <TreeNodeView key={i} node={node} depth={0} searchQuery={search.toLowerCase()} />
            ))
          )}
        </div>

        {/* 동기화 결과 */}
        {bulkSync.data && (
          <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-700/50 text-xs text-emerald-600 dark:text-emerald-400">
            동기화 완료: {bulkSync.data.total}권 스캔, {bulkSync.data.added}개 추가,{' '}
            {bulkSync.data.updated}개 갱신
          </div>
        )}
      </div>
    </div>
  );
}
