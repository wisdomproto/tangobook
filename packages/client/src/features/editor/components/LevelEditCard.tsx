import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useStyleGenreMap, STYLE_GENRES, type StyleGenreSlug } from '@/lib/art-style-genre';

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
  // 학습자용 그림체 장르(수채동화풍/페이퍼3D/콜라주) 수동 지정 — styleId 전역 맵.
  const { map: styleGenreMap, setGenre } = useStyleGenreMap();

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
          {/* 그림체 변경 — 이 책의 그림체 이름만 바꾼다(삽화는 다시 만들어야 한다). 같은 이야기의
              다른 그림체 버전이 필요하면 책을 복사해 그 사본의 그림체를 바꾸고 그룹으로 묶는다. */}
          {styleLibrary && styleLibrary.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = '';
                if (!v || v === styleId) return;
                const picked = styleLibrary.find((st) => st.id === v);
                if (!picked) return;
                if (
                  !window.confirm(
                    `이 책의 그림체를 「${picked.name}」 로 바꿀까요?\n\n지금 삽화는 그대로 남고, 새 그림체 삽화는 다시 만들어야 합니다.`
                  )
                )
                  return;
                handleUpdate((d) => {
                  const old = canonicalizeArtStyle(d.artStyle) || d.artStyle;
                  d.artStyle = picked.id;
                  // 공개 설정은 그림체 id 를 키로 들고 있다 — 새 id 로 옮겨야 비공개가 풀리지 않는다.
                  if (d.publicByStyleLang?.[old]) {
                    d.publicByStyleLang = { [picked.id]: d.publicByStyleLang[old] };
                  }
                });
                handleSave();
              }}
              className="px-2 py-0.5 rounded text-[11px] font-bold border border-coral-300 text-coral-700 bg-white dark:bg-slate-800 dark:text-coral-300 dark:border-slate-600 cursor-pointer"
              title="이 책의 그림체 변경"
            >
              <option value="">▼ 그림체 변경</option>
              {styleLibrary.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                  {st.id === styleId ? ' ✓ 현재' : ''}
                </option>
              ))}
            </select>
          )}
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

      {/* 학습자 장르 지정 row — 각 그림체를 학습자에게 보여줄 장르(수채동화풍/페이퍼3D/콜라주)로 매핑.
          전역 styleId→장르 맵에 저장돼 라이브러리 표지·책 상세·게임 라벨에 반영됨. */}
      <div className="px-5 py-2 bg-amber-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-amber-700 uppercase mr-1">학습자 장르</span>
          {[styleId].map((styleId) => {
            const preset = findArtStylePreset(styleId, styleLibrary);
            const label = preset?.label ?? '커스텀';
            const current = styleGenreMap[styleId] ?? '';
            return (
              <label
                key={styleId}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-600"
                title={styleId}
              >
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  🎨 {label}
                </span>
                <select
                  value={current}
                  onChange={(e) =>
                    setGenre(styleId, (e.target.value || null) as StyleGenreSlug | null)
                  }
                  className={cn(
                    'text-[11px] font-bold rounded border px-1 py-0.5 cursor-pointer',
                    current
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-slate-700 dark:text-emerald-300'
                      : 'border-slate-300 text-slate-500 bg-white dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  <option value="">미지정</option>
                  {STYLE_GENRES.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
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
