import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStorybook, useSaveStorybook } from '@/features/storybook';
import { Spinner } from '@/components/Spinner';
import { EditorContent } from '@/features/editor/components/EditorContent';
import { EditorLangProvider } from '@/contexts/EditorLangContext';
import { useEditorStore } from '@/store/editor.store';
import { cn } from '@/lib/cn';
import { SUPPORTED_LANGUAGES, canonicalizeArtStyle } from '@tangobook/shared';
import { getAvailableLanguages } from '@/lib/storybook-accessors';
import type { Storybook, ReadingLevel } from '@tangobook/shared';
import { AddLanguageConfirmModal } from './VariantConfirmModals';
import { findArtStylePreset } from '@/features/editor/lib/style-assets';
import { syncBookPublicAfterCellToggle } from '@/features/library/lib/public-sync';
import { settingsApi } from '@/features/settings/api/settings.api';
import { StyleLibraryEditModal } from '@/features/settings/components/StyleLibraryEditModal';
import { ArtStyleSelect } from './ArtStyleSelect';

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

/** 레벨이 비어 있거나 모르는 값일 때. */
const UNKNOWN_LEVEL_INFO: LevelInfo = {
  label: '레벨 없음',
  age: '',
  emoji: '📚',
  color: 'slate',
};

function getLevelInfo(level: string | undefined): LevelInfo {
  return (
    (level && (LEVEL_INFO as Record<string, LevelInfo | undefined>)[level]) || UNKNOWN_LEVEL_INFO
  );
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
  expanded: boolean;
  onToggle: () => void;
}

/**
 * 책 한 권의 편집 카드 — 헤더(레벨 · 쪽수 · 그림체 · 언어) + 펼치면 그림체/언어 row + 콘텐츠 탭.
 * 🔴 한 책 = 한 레벨(2026-09-14). 예전엔 `<id>__L1` 사본을 레벨마다 만들어 카드를 쌓았다.
 * 레벨은 책의 `readingLevel` 필드 하나다.
 * 한 번 펼쳐지면 mount 유지 (접었다 다시 펼칠 때 fetch 재발생 방지 + 로컬 편집 보존).
 */
export function LevelEditCard({ storybookId, expanded, onToggle }: LevelEditCardProps) {
  const { data: sb } = useStorybook(storybookId);
  const info = getLevelInfo(sb?.readingLevel);
  const [hasMounted, setHasMounted] = useState(expanded);
  useEffect(() => {
    if (expanded) setHasMounted(true);
  }, [expanded]);
  const shouldMount = hasMounted || expanded;

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
        level={sb?.readingLevel}
        storybookId={storybookId}
        expanded={expanded}
        onToggle={onToggle}
      />
      {shouldMount && (
        <div
          style={{ display: expanded ? 'block' : 'none' }}
          className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-[10px] relative"
        >
          <CardBody storybookId={storybookId} />
        </div>
      )}
    </div>
  );
}

// ─── 카드 헤더 ────────────────────────────────────────────────────────────────

