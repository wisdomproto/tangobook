import { useEffect, useState } from 'react';
import { useTextSlice, useSaveTextSlice } from '../hooks/useTextSlice';
import type { BookManifest, BookTextSlice, BookPageText, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface TextTabProps {
  manifest: BookManifest;
  level: ReadingLevel | null;
  language: string;
}

const emptyKeyObjectsText = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { word: '', korean: '' }]));

const emptyVocabText = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, { word: '', korean: '', definition: '' }]));

function buildEmptySlice(
  manifest: BookManifest,
  level: ReadingLevel,
  language: string
): BookTextSlice {
  return {
    level,
    language,
    title: manifest.title,
    intro: '',
    pages: [{ pageNumber: 1, text: '', illustrationKey: 'p1' }],
    keyObjectsText: emptyKeyObjectsText(manifest.keyObjectIds),
    vocabText: emptyVocabText(manifest.vocabIds),
  };
}

export function TextTab({ manifest, level, language }: TextTabProps) {
  if (!level) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center text-ink-500 shadow-soft">
        좌측에서 레벨을 먼저 선택해주세요.
      </div>
    );
  }
  return <TextEditor manifest={manifest} level={level} language={language} />;
}

function TextEditor({
  manifest,
  level,
  language,
}: {
  manifest: BookManifest;
  level: ReadingLevel;
  language: string;
}) {
  const {
    data: serverSlice,
    isLoading,
    isError,
    error,
  } = useTextSlice(manifest.id, level, language);
  const save = useSaveTextSlice(manifest.id);

  const [draft, setDraft] = useState<BookTextSlice | null>(null);

  // 서버 슬라이스 로드 시 draft 초기화
  useEffect(() => {
    if (serverSlice) setDraft(serverSlice);
  }, [serverSlice]);

  const notFound = isError && /404|not found/i.test((error as Error)?.message ?? '');

  if (isLoading) {
    return <Centered>로딩 중...</Centered>;
  }

  if (notFound && !draft) {
    return (
      <Centered>
        <p className="text-sm text-ink-500 font-bold mb-3">
          이 변형의 텍스트 슬라이스가 아직 없어요.
        </p>
        <p className="text-xs text-ink-300 mb-4 font-mono">
          {level} · {language}
        </p>
        <button
          onClick={() => setDraft(buildEmptySlice(manifest, level, language))}
          className="px-5 py-2 rounded-md bg-coral-500 text-white font-black text-sm shadow-pop hover:brightness-110"
        >
          + 신규 작성
        </button>
      </Centered>
    );
  }

  if (isError && !notFound) {
    return <Centered>오류: {(error as Error)?.message}</Centered>;
  }

  if (!draft) {
    return <Centered>로딩 중...</Centered>;
  }

  const dirty = !serverSlice || JSON.stringify(draft) !== JSON.stringify(serverSlice);

  const updatePage = (idx: number, patch: Partial<BookPageText>) => {
    setDraft((s) =>
      s ? { ...s, pages: s.pages.map((p, i) => (i === idx ? { ...p, ...patch } : p)) } : s
    );
  };

  const addPage = () => {
    setDraft((s) => {
      if (!s) return s;
      const next = s.pages.length + 1;
      return {
        ...s,
        pages: [...s.pages, { pageNumber: next, text: '', illustrationKey: `p${next}` }],
      };
    });
  };

  const removePage = (idx: number) => {
    setDraft((s) => (s ? { ...s, pages: s.pages.filter((_, i) => i !== idx) } : s));
  };

  const handleSave = () => {
    if (!draft) return;
    save.mutate({ level, language, slice: draft });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 저장 바 */}
      <div className="flex items-center justify-between bg-white rounded-md p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-500 font-bold">
            {dirty ? '🟡 변경됨' : save.isPending ? '저장 중...' : '✓ 저장됨'}
          </span>
          <span className="text-xs text-ink-300 font-mono">
            {level} · {language} · {draft.pages.length}페이지
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || save.isPending}
          className={cn(
            'px-5 py-2 rounded-md font-black text-sm transition-all',
            dirty && !save.isPending
              ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
              : 'bg-ink-100 text-ink-300 cursor-not-allowed'
          )}
        >
          💾 저장
        </button>
      </div>

      {save.isError && (
        <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
          저장 실패: {(save.error as Error)?.message}
        </div>
      )}

      {/* 메타 (제목/인트로) */}
      <Section title="📝 텍스트 메타">
        <Field label="제목 (이 언어)">
          <input
            value={draft.title}
            onChange={(e) => setDraft((s) => (s ? { ...s, title: e.target.value } : s))}
            className="input"
          />
        </Field>
        <Field label="인트로 (선택)">
          <textarea
            rows={2}
            value={draft.intro ?? ''}
            onChange={(e) => setDraft((s) => (s ? { ...s, intro: e.target.value } : s))}
            className="input"
          />
        </Field>
      </Section>

      {/* 페이지 */}
      <Section title="📄 페이지 텍스트">
        {draft.pages.map((page, idx) => (
          <div key={idx} className="border border-ink-100 rounded-md p-3 mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-ink-500 font-mono">
                페이지 {page.pageNumber} · key={page.illustrationKey}
              </span>
              {draft.pages.length > 1 && (
                <button
                  onClick={() => removePage(idx)}
                  className="text-[11px] text-danger font-bold hover:underline"
                >
                  삭제
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={page.text}
              onChange={(e) => updatePage(idx, { text: e.target.value })}
              placeholder={`페이지 ${page.pageNumber} 본문`}
              className="input"
            />
          </div>
        ))}
        <button
          onClick={addPage}
          className="mt-2 px-3 py-1.5 rounded-md border border-dashed border-coral-300 text-xs text-coral-500 font-bold hover:bg-coral-50"
        >
          + 페이지 추가
        </button>
      </Section>

      {/* keyObjectsText */}
      {manifest.keyObjectIds.length > 0 && (
        <Section title="🔑 핵심단어 텍스트">
          {manifest.keyObjectIds.map((id) => {
            const cur = draft.keyObjectsText[id] ?? { word: '', korean: '' };
            return (
              <div
                key={id}
                className="grid grid-cols-[120px_1fr_1fr] gap-2 mb-2 last:mb-0 items-center"
              >
                <span className="text-[11px] font-mono text-ink-500 truncate">{id}</span>
                <input
                  value={cur.word}
                  onChange={(e) =>
                    setDraft((s) =>
                      s
                        ? {
                            ...s,
                            keyObjectsText: {
                              ...s.keyObjectsText,
                              [id]: { ...cur, word: e.target.value },
                            },
                          }
                        : s
                    )
                  }
                  placeholder="word"
                  className="input"
                />
                <input
                  value={cur.korean ?? ''}
                  onChange={(e) =>
                    setDraft((s) =>
                      s
                        ? {
                            ...s,
                            keyObjectsText: {
                              ...s.keyObjectsText,
                              [id]: { ...cur, korean: e.target.value },
                            },
                          }
                        : s
                    )
                  }
                  placeholder="한국어"
                  className="input"
                />
              </div>
            );
          })}
        </Section>
      )}

      {/* vocabText */}
      {manifest.vocabIds.length > 0 && (
        <Section title="📚 학습 어휘 텍스트">
          {manifest.vocabIds.map((id) => {
            const cur = draft.vocabText[id] ?? { word: '', korean: '', definition: '' };
            return (
              <div
                key={id}
                className="grid grid-cols-[100px_1fr_1fr_2fr] gap-2 mb-2 last:mb-0 items-center"
              >
                <span className="text-[11px] font-mono text-ink-500 truncate">{id}</span>
                <input
                  value={cur.word}
                  onChange={(e) =>
                    setDraft((s) =>
                      s
                        ? {
                            ...s,
                            vocabText: { ...s.vocabText, [id]: { ...cur, word: e.target.value } },
                          }
                        : s
                    )
                  }
                  placeholder="word"
                  className="input"
                />
                <input
                  value={cur.korean ?? ''}
                  onChange={(e) =>
                    setDraft((s) =>
                      s
                        ? {
                            ...s,
                            vocabText: { ...s.vocabText, [id]: { ...cur, korean: e.target.value } },
                          }
                        : s
                    )
                  }
                  placeholder="한국어"
                  className="input"
                />
                <input
                  value={cur.definition ?? ''}
                  onChange={(e) =>
                    setDraft((s) =>
                      s
                        ? {
                            ...s,
                            vocabText: {
                              ...s.vocabText,
                              [id]: { ...cur, definition: e.target.value },
                            },
                          }
                        : s
                    )
                  }
                  placeholder="뜻"
                  className="input"
                />
              </div>
            );
          })}
        </Section>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <h2 className="text-sm font-black text-ink-900 font-display">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Centered({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center shadow-soft">
      {children}
    </div>
  );
}
