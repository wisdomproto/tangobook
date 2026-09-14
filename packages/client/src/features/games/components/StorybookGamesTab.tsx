import { useMemo, useState } from 'react';
import i18n from '@/i18n';
import type { Lang, Storybook } from '@tangobook/shared';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import {
  getAvailableGames,
  type VocabGameOption,
} from '@/features/vocabulary-unit/lib/game-data-adapter';
import {
  coloringBookId,
  countColoringSheets,
  useColoringBookIndex,
} from '../hooks/useColoringSheets';
import { GamesTab } from './GamesTab';
import { HiddenObjectEditorTab } from './HiddenObjectEditorTab';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

/**
 * 동화책 이야기 놀이 중 **데이터가 모자라면 학습자 화면에 카드 자체가 안 뜨는 것** — 저작도구에선
 * 「왜 안 뜨는지」까지 보여야 하므로 빠진 카드를 채워 넣는다(`getAvailableGames` 는 안 뜨는 카드를 뺀다).
 */
const STORY_GAMES: Array<{
  id: VocabGameOption['id'];
  labelKey: string;
  emoji: string;
  reason: string;
}> = [
  {
    id: 'korean-story-image',
    labelKey: 'storyImage',
    emoji: '📖',
    reason: '나레이션 있는 쪽이 4개 이상 필요해요',
  },
  {
    id: 'korean-object-scene',
    labelKey: 'objectScene',
    emoji: '🔍',
    reason: '카드 그림 있는 낱말 3개 이상이 삽화 있는 쪽 글에 나와야 해요',
  },
  {
    id: 'hidden-object',
    labelKey: 'hiddenObject',
    emoji: '🕵️',
    reason: '아래에서 숨은그림 씬을 붙여야 해요',
  },
  {
    id: 'korean-page-order',
    labelKey: 'pageOrder',
    emoji: '🔢',
    reason: '글 · 삽화가 있는 쪽이 4개 이상 필요해요',
  },
];

/**
 * editor2 「학습게임」 탭 — 🔴 **학습자 화면과 똑같이 책에서 자동으로 만든 게임**을 보여 준다(2026-09-14).
 * 예전 탭은 따로 생성해 저장한 `storybook.games` 만 보여서, 아이가 실제로 하는 게임이 저작도구에 안 보였다.
 * 묶음은 학습자 화면과 같은 둘 — 단어 익히기 / 동화 내용 놀이. 숨은그림 씬 편집도 동화 내용 놀이 안으로.
 */
export function StorybookGamesTab({ storybook, onUpdate, onSave }: Props) {
  const lang = (useEditorLang() ?? 'ko') as Lang;
  const t = useMemo(() => i18n.getFixedT('ko', 'games'), []);
  const unit = useMemo(() => deriveStorybookUnit(storybook), [storybook]);
  const coloringIndex = useColoringBookIndex();
  const coloringCount = countColoringSheets(
    coloringIndex[coloringBookId(storybook)],
    storybook,
    lang
  );
  const cards = getAvailableGames(unit, lang, t, storybook, storybook.artStyle, coloringCount);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const word = cards.filter((c) => c.group === 'word');
  const shown = new Set(cards.map((c) => c.id));
  const story: Array<{
    id: string;
    emoji: string;
    label: string;
    available: boolean;
    reason?: string;
  }> = [
    ...cards
      .filter((c) => c.group === 'story')
      .map((c) => ({
        id: c.id,
        emoji: c.emoji,
        label: c.label,
        available: c.available,
        reason: c.unavailableReason,
      })),
    ...STORY_GAMES.filter(
      (g) =>
        !shown.has(g.id) && !(g.id === 'korean-story-image' && shown.has('english-story-image'))
    ).map((g) => ({
      id: g.id,
      emoji: g.emoji,
      label: t(`cards.${g.labelKey}.label`),
      available: false,
      reason: lang === 'ko' ? g.reason : '독후활동은 한국어만 있어요',
    })),
  ];
  const playUrl = `/vocabulary/book-${storybook.id}?lang=${lang}`;
  const legacyCount = storybook.games?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          학습자 화면과 같은 규칙으로 이 책의 데이터에서 자동으로 만든 게임입니다 · 언어{' '}
          <b>{lang}</b>
        </p>
        <a
          href={playUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          ▶ 학습자 화면에서 해 보기
        </a>
      </div>

      <GameGroup
        title="🔤 단어 익히기"
        subtitle={`낱말 ${unit.words.length}개`}
        items={word.map((c) => ({
          id: c.id,
          emoji: c.emoji,
          label: c.label,
          available: c.available,
          reason: c.unavailableReason,
        }))}
      />

      <div className="space-y-4">
        <GameGroup
          title="📖 동화 내용 놀이"
          subtitle={`쪽 ${storybook.pages?.length ?? 0}개`}
          items={story}
        />
        <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <h4 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
            🕵️ 숨은그림 찾기 씬
          </h4>
          <HiddenObjectEditorTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />
        </section>
      </div>

      {legacyCount > 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600">
          <button
            onClick={() => setLegacyOpen((v) => !v)}
            className="text-xs font-bold text-slate-500 dark:text-slate-400"
          >
            {legacyOpen ? '▾' : '▸'} 예전에 따로 생성해 저장한 게임 {legacyCount}개 — 학습자 화면은
            이걸 쓰지 않습니다
          </button>
          {legacyOpen && (
            <div className="mt-4">
              <GamesTab storybook={storybook} onUpdate={onUpdate} onSave={onSave} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function GameGroup({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ id: string; emoji: string; label: string; available: boolean; reason?: string }>;
}) {
  const on = items.filter((i) => i.available).length;
  return (
    <section>
      <h3 className="mb-3 flex items-baseline gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
        {title}
        <span className="text-xs font-medium text-slate-500">
          {subtitle} · 학습자에게 {on}/{items.length}개 보임
        </span>
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <div
            key={g.id}
            className={
              g.available
                ? 'flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-900/20'
                : 'flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-80 dark:border-slate-700 dark:bg-slate-800/50'
            }
          >
            <span className="text-2xl">{g.emoji}</span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{g.label}</div>
              <div
                className={
                  g.available
                    ? 'text-xs text-emerald-700 dark:text-emerald-300'
                    : 'text-xs text-slate-500'
                }
              >
                {g.available
                  ? '✓ 학습자에게 보임'
                  : `✗ 안 보임 — ${g.reason ?? '데이터가 부족해요'}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
