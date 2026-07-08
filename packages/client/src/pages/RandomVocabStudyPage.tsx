import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Mascot, PageHeader } from '@/design-system';
import { useStorybooks, useStorybook } from '@/features/storybook';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import { VocabularyStudyContent } from '@/features/vocabulary-unit/components/VocabularyStudyContent';
import { useStyleGenreLabel } from '@/lib/art-style-genre';
import type { Lang, VocabularyUnitWord } from '@tangobook/shared';

/**
 * 어휘 게임 — 세계 명작 중 **랜덤 1권**의 "단어 익히기"(동화책 게임 4종)를 그대로 플레이.
 * 사이드바 "어휘 게임" 진입점. AppShell 밖 풀화면.
 *
 * 🔴 왜 mix 가 아니라 1권인가 (2026-07-08 재설계): 게임 플레이어는 `storybookId` 하나로
 *   동작 — 정답 음원 프리워밍(cache 키)·정답 후 "그 단어가 나온 동화책 페이지" 장면 리빌이
 *   모두 그 책 컨텍스트를 필요로 한다. 여러 책을 섞으면 storybookId 가 가짜라 (1) 정답 음원이
 *   정답 순간에야 concat 되어 늦게 나오고 (2) 장면 리빌이 안 뜬다. 랜덤 1권을 실제 책으로
 *   공급하면 책 안 "단어 익히기" 와 **완전히 동일한 경로**를 타므로 그 fix 들을 그대로 물려받는다.
 *   (책 데이터가 이미 이미지·TTS·keypoints 를 다 가지므로 그림 그리기 포함 4종 전부 활성.)
 *   콘텐츠 다양성은 진입 시 랜덤 + 🎲 다른 책 버튼으로 확보.
 */

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko')
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
}

export default function RandomVocabStudyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang | null>(null); // null = 자동 (한국어 우선)
  const [seed, setSeed] = useState(0); // 🎲 다른 책 — 랜덤 재추첨
  const { data: books, isLoading: booksLoading } = useStorybooks();

  // 세계 명작(공개) 중 랜덤 1권 id — books 로드 시 확정, seed 바뀌면 재추첨.
  const pickedId = useMemo(() => {
    if (!books) return undefined;
    const classics = books.filter((b) => b.category === '세계 명작' && b.isPublic).map((b) => b.id);
    if (classics.length === 0) return undefined;
    return classics[Math.floor(Math.random() * classics.length)];
    // seed 를 의도적으로 dependency 에 포함 (재추첨 트리거)
  }, [books, seed]);

  // 그 책만 fetch — 책 상세 "단어 익히기" 와 동일 캐시 키(['storybook', id]) 공유.
  const { data: book, isLoading: bookLoading } = useStorybook(pickedId);

  // 실제 책 → 단원 (storybookId 세팅됨 → 게임이 진짜 책 컨텍스트로 동작).
  const unit = useMemo(() => (book ? deriveStorybookUnit(book) : null), [book]);
  const currentStyle = book?.defaultStyle ?? book?.artStyle;
  const styleLabel = useStyleGenreLabel(); // 그림체 실명 비노출 → 장르 라벨

  const loading = booksLoading || (!!pickedId && (bookLoading || !unit));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 gap-6 px-6 text-center">
        <Mascot character="hori" state="thinking" size="xl" />
        <h2 className="text-3xl md:text-4xl font-black text-ink-900 font-display animate-pulse">
          단어 모으는 중...
        </h2>
        <p className="text-lg font-bold text-ink-500">잠깐만 기다려 줘! 🐯</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 text-center gap-4">
        <Mascot character="hori" state="thinking" size="lg" />
        <h2 className="text-2xl font-black text-ink-900 font-display">단어를 준비하지 못했어요</h2>
        <button
          onClick={() => navigate('/library')}
          className="mt-2 px-6 py-3 bg-coral-500 text-white rounded-full font-black shadow-pop"
        >
          🏠 라이브러리로
        </button>
      </div>
    );
  }

  const hasKo = hasLangData(unit.words, 'ko');
  const hasEn = hasLangData(unit.words, 'en');
  const effectiveLang: Lang = lang ?? (hasKo ? 'ko' : 'en');

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="px-6 max-w-[1600px] mx-auto">
        <PageHeader
          onBack={() => navigate('/library')}
          onHome={() => navigate('/library')}
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSeed((s) => s + 1)}
                className="rounded-full bg-white px-4 py-2.5 shadow-soft text-base font-black text-ink-700 hover:shadow-pop transition"
                aria-label="다른 책으로 바꾸기"
              >
                🎲 다른 책
              </button>
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
            </div>
          }
        >
          <span className="truncate">🎮 어휘 게임</span>
        </PageHeader>
      </div>

      <main className="px-4 sm:px-8 pt-4 pb-6 max-w-[1600px] mx-auto">
        {/* 어떤 동화책·그림체에서 나온 낱말인지 안내 (그림체는 실명 대신 장르 라벨) */}
        <div className="mb-4 flex items-center gap-2 flex-wrap px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-soft text-base font-black text-ink-800 break-keep">
            📖 {book?.title}
          </span>
          {currentStyle && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 shadow-soft text-base font-black text-ink-600 break-keep">
              🎨 {styleLabel(currentStyle, 0)}
            </span>
          )}
        </div>
        <VocabularyStudyContent
          unit={unit}
          storybook={book ?? undefined}
          currentStyle={currentStyle ?? undefined}
          lang={effectiveLang}
        />
      </main>
    </div>
  );
}
