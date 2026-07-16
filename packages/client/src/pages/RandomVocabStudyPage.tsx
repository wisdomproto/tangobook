import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mascot, PageHeader } from '@/design-system';
import { useStorybooks, useStorybook } from '@/features/storybook';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import { availableVocabLangs, resolveVocabLang } from '@/features/vocabulary-unit/lib/vocab-lang';
import { VocabularyStudyContent } from '@/features/vocabulary-unit/components/VocabularyStudyContent';
import { VocabLangSelect } from '@/features/vocabulary-unit/components/VocabLangSelect';
import type { Lang } from '@tangobook/shared';

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

// 세션 동안 마지막으로 뽑은 책 — 게임 재진입 시 같은 책 유지 (🎲 로만 변경). 모듈 스코프라 remount 초월.
let sessionBookId: string | undefined;

export default function RandomVocabStudyPage() {
  const { t, i18n } = useTranslation('games');
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang | null>(null); // null = 자동 (한국어 우선)
  const [seed, setSeed] = useState(0); // 🎲 재추첨 트리거 (재렌더)
  const { data: books, isLoading: booksLoading } = useStorybooks();

  const classicIds = useMemo(
    () => (books ?? []).filter((b) => b.category === '세계 명작' && b.isPublic).map((b) => b.id),
    [books]
  );

  // 세계 명작(공개) 중 랜덤 1권 — **재진입 시 같은 책 유지**(모듈 변수 sessionBookId). 🎲 로만 변경.
  // (매 진입 재추첨하면 매번 새 책 fetch → "단어 모으는 중" 반복 로딩이 뜸.)
  const pickedId = useMemo(() => {
    if (classicIds.length === 0) return sessionBookId;
    if (sessionBookId && classicIds.includes(sessionBookId)) return sessionBookId;
    sessionBookId = classicIds[Math.floor(Math.random() * classicIds.length)];
    return sessionBookId;
    // seed: 🎲 재추첨 시 재계산 (이미 sessionBookId 갱신돼 있어 그 값 유지)
  }, [classicIds, seed]);

  // 그 책만 fetch — 책 상세 "단어 익히기" 와 동일 캐시 키(['storybook', id]) 공유.
  const { data: book, isLoading: bookLoading } = useStorybook(pickedId);

  // 활성 그림체 = 책 대표(defaultStyle) → artStyle → 첫 그림체. availableStyles 에 없는 stale 값
  // (예: 하이디 defaultStyle=pixar-3d)은 제외해 게임 이미지가 엉뚱해지지 않도록 함. 어휘 게임 화면에선
  // 그림체를 바꾸지 않음(선택기 미노출) — 책 대표 그림체로 고정.
  const styles: string[] = book
    ? book.availableStyles && book.availableStyles.length > 0
      ? book.availableStyles
      : Object.keys(book.styleAssets ?? {})
    : [];
  const inStyles = (s: string | undefined) => (s && styles.includes(s) ? s : undefined);
  const currentStyle: string | undefined =
    inStyles(book?.defaultStyle) ?? inStyles(book?.artStyle) ?? styles[0];

  // 실제 책 → 단원 (storybookId 세팅됨 → 게임이 진짜 책 컨텍스트로 동작).
  const unit = useMemo(
    () => (book ? deriveStorybookUnit(book, currentStyle) : null),
    [book, currentStyle]
  );

  const loading = booksLoading || (!!pickedId && (bookLoading || !unit));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 gap-6 px-6 text-center">
        <Mascot character="hori" state="thinking" size="xl" />
        <h2 className="text-3xl md:text-4xl font-black text-ink-900 font-display animate-pulse">
          {t('vocabHub.loading')}
        </h2>
        <p className="text-lg font-bold text-ink-500">{t('vocabHub.loadingSub')} 🐯</p>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 text-center gap-4">
        <Mascot character="hori" state="thinking" size="lg" />
        <h2 className="text-2xl font-black text-ink-900 font-display">{t('vocabHub.notReady')}</h2>
        <button
          onClick={() => navigate('/library')}
          className="mt-2 px-6 py-3 bg-coral-500 text-white rounded-full font-black shadow-pop"
        >
          🏠 {t('vocabHub.toLibrary')}
        </button>
      </div>
    );
  }

  // 표시 가능한 언어 전체 + UI 언어 우선 기본값 (사용자가 이 화면에서 안 고르면 UI 언어로).
  const availableLangs = availableVocabLangs(unit.words);
  const effectiveLang: Lang = resolveVocabLang({
    selected: lang,
    words: unit.words,
    uiLang: i18n.language,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="px-4 sm:px-8 max-w-[1600px] mx-auto">
        <PageHeader
          onBack={() => navigate('/library')}
          onHome={() => navigate('/library')}
          right={
            <button
              type="button"
              onClick={() => {
                if (classicIds.length === 0) return;
                // 직전 책과 다른 책으로 재추첨
                let next = sessionBookId;
                for (let i = 0; i < 8 && next === sessionBookId; i++) {
                  next = classicIds[Math.floor(Math.random() * classicIds.length)];
                }
                sessionBookId = next;
                setSeed((s) => s + 1);
              }}
              className="shrink-0 rounded-full bg-white px-3 py-2.5 sm:px-4 shadow-soft text-sm sm:text-base font-black text-ink-700 hover:shadow-pop transition break-keep"
              aria-label={t('vocabHub.anotherBookAria')}
            >
              🎲 {t('vocabHub.anotherBook')}
            </button>
          }
        >
          {/* 책 제목은 아래 카드(📖)에 나오므로 헤더는 중복 제거 — 좁은 폭 확보 */}
          <span className="truncate">🎮 {t('vocabHub.title')}</span>
        </PageHeader>
        {/* 언어 선택 — 칩 5개는 모바일에서 가로 오버플로우/줄바꿈이 지저분해 드롭박스로 압축. */}
        {availableLangs.length > 1 && (
          <div className="mt-2">
            <VocabLangSelect langs={availableLangs} value={effectiveLang} onChange={setLang} />
          </div>
        )}
      </div>

      <main className="px-4 sm:px-8 pt-4 pb-6 max-w-[1600px] mx-auto">
        {/* 어떤 동화책에서 나온 낱말인지 안내 — 표지 썸네일 + 제목. 그림체는 아래 드랍박스로 선택. */}
        <div className="mb-5 flex w-fit items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
          {book?.coverImage && (
            <img
              src={book.coverImage}
              alt=""
              aria-hidden
              className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm"
            />
          )}
          <span className="font-display text-lg font-black leading-tight text-ink-900 break-keep sm:text-xl">
            📖 {book?.titleTranslations?.[i18n.language] ?? book?.title}
          </span>
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