function CardHeader({
  info,
  level,
  storybookId,
  expanded,
  onToggle,
}: {
  info: { label: string; age: string; emoji: string };
  level: ReadingLevel | undefined;
  storybookId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: sb } = useStorybook(storybookId);
  const { data: styleLibrary } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: settingsApi.getArtStyleLibrary,
    staleTime: 60_000,
  });
  const styleLabel = sb && findArtStylePreset(sb.artStyle, styleLibrary)?.label;
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
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {sb ? (
            <>
              📄 {sb.pages?.length ?? 0}쪽 · 🎨 {styleLabel ?? sb.artStyle} ·{' '}
              {langCount > 1 ? `🌐 ${langCount}개 언어` : '🇰🇷 한국어'}
              {sb.title && <> · {sb.title}</>}
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

function CardBody({ storybookId }: { storybookId: string }) {
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const { data: storybook, isLoading, error } = useStorybook(storybookId);
  const saveMutation = useSaveStorybook();

  const [activeLang, setActiveLang] = useState<string>('ko');
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

  // 그림체 라이브러리 (R2 저장, ART_STYLES preset 자동 seed). 모든 hooks 는 early return 위.
  const { data: styleLibrary } = useQuery({
    queryKey: ['art-style-library'],
    queryFn: settingsApi.getArtStyleLibrary,
    staleTime: 60_000,
  });
  const [styleEditOpen, setStyleEditOpen] = useState(false);

  // 🔴 한 책 = 한 그림체(2026-09-14) — 이 책의 그림체 하나. 다른 그림체 버전은 책을 복사해 바꾼다.
  const styleId = storybook ? canonicalizeArtStyle(storybook.artStyle) || storybook.artStyle : '';

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

  return (
    <>
      {/* 그림체 row */}
      <div className="px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">그림체</span>
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold border bg-coral-500 text-white border-coral-500"
            title={styleId}
          >
            🎨 {findArtStylePreset(styleId, styleLibrary)?.label ?? '커스텀'}
          </span>
          {/* 그림체 변경 — 라이브러리 안에서만 고른다(삽화는 다시 만들어야 한다). 같은 이야기의
              다른 그림체 버전이 필요하면 책을 복사해 그 사본의 그림체를 바꾸고 그룹으로 묶는다. */}
          <ArtStyleSelect
            storybook={storybook}
            onUpdate={handleUpdate}
            onSave={handleSave}
            className="py-0.5 text-[11px]"
          />
          {/* 라인 맨 오른쪽 — ⚙️ 그림체 라이브러리 편집 */}
          <button
            onClick={() => setStyleEditOpen(true)}
            className="ml-auto px-2 py-0.5 rounded text-[11px] font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title="그림체 라이브러리 편집 (이름·프롬프트 수정, 추가, 제거, 순서 이동)"
          >
            ⚙️ 그림체 편집
          </button>
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

      {/* v1 EditorContent — 활성 언어를 컨텍스트로 주입 + 헤더에 (그림체×언어) 공개 체크박스 (저장 왼쪽) + 삭제 버튼 (저장 오른쪽) 주입 + 한 줄 헤더 + 마케팅 탭 숨김 */}
      <EditorLangProvider lang={activeLang}>
        <EditorContent
          storybook={localRef.current ?? storybook}
          saving={saveMutation.isPending}
          onSave={handleSave}
          onUpdate={handleUpdate}
          compactHeader
          hiddenTabIds={['quiz', 'blog', 'card-news']}
          headerExtraLeft={(() => {
            const sb = localRef.current ?? storybook;
            const style = sb.artStyle;
            const isPublic = sb.publicByStyleLang?.[style]?.[activeLang] !== false;
            const styleLabel = findArtStylePreset(style, styleLibrary)?.label ?? '커스텀';
            const flag = LANG_FLAG[activeLang] ?? '🌐';
            return (
              <label
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-bold cursor-pointer transition',
                  isPublic
                    ? 'border-coral-300 bg-coral-50 text-coral-700 hover:bg-coral-100 dark:bg-coral-900/20 dark:text-coral-200 dark:border-coral-700'
                    : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600'
                )}
                title={`이 (그림체, 언어) 조합의 라이브러리 노출 토글`}
              >
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={() => {
                    handleUpdate((d) => {
                      const s = d.artStyle;
                      const cur = d.publicByStyleLang?.[s]?.[activeLang] !== false;
                      const next = !cur;
                      if (!d.publicByStyleLang) d.publicByStyleLang = {};
                      if (!d.publicByStyleLang[s]) d.publicByStyleLang[s] = {};
                      d.publicByStyleLang[s][activeLang] = next;
                      // 책 단위 isPublic 자동 동기화 (모든 셀 false → isPublic=false, 하나라도 true → 회복)
                      const synced = syncBookPublicAfterCellToggle(d);
                      d.isPublic = synced.isPublic;
                    });
                    handleSave();
                  }}
                  className="w-4 h-4 accent-coral-500 cursor-pointer"
                />
                <span>공개</span>
                <span className="text-[10px] opacity-70">
                  🎨 {styleLabel} · {flag} {activeLang}
                </span>
              </label>
            );
          })()}
        />
      </EditorLangProvider>

      {/* 모달 */}
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
      {styleEditOpen && <StyleLibraryEditModal onClose={() => setStyleEditOpen(false)} />}
    </>
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
