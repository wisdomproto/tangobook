import { useCallback, useEffect, useRef, useState } from 'react';
import { useStorybook, useSaveStorybook, useDeleteStorybook } from '@/features/storybook';
import { Spinner } from '@/components/Spinner';
import { EditorContent } from '@/features/editor/components/EditorContent';
import { EditorLangProvider } from '@/contexts/EditorLangContext';
import { useEditorStore } from '@/store/editor.store';
import { cn } from '@/lib/cn';
import { ART_STYLES, SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { getAvailableLanguages } from '@/lib/storybook-accessors';
import type { Storybook, ReadingLevel } from '@tangobook/shared';
import { AddStyleConfirmModal, AddLanguageConfirmModal } from './VariantConfirmModals';
import { switchStyleAssets, findArtStylePreset } from '@/features/editor/lib/style-assets';

interface LevelInfo {
  label: string;
  age: string;
  emoji: string;
  color: string;
}

const LEVEL_INFO: Record<ReadingLevel, LevelInfo> = {
  L1: { label: '씨앗', age: '3~4세', emoji: '📗', color: 'emerald' },
  L2: { label: '새싹', age: '4~6세', emoji: '📘', color: 'sky' },
  L3: { label: '나무', age: '6~7세', emoji: '📙', color: 'amber' },
};

/** ReadingLevel 타입에 없지만 R2 에 잔존하는 `__L4` 등 unknown level 안전 폴백.
 *  메모리 [reading-level-3tier.md] 참고: L4 → L3 매핑 후 일부 sibling id 의 suffix 만 잔존.
 */
const UNKNOWN_LEVEL_INFO: LevelInfo = {
  label: '(구버전)',
  age: '',
  emoji: '📚',
  color: 'slate',
};

function getLevelInfo(level: string): LevelInfo {
  return (LEVEL_INFO as Record<string, LevelInfo | undefined>)[level] ?? UNKNOWN_LEVEL_INFO;
}

const LANG_FLAG: Record<string, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
};

interface LevelEditCardProps {
  storybookId: string;
  level: ReadingLevel;
  isBase: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  hasMounted: boolean;
  onMounted: () => void;
}

/**
 * 레벨 1개의 편집 카드 — 동영상 프로젝트 카드와 동일한 펼침/접힘 패턴.
 * - 접힌 상태: 헤더 1줄 (레벨 라벨 · 페이지수 · 그림체)
 * - 펼친 상태: 그림체/언어 row + 콘텐츠 탭 (v1 EditorContent)
 *
 * 한 번 펼쳐지면 mount 유지 (collapse 후 재펼침 시 fetch 재발생 방지 + 로컬 편집 보존).
 */
