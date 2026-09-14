import { useMemo, useState, type ReactNode } from 'react';
import type { ReadingLevel, Storybook } from '@tangobook/shared';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { useStorybooks } from '@/features/storybook';
import { useBookGroups } from '@/features/library/hooks/useBookGroups';
import { applyBookPublic } from '@/features/library/lib/public-sync';
import { ArtStyleSelect } from './ArtStyleSelect';

interface BookInfoSectionProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

const LEVELS: ReadingLevel[] = ['L1', 'L2', 'L3'];
const AGES: Storybook['targetAge'][] = ['4-5', '5-7', '7-8'];

const inputClass =
  'w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

function formatDate(v?: string): string {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ko-KR') : '—';
}

/** 글자 칸 — 입력 중엔 로컬로 두고 칸을 벗어날 때 한 번 저장한다(한 글자마다 저장하지 않게). */
function TextField({
  value,
  onCommit,
  placeholder,
  list,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  list?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  return (
    <input
      className={inputClass}
      value={focused ? draft : value}
      placeholder={placeholder}
      list={list}
      onFocus={() => {
        setDraft(value);
        setFocused(true);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (draft.trim() !== value) onCommit(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3 py-1.5">
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
      <div className="min-w-0 text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

/** 책 관리 탭 「책 정보」 — 메타데이터를 보여 주고 고친다. */
export function BookInfoSection({ storybook, onUpdate, onSave }: BookInfoSectionProps) {
  const { data: all } = useStorybooks();
  const { data: groupsDoc } = useBookGroups();
  const categories = useMemo(
    () =>
      Array.from(new Set((all ?? []).map((b) => b.category).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b, 'ko')
      ),
    [all]
  );
  const group = groupsDoc?.groups.find((g) => g.bookIds.includes(storybook.id));
  const origin = storybook.splitFrom
    ? (all ?? []).find((b) => b.id === storybook.splitFrom!.bookId)
    : undefined;

  const set = (fn: (d: Storybook) => void) => {
    onUpdate(fn);
    onSave();
  };
  const langs = storybook.languages?.length ? storybook.languages : ['ko'];
  const langName = (code: string) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code)?.nativeName ?? code;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">📋 책 정보</h3>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <Row label="제목">
          <TextField
            value={storybook.title}
            onCommit={(v) => v && set((d) => void (d.title = v))}
          />
        </Row>
        {langs
          .filter((l) => l !== 'ko')
          .map((l) => (
            <Row key={l} label={`제목 · ${langName(l)}`}>
              <TextField
                value={storybook.titleTranslations?.[l] ?? ''}
                onCommit={(v) =>
                  set((d) => {
                    d.titleTranslations = { ...(d.titleTranslations ?? {}), [l]: v };
                    if (!v) delete d.titleTranslations[l];
                  })
                }
              />
            </Row>
          ))}
        <Row label="카테고리">
          {/* 🔴 editor2 사이드바는 folder 로 묶는다 — 둘을 같이 바꿔야 한 곳만 옮겨지지 않는다. */}
          <TextField
            value={storybook.category ?? ''}
            placeholder="카테고리"
            list="book-info-categories"
            onCommit={(v) =>
              set((d) => {
                d.category = v || undefined;
                d.folder = v || undefined;
              })
            }
          />
          <datalist id="book-info-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Row>
        <Row label="그림체">
          <ArtStyleSelect storybook={storybook} onUpdate={onUpdate} onSave={onSave} />
        </Row>
        <Row label="읽기 레벨">
          <select
            className={inputClass}
            value={storybook.readingLevel ?? ''}
            onChange={(e) =>
              set((d) => void (d.readingLevel = (e.target.value || undefined) as ReadingLevel))
            }
          >
            <option value="">—</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Row>
        <Row label="대상 연령">
          <select
            className={inputClass}
            value={storybook.targetAge ?? ''}
            onChange={(e) =>
              set((d) => void (d.targetAge = e.target.value as Storybook['targetAge']))
            }
          >
            {!storybook.targetAge && <option value="">—</option>}
            {AGES.map((a) => (
              <option key={a} value={a}>
                {a}세
              </option>
            ))}
          </select>
        </Row>
        <Row label="공개">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={storybook.isPublic !== false}
              onChange={(e) =>
                set((d) => {
                  // 셀 단위 공개(publicByStyleLang)와 같이 맞춘다 — 책 카드 👁 토글과 같은 규칙.
                  const next = applyBookPublic(d, e.target.checked);
                  d.isPublic = next.isPublic;
                  d.publicByStyleLang = next.publicByStyleLang;
                })
              }
            />
            학습자에게 보이기
          </label>
        </Row>
        <Row label="무료">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={storybook.isAccessibleForFree !== false}
              onChange={(e) => set((d) => void (d.isAccessibleForFree = e.target.checked))}
            />
            가입 없이 열람
          </label>
        </Row>
        <Row label="언어">{langs.map(langName).join(' · ')}</Row>
        <Row label="그룹">{group ? `${group.title} (${group.bookIds.length}권)` : '—'}</Row>
        {storybook.splitFrom && (
          <Row label="원본 책">
            {origin?.title ?? storybook.splitFrom.bookId} · {storybook.splitFrom.styleId}
          </Row>
        )}
        <Row label="종류">{storybook.type ?? 'storybook'}</Row>
        <Row label="ID">
          <code className="text-xs">{storybook.id}</code>
        </Row>
        <Row label="만든 날">{formatDate(storybook.createdAt)}</Row>
        <Row label="고친 날">{formatDate(storybook.updatedAt)}</Row>
      </div>
    </section>
  );
}
