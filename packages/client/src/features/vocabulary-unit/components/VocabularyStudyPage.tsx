import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Skeleton, Chip, Mascot, PageHeader } from '@/design-system';
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

  // 표지/스타일 — VocabularyStudyContent 의 단어 미리보기 이미지 derive 에 사용
  const currentStyle = storybook?.defaultStyle ?? storybook?.artStyle;

  const displayName = getDisplayUnitName(unit, effectiveLang);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="px-6 max-w-[1600px] mx-auto">
        <PageHeader
          onBack={() => navigate(unit.storybookId ? `/library/${unit.storybookId}` : '/library')}
          onHome={() => navigate('/library')}
          right={
            <div className="bg-white rounded-full px-2 py-1.5 shadow-soft flex gap-1">
              <Chip
                variant="coral"
                active={effectiveLang === 'ko'}
                onClick={() => hasKo && setLang('ko')}
                disabled={!hasKo}
                aria-label="한국어"
                className="!text-lg !px-6 !py-2.5"
              >
                한국어
              </Chip>
              <Chip
                variant="coral"
                active={effectiveLang === 'en'}
                onClick={() => hasEn && setLang('en')}
                disabled={!hasEn}
                aria-label="English"
                className="!text-lg !px-6 !py-2.5"
              >
                English
              </Chip>
            </div>
          }
        >
          <img
            src="/icons/book/header.webp"
            alt=""
            aria-hidden
            className="w-12 h-12 lg:w-14 lg:h-14 object-contain flex-shrink-0 mr-3"
          />
          <span className="truncate">{displayName}</span>
        </PageHeader>
      </div>

      <main className="px-8 pt-4 pb-6 max-w-[1600px] mx-auto">
        {/* 시안에는 표지 hero 없음 — 바로 단어 미리보기 + 게임 카드 */}
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
