import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mascot, Skeleton, Chip } from '@/design-system';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import type { Lang, VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';
import { useVocabularyUnit } from '../hooks/useVocabularyUnits';
import { VocabularyStudyContent } from './VocabularyStudyContent';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

/** 단원 단어 목록에 lang 데이터가 충분한지 — 토글 disabled 결정용 */
function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko') {
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  }
  return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
}

function getDisplayUnitName(unit: VocabularyUnit, lang: Lang): string {
  if (lang === 'ko') return unit.nameKo;
  return unit.nameEn ?? unit.nameKo;
}

/**
 * 단원 학습 풀화면 (/vocabulary/:unitId).
 *
 * 표지 hero + 호리/말풍선 + 학습 콘텐츠 (단어 미리보기 + 게임 카드).
 * 학습 콘텐츠는 BookDetailPage 와 공유 — `VocabularyStudyContent` 컴포넌트.
 *
 * MVP 시점 진입: 사이드바 어휘 axis 는 "준비 중" 음영이라 직접 URL 또는 책 detail 의
 * "단어 익히기" 카드 → 책 detail inline 섹션 흐름이 메인. 이 페이지는 라우트 보존
 * 용도 (직접 URL 접근 시 동작) + 어휘 단원 단독 학습 시 fallback.
 */
export function VocabularyStudyPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useVocabularyUnit(unitId);

  const [lang, setLang] = useState<Lang | null>(null); // null = 단원 default 따라감

  // 책 표지의 그림체 자동 매칭 — storybook source 단원만 fetch
  const { data: storybook } = useStorybook(unit?.storybookId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
        <Skeleton className="w-80 h-96 rounded-3xl" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50 text-center">
        <Mascot state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">
          단원을 찾을 수 없어요
        </h2>
        <button
          onClick={() => navigate('/library')}
          className="mt-6 px-5 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop"
        >
          🏠 라이브러리로
        </button>
      </div>
    );
  }

  const hasKo = hasLangData(unit.words, 'ko');
  const hasEn = hasLangData(unit.words, 'en');
  const effectiveLang: Lang =
    lang ??
    (unit.language && hasLangData(unit.words, unit.language) ? unit.language : hasKo ? 'ko' : 'en');

  const wordCount = unit.words.length;

  // 책 표지 — defaultStyle/artStyle 의 styleAssets[].coverImage 우선
  const currentStyle = storybook?.defaultStyle ?? storybook?.artStyle;
  const styleCover =
    currentStyle && storybook?.styleAssets?.[currentStyle]?.coverImage
      ? storybook.styleAssets[currentStyle]!.coverImage
      : (storybook?.coverImage ?? unit.coverImage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
      <header className="px-6 pt-6 max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(unit.storybookId ? `/library/${unit.storybookId}` : '/library')}
            className="inline-flex items-center gap-2 px-5 py-3 text-lg rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 책 상세
          </button>
          <span className="hidden sm:inline text-base font-bold text-ink-500 truncate">
            📖 <span className="text-ink-700">{getDisplayUnitName(unit, effectiveLang)}</span>
          </span>
        </div>

        {/* 언어 토글 */}
        <div className="bg-white rounded-2xl px-4 py-2 shadow-soft flex gap-2">
          <Chip
            variant="coral"
            active={effectiveLang === 'ko'}
            onClick={() => hasKo && setLang('ko')}
            disabled={!hasKo}
            aria-label="한국어"
          >
            한국어
          </Chip>
          <Chip
            variant="coral"
            active={effectiveLang === 'en'}
            onClick={() => hasEn && setLang('en')}
            disabled={!hasEn}
            aria-label="English"
          >
            English
          </Chip>
        </div>
      </header>

      <main className="px-6 pb-8 mt-4 max-w-6xl mx-auto space-y-8">
        {/* hero — 표지 + 호리/말풍선 */}
        <section className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
          {styleCover ? (
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <img
                src={styleCover}
                alt={unit.nameKo}
                loading="lazy"
                className="max-h-48 lg:max-h-56 w-auto rounded-3xl shadow-pop border-4 border-white object-cover"
              />
            </div>
          ) : (
            <div className="lg:col-span-5 flex items-center justify-center text-7xl">
              {unit.emoji ?? '🌱'}
            </div>
          )}

          <div className="lg:col-span-7">
            {!styleCover && (
              <h1 className="text-4xl lg:text-5xl font-black font-display text-ink-900 leading-tight mb-3 text-center lg:text-left">
                {getDisplayUnitName(unit, effectiveLang)}
              </h1>
            )}

            <div className="flex items-end justify-center lg:justify-start gap-3 mt-4 lg:mt-0">
              <Mascot state="reading" size="md" />
              <div className="relative bg-white rounded-2xl shadow-soft px-5 py-3">
                <p className="text-lg lg:text-xl font-black font-display text-ink-900">
                  단어 {wordCount}개! 어떤 게임 해볼까? ✨
                </p>
                <span
                  aria-hidden
                  className="absolute left-[-10px] bottom-4 w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 단어 미리보기 + 게임 카드 + 모달들 — BookDetailPage 와 공용 */}
        <VocabularyStudyContent
          unit={unit}
          storybook={storybook ?? undefined}
          currentStyle={currentStyle ?? undefined}
          lang={effectiveLang}
        />
      </main>
    </div>
  );
}
