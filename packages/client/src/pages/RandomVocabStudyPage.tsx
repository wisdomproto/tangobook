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

// 세션 동안 마지막으로 뽑은 책 — 게임 재진입 시 같은 책 유지 (🎲 로만 변경). 모듈 스코프라 remount 초월.
let sessionBookId: string | undefined;

export default function RandomVocabStudyPage() {
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

  // 실제 책 → 단원 (storybookId 세팅됨 → 게임이 진짜 책 컨텍스트로 동작).
  // 대표 그림체를 derive 에 전달 → 게임 이미지가 아래 표시 라벨(currentStyle)과 일치.
  const currentStyle = book?.defaultStyle ?? book?.artStyle;
  const unit = useMemo(
    () => (book ? deriveStorybookUnit(book, book.defaultStyle ?? book.artStyle) : null),
    [book]
  );
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
          {/* 책 제목은 아래 카드(📖)에 나오므로 헤더는 중복 제거 — 좁은 폭 확보 */}
          <span className="truncate">🎮 어휘 게임</span>
        </PageHeader>
      </div>

      <main className="px-4 sm:px-8 pt-4 pb-6 max-w-[1600px] mx-auto">
        {/* 어떤 동화책·그림체에서 나온 낱말인지 안내 — 표지 썸네일 + 제목 + 장르(실명 비노출) */}
        <div className="mb-5 flex w-fit items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
          {book?.coverImage && (
            <img
              src={book.coverImage}
              alt=""
              aria-hidden
              className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-sm"
            />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-lg font-black leading-tight text-ink-900 break-keep sm:text-xl">
              📖 {book?.title}
            </span>
            {currentStyle && (
              <span className="text-sm font-bold text-ink-500 break-keep">
                🎨 {styleLabel(currentStyle, 0)}
              </span>
            )}
          </div>
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