export function LevelEditCard({
  storybookId,
  level,
  isBase,
  expanded,
  onToggle,
  onDelete,
  hasMounted,
  onMounted,
}: LevelEditCardProps) {
  const info = getLevelInfo(level);

  // 펼쳐진 적이 있으면 mount 유지 (display 로 숨김만)
  const shouldMount = hasMounted || expanded;
  useEffect(() => {
    if (expanded && !hasMounted) onMounted();
  }, [expanded, hasMounted, onMounted]);

  return (
    <div
      className={cn(
        'rounded-xl border-2 transition-all',
        expanded
          ? 'border-violet-400 dark:border-violet-600 shadow-md'
          : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <CardHeader
        info={info}
        level={level}
        isBase={isBase}
        storybookId={storybookId}
        expanded={expanded}
        onToggle={onToggle}
      />
      {shouldMount && (
        <div
          style={{ display: expanded ? 'block' : 'none' }}
          className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-[10px] relative"
        >
          <CardBody storybookId={storybookId} level={level} isBase={isBase} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}

// ─── 카드 헤더 ────────────────────────────────────────────────────────────────

function CardHeader({
  info,
  level,
  isBase,
  storybookId,
  expanded,
  onToggle,
}: {
  info: { label: string; age: string; emoji: string };
  level: ReadingLevel;
  isBase: boolean;
  storybookId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: sb } = useStorybook(storybookId);
  const styleLabel = sb && findArtStylePreset(sb.artStyle)?.label;
  const langCount = sb ? getAvailableLanguages(sb).length : 1;

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full text-left px-5 py-3 flex items-center gap-3 transition-colors rounded-t-[10px]',
        expanded
          ? 'bg-violet-50 dark:bg-violet-900/20'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-b-[10px]'
      )}
    >
      <span className="text-2xl shrink-0">{info.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-slate-100">
          {level} {info.label}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{info.age}</span>
          {isBase && (
            <span className="text-[10px] px-1.5 py-px rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold">
              base
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {sb ? (
            <>
              📄 {sb.pages?.length ?? 0}쪽 · 🎨 {styleLabel ?? sb.artStyle} ·{' '}
              {langCount > 1 ? `🌐 ${langCount}개 언어` : '🇰🇷 한국어'}
              {sb.title?.replace(/\s*\(L[1-4]\)\s*$/, '') && (
                <> · {sb.title.replace(/\s*\(L[1-4]\)\s*$/, '')}</>
              )}
            </>
          ) : (
            '로딩...'
          )}
        </div>
      </div>
      <span
        className={cn('text-slate-400 transition-transform shrink-0', expanded && 'rotate-180')}
      >
        ▾
      </span>
    </button>
  );
}

// ─── 카드 본문 ────────────────────────────────────────────────────────────────

function CardBody({
  storybookId,
  level,
  isBase,
  onDelete,
}: {
  storybookId: string;
  level: ReadingLevel;
  isBase: boolean;
  onDelete?: () => void;
}) {
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const { data: storybook, isLoading, error } = useStorybook(storybookId);
  const saveMutation = useSaveStorybook();
  const deleteMutation = useDeleteStorybook();
  void deleteMutation; // 부모가 처리

  const [activeLang, setActiveLang] = useState<string>('ko');
  const [pendingStyleAdd, setPendingStyleAdd] = useState<{
    id: string;
    label: string;
    prompt: string;
  } | null>(null);
  const [pendingLangAdd, setPendingLangAdd] = useState<string | null>(null);

  const localRef = useRef<Storybook | null>(null);
  const prevIdRef = useRef<string | null>(null);
  const prevUpdatedAtRef = useRef<string | undefined>(undefined);
  const [, setTick] = useState(0);

  if (
    storybook &&
    (prevIdRef.current !== storybook.id || prevUpdatedAtRef.current !== storybook.updatedAt)
  ) {
    localRef.current = structuredClone(storybook);
    prevIdRef.current = storybook.id;
    prevUpdatedAtRef.current = storybook.updatedAt;
  }

  const handleUpdate = useCallback((updater: (draft: Storybook) => void) => {
    if (!localRef.current) return;
    const clone = structuredClone(localRef.current);
    updater(clone);
    localRef.current = clone;
    setTick((n) => n + 1);
  }, []);

  const handleSave = useCallback(() => {
    if (!localRef.current) return;
    saveMutation.mutate(structuredClone(localRef.current));
  }, [saveMutation]);

  // sidebar 활성 표시 동기화 — 펼친 카드를 사이드바도 활성으로
  useEffect(() => {
    setSelectedId(storybookId);
  }, [storybookId, setSelectedId]);

  if (isLoading) return <Spinner size="lg" className="m-8" />;
  if (error || !storybook) {
    return (
      <div className="p-8 text-center text-rose-500">{error?.message ?? '데이터 로드 실패'}</div>
    );
  }

  const declaredLangs = storybook.languages?.length ? storybook.languages : ['ko'];
  const implicitLangs = getAvailableLanguages(storybook);
  const langSet = new Set<string>(declaredLangs);
  for (const l of implicitLangs) langSet.add(l);
  const allLangs = ['ko', ...Array.from(langSet).filter((c) => c !== 'ko')];
  const missingLangs = SUPPORTED_LANGUAGES.filter((l) => !allLangs.includes(l.code));

  // 그림체 — availableStyles 배열 기반. 비어 있으면 [artStyle] fallback
  const styleSet = new Set<string>(storybook.availableStyles ?? []);
  styleSet.add(storybook.artStyle);
  const allStyles = Array.from(styleSet);
  // 미사용 그림체 — preset id/prompt 둘 다 비교 (레거시 'paper-craft' 같은 id 형식 처리)
  const missingStyles = ART_STYLES.filter(
    (s) =>
      !allStyles.some(
        (v) => v.toLowerCase() === s.prompt.toLowerCase() || v.toLowerCase() === s.id.toLowerCase()
      )
  );

  return (
    <>
      {/* 그림체 row */}
      <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">그림체</span>
          {allStyles.map((prompt) => {
            const preset = findArtStylePreset(prompt);
            const label = preset?.label ?? '커스텀';
            const active = prompt === storybook.artStyle;
            const canRemove = active && allStyles.length > 1; // 활성이면서 다른 그림체 있을 때만
            return (
              <button
                key={prompt}
                onClick={() => {
                  if (active) return;
                  handleUpdate((d) => {
                    switchStyleAssets(d, prompt);
                  });
                  handleSave();
                }}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-bold border',
                  active
                    ? 'bg-coral-500 text-white border-coral-500'
                    : 'bg-white text-coral-700 border-coral-200 hover:bg-coral-50 dark:bg-slate-800 dark:text-coral-300 dark:border-slate-600'
                )}
                title={prompt}
              >
                🎨 {label}
                {canRemove && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        !window.confirm(
                          `${label} 그림체를 목록에서 제거할까요?\n\n해당 그림체로 만든 표지·캐릭터·페이지 일러스트도 같이 사라집니다 (되돌릴 수 없음).`
                        )
                      )
                        return;
                      handleUpdate((d) => {
                        const cur = d.availableStyles?.length ? d.availableStyles : [d.artStyle];
                        const next = cur.filter((p) => p !== prompt);
                        d.availableStyles = next;
                        // styleAssets 에서 해당 그림체 자산도 제거
                        if (d.styleAssets) {
                          delete d.styleAssets[prompt];
                        }
                        // 다른 그림체로 전환 (자산 swap)
                        if (d.artStyle === prompt && next.length > 0) {
                          switchStyleAssets(d, next[0]);
                        }
                      });
                      handleSave();
                    }}
                    className="ml-1 opacity-70 hover:opacity-100"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {missingStyles.length > 0 && (
            <StyleAddDropdown
              missingStyles={missingStyles}
              onAdd={(prompt) => {
                const preset = ART_STYLES.find((s) => s.prompt === prompt);
                setPendingStyleAdd({
                  id: preset?.id ?? 'custom',
                  label: preset?.label ?? '커스텀',
                  prompt,
                });
              }}
            />
          )}
        </div>
      </div>

      {/* 언어 row */}
      <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">언어</span>
          {allLangs.map((code) => {
            const meta = SUPPORTED_LANGUAGES.find((l) => l.code === code);
            const flag = LANG_FLAG[code] ?? '🌐';
            const active = code === activeLang;
            return (
              <button
                key={code}
                onClick={() => setActiveLang(code)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-bold border',
                  active
                    ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-600'
                )}
                title={meta?.label}
              >
                {flag} {code}
                {active && allLangs.length > 1 && code !== 'ko' && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!window.confirm(`${code} 언어를 제거할까요? (텍스트/TTS 데이터 사라짐)`))
                        return;
                      handleUpdate((d) => {
                        const cur = d.languages?.length ? d.languages : ['ko'];
                        d.languages = cur.filter((c) => c !== code);
                        if (d.languages.length === 0) d.languages = ['ko'];
                      });
                      handleSave();
                      setActiveLang('ko');
                    }}
                    className="ml-1 opacity-70 hover:opacity-100"
                  >
                    ×
                  </span>
                )}
              </button>
            );
          })}
          {missingLangs.length > 0 && (
            <LangAddDropdown
              missingLangs={missingLangs}
              onAdd={(code) => setPendingLangAdd(code)}
            />
          )}
        </div>
      </div>

      {/* v1 EditorContent — 활성 언어를 컨텍스트로 주입 + 헤더에 삭제 버튼 (저장 옆) 주입 + 한 줄 헤더 + 마케팅 탭 숨김 */}
      <EditorLangProvider lang={activeLang}>
        <EditorContent
          storybook={localRef.current ?? storybook}
          saving={saveMutation.isPending}
          onSave={handleSave}
          onUpdate={handleUpdate}
          compactHeader
          hiddenTabIds={['quiz', 'blog', 'card-news']}
          headerExtraActions={
            !isBase && onDelete ? (
              <button
                onClick={onDelete}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30"
                title={`${level} 레벨 variant 삭제 — 페이지·이미지·오디오 영구 삭제`}
              >
                🗑 {level} 삭제
              </button>
            ) : undefined
          }
        />
      </EditorLangProvider>

      {/* 모달 */}
      {pendingStyleAdd && (
        <AddStyleConfirmModal
          presetId={pendingStyleAdd.id}
          presetLabel={pendingStyleAdd.label}
          presetPrompt={pendingStyleAdd.prompt}
          onConfirm={() => {
            const prompt = pendingStyleAdd!.prompt;
            handleUpdate((d) => {
              const cur = d.availableStyles?.length ? d.availableStyles : [d.artStyle];
              if (!cur.includes(prompt)) d.availableStyles = [...cur, prompt];
              else d.availableStyles = cur;
              // styleAssets snapshot + 새 그림체로 전환 (top-level 자산은 비워짐)
              switchStyleAssets(d, prompt);
            });
            handleSave();
            setPendingStyleAdd(null);
          }}
          onCancel={() => setPendingStyleAdd(null)}
        />
      )}
      {pendingLangAdd && (
        <AddLanguageConfirmModal
          langCode={pendingLangAdd}
          onConfirm={() => {
            const code = pendingLangAdd!;
            handleUpdate((d) => {
              const cur = d.languages?.length ? d.languages : ['ko'];
              if (!cur.includes(code)) d.languages = [...cur, code];
            });
            handleSave();
            setActiveLang(code);
            setPendingLangAdd(null);
          }}
          onCancel={() => setPendingLangAdd(null)}
        />
      )}
    </>
  );
}

// ─── 그림체 추가 dropdown (미존재 그림체만) ─────────────────────────────────

function StyleAddDropdown({
  missingStyles,
  onAdd,
}: {
  missingStyles: { id: string; label: string; prompt: string }[];
  onAdd: (prompt: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px] font-bold"
      >
        + 그림체
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[260px] max-h-[60vh] overflow-y-auto">
          {missingStyles.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setOpen(false);
                onAdd(s.prompt);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <span>🎨</span>
              <span className="font-bold">{s.label}</span>
              <span className="opacity-60 text-[10px] truncate">{s.prompt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 언어 추가 dropdown ─────────────────────────────────────────────────────

function LangAddDropdown({
  missingLangs,
  onAdd,
}: {
  missingLangs: { code: string; label: string }[];
  onAdd: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative ml-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px] font-bold"
      >
        + 언어
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[180px]">
          {missingLangs.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setOpen(false);
                onAdd(l.code);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <span>{LANG_FLAG[l.code] ?? '🌐'}</span>
              <span className="font-bold">{l.code}</span>
              <span className="opacity-70">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
