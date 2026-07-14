import { useMemo } from 'react';
import type { Storybook, StyleAssets } from '@tangobook/shared';
import { ART_STYLES, getEffectiveVocabulary } from '@tangobook/shared';

interface BookManageTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

/**
 * "책 관리" 탭 — 책 한 권(단일 storybook doc) 단위.
 *  - 메인 그림체 (defaultStyle) 명시 지정 — 라이브러리 표지/어휘 게임 일러스트가 이 그림체 따름
 *  - (그림체 × 언어) 매트릭스에 페이지/삽화/TTS/표지/영상/게임 완성도 한눈에
 */
export function BookManageTab({ storybook, onUpdate, onSave }: BookManageTabProps) {
  const styles = useMemo(() => {
    const list = storybook.availableStyles?.length
      ? [...storybook.availableStyles]
      : [storybook.artStyle];
    return list.filter(Boolean);
  }, [storybook.availableStyles, storybook.artStyle]);

  const langs = useMemo(() => {
    const list = storybook.languages?.length ? [...storybook.languages] : ['ko'];
    if (!list.includes('ko')) list.unshift('ko');
    return list;
  }, [storybook.languages]);

  const defaultStyle = storybook.defaultStyle ?? storybook.artStyle;

  const setDefaultStyle = (style: string) => {
    onUpdate((draft) => {
      draft.defaultStyle = style;
    });
    onSave();
  };

  // 메인 그림체의 활성 언어 표지 — 헤더 미리보기용 (없으면 fallback chain)
  const headerCover = useMemo(() => {
    const a = getStyleAssetsFor(storybook, defaultStyle);
    const koCover = a.primaryCoverByLang?.ko ?? a.coverImage ?? a.coverImages?.[0]?.imageUrl;
    return koCover ?? null;
  }, [storybook, defaultStyle]);

  return (
    <div className="space-y-6">
      {/* 헤더: 표지 + 제목 */}
      <section className="flex gap-5 bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
        {headerCover ? (
          <img
            src={headerCover}
            alt={storybook.title}
            className="w-32 h-40 object-cover rounded-md shrink-0 bg-slate-100"
          />
        ) : (
          <div className="w-32 h-40 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl shrink-0">
            📚
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2 truncate">
            {storybook.title}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {storybook.category && (
              <span className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded font-bold">
                📂 {storybook.category}
              </span>
            )}
            {storybook.readingLevel && (
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                {storybook.readingLevel}
              </span>
            )}
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
              📄 {storybook.pages?.length ?? 0}쪽
            </span>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
              {storybook.isPublic ? '🌐 공개' : '🔒 비공개'}
            </span>
          </div>
        </div>
      </section>

      {/* 메인 그림체 선택 */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          🎨 메인 그림체
          <span className="ml-2 text-[11px] font-normal text-slate-500 dark:text-slate-400">
            라이브러리 표지·어휘 게임 일러스트에서 이 그림체로 노출
          </span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => {
            const preset = ART_STYLES.find(
              (a) =>
                a.prompt.toLowerCase() === s.toLowerCase() || a.id.toLowerCase() === s.toLowerCase()
            );
            const isActive = s === defaultStyle;
            return (
              <button
                key={s}
                onClick={() => setDefaultStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                }`}
              >
                {isActive && '⭐ '}
                {preset?.label ?? s}
              </button>
            );
          })}
        </div>
      </section>

      {/* 콘텐츠 설정 */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">⚙️ 콘텐츠 설정</h3>
        <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!storybook.hideVocabulary}
            onChange={(e) => {
              onUpdate((draft) => {
                draft.hideVocabulary = !e.target.checked;
              });
              onSave();
            }}
          />
          <span>
            단어 익히기 표시
            <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-500">
              끄면 책 상세의 "단어 익히기" 카드 + 상단 3단계 가이드의 2번째 단계를 숨김 (생활동화
              등)
            </span>
          </span>
        </label>
      </section>

      {/* 완성도 매트릭스 */}
      <section className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          📊 완성도 매트릭스
          <span className="ml-2 text-[11px] font-normal text-slate-500 dark:text-slate-400">
            (그림체 × 언어) — 각 셀은 표지/페이지글/삽화/TTS/영상/게임 완성도
          </span>
        </h3>
        <CompletenessMatrix storybook={storybook} styles={styles} langs={langs} />
        <Legend />
      </section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers — 그림체별 자산 추출 (활성 style 은 top-level, 그 외는 styleAssets)
// ────────────────────────────────────────────────────────────────────────────

function getStyleAssetsFor(sb: Storybook, style: string): StyleAssets {
  if (style === sb.artStyle) {
    return {
      coverImages: sb.coverImages,
      coverImage: sb.coverImage,
      coverPrompt: sb.coverPrompt,
      coverImageHistory: sb.coverImageHistory,
      coverCharacterRefs: sb.coverCharacterRefs,
      primaryCoverByLang: sb.primaryCoverByLang,
      keyObjectImages: sb.keyObjectImages,
      vocabularyImages: sb.vocabularyImages,
    };
  }
  return sb.styleAssets?.[style] ?? {};
}

function getPageIllustrationFor(
  sb: Storybook,
  style: string,
  pageNumber: number
): string | undefined {
  if (style === sb.artStyle) {
    return sb.pages.find((p) => p.pageNumber === pageNumber)?.illustrationUrl;
  }
  return sb.styleAssets?.[style]?.pageIllustrations?.[pageNumber]?.illustrationUrl;
}

// ────────────────────────────────────────────────────────────────────────────
// 완성도 계산 — (style × lang) 한 셀
// ────────────────────────────────────────────────────────────────────────────

interface CellStatus {
  cover: boolean;
  pageText: boolean;
  pageIllust: boolean;
  pageTts: boolean;
  video: boolean;
  game: boolean;
}

function computeCellStatus(sb: Storybook, style: string, lang: string): CellStatus {
  const isKo = lang === 'ko';
  const pages = sb.pages ?? [];
  const pageCount = pages.length;
  const styleAssets = getStyleAssetsFor(sb, style);

  // 표지 — (style, lang) 대표 우선, 없으면 그 그림체에 한 장이라도 있으면 부분 인정
  const cover =
    !!styleAssets.primaryCoverByLang?.[lang] ||
    !!styleAssets.coverImages?.some((c) => c.imageUrl) ||
    (style === sb.artStyle && !!sb.coverImage);

  // 페이지 텍스트
  const pageText =
    pageCount > 0 &&
    pages.every((p) => {
      const t = isKo ? p.text : p.translations?.[lang]?.text;
      return !!t?.trim();
    });

  // 페이지 삽화 (그림체 종속, 언어 무관)
  const pageIllust =
    pageCount > 0 && pages.every((p) => !!getPageIllustrationFor(sb, style, p.pageNumber));

  // 페이지 TTS (언어 종속, 그림체 무관)
  const pageTts =
    pageCount > 0 &&
    pages.every((p) => {
      const tts = isKo ? p.ttsUrl : p.translations?.[lang]?.ttsUrl;
      return !!tts;
    });

  // 동영상 — longformProjects 에 (style, lang) cell 존재 + 모든 scene clipUrl 채워짐
  const lf = (sb.longformProjects ?? []).find(
    (p) => p.artStyle === style && (p.language ?? 'ko') === lang
  );
  const video = !!lf && lf.scenes.length > 0 && lf.scenes.every((s) => !!s.clipUrl);

  // 게임 — 어휘 entry 존재 + 활성 lang 의 단어 텍스트 (vocab 자체가 lang independent 면 ko 만 체크)
  const vocab = getEffectiveVocabulary(sb);
  const game = vocab.length > 0;

  return { cover, pageText, pageIllust, pageTts, video, game };
}

// ────────────────────────────────────────────────────────────────────────────
// UI — 매트릭스 + 셀
// ────────────────────────────────────────────────────────────────────────────

function CompletenessMatrix({
  storybook,
  styles,
  langs,
}: {
  storybook: Storybook;
  styles: string[];
  langs: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <table className="min-w-full text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">
              그림체 \ 언어
            </th>
            {langs.map((lang) => (
              <th
                key={lang}
                className="px-3 py-2 text-center font-bold text-slate-600 dark:text-slate-300 uppercase"
              >
                {lang}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {styles.map((style) => {
            const preset = ART_STYLES.find(
              (a) =>
                a.prompt.toLowerCase() === style.toLowerCase() ||
                a.id.toLowerCase() === style.toLowerCase()
            );
            return (
              <tr key={style} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {preset?.label ?? style}
                </td>
                {langs.map((lang) => (
                  <td key={lang} className="px-3 py-2">
                    <Cell status={computeCellStatus(storybook, style, lang)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ status }: { status: CellStatus }) {
  const items: Array<{ key: keyof CellStatus; emoji: string; label: string }> = [
    { key: 'cover', emoji: '📕', label: '표지' },
    { key: 'pageText', emoji: '📝', label: '글' },
    { key: 'pageIllust', emoji: '🎨', label: '삽화' },
    { key: 'pageTts', emoji: '🔊', label: 'TTS' },
    { key: 'video', emoji: '🎬', label: '영상' },
    { key: 'game', emoji: '🎮', label: '게임' },
  ];
  const completed = items.filter((i) => status[i.key]).length;
  return (
    <div className="flex items-center justify-center gap-1.5">
      {items.map((i) => {
        const ok = status[i.key];
        return (
          <span
            key={i.key}
            title={`${i.label} — ${ok ? '완성' : '없음'}`}
            className={`text-base leading-none ${ok ? 'opacity-100' : 'opacity-25 grayscale'}`}
          >
            {i.emoji}
          </span>
        );
      })}
      <span className="ml-1 text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
        {completed}/{items.length}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 px-1">
      <span>📕 표지</span>
      <span>📝 페이지 글</span>
      <span>🎨 페이지 삽화 (그림체 종속)</span>
      <span>🔊 페이지 TTS (언어 종속)</span>
      <span>🎬 영상</span>
      <span>🎮 게임 (어휘)</span>
    </div>
  );
}
