import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Chip, Mascot, PageHeader } from '@/design-system';
import { useStorybooks } from '@/features/storybook';
import { storybookApi } from '@/features/storybook/api/storybook.api';
import { deriveStorybookUnit } from '@/features/vocabulary-unit/lib/derive-storybook-unit';
import { VocabularyStudyContent } from '@/features/vocabulary-unit/components/VocabularyStudyContent';
import type { Lang, Storybook, VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';

/**
 * 어휘 게임 — 세계 명작 여러 권의 낱말을 랜덤으로 섞어 동화책 게임 4종(그림짝·블록·그림 그리기·
 * 따라쓰기)을 그대로 플레이. 사이드바 "어휘 게임" 진입점. AppShell 밖 풀화면.
 *
 * 설계: `VocabularyStudyContent`(책 상세의 "단어 익히기"와 동일 컴포넌트)를 재사용하되,
 *       unit 을 한 책이 아니라 **랜덤 명작 N권의 keyObject 를 merge** 한 가상 단원으로 공급한다.
 *       실제 책 데이터를 쓰므로 이미지·TTS·keypoints(그림 그리기)까지 온전히 동작.
 *
 * 로딩: 명작 요약 목록에서 N권을 랜덤 선택 → 그 책들만 병렬 fetch(캐시 공유). 전권 로드 X.
 */
const POOL_BOOKS = 6;

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko')
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
}

export default function RandomVocabStudyPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang | null>(null); // null = 자동 (한국어 우선)
  const [seed, setSeed] = useState(0); // 🎲 다른 낱말 — 명작 N권 재추출
  const { data: books, isLoading: booksLoading } = useStorybooks();

  // 세계 명작(공개) 중 랜덤 N권 id — books 로드 시 확정, seed 바뀌면 재추출.
  const pickedIds = useMemo(() => {
    if (!books) return [];
    const classics = books.filter((b) => b.category === '세계 명작' && b.isPublic).map((b) => b.id);
    return shuffle(classics).slice(0, POOL_BOOKS);
    // seed 를 의도적으로 dependency 에 포함 (재추출 트리거)
  }, [books, seed]);

  // 선택한 책들만 병렬 fetch — useStorybook 과 동일 캐시 키 공유(중복 요청 방지).
  const results = useQueries({
    queries: pickedIds.map((id) => ({
      queryKey: ['storybook', id],
      queryFn: () => storybookApi.getById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // 로드된 책 id 서명 — merge memo 를 안정화(매 렌더 새 배열로 인한 재계산·재셔플 방지).
  const loadedSig = results.map((r) => (r.data ? r.data.id : '')).join('|');

  // 랜덤 명작 낱말 merge — 한 번 로드되면 고정(게임 내부에서 매 판 다시 N개 랜덤 추출).
  const words = useMemo<VocabularyUnitWord[]>(() => {
    const bks = results.map((r) => r.data).filter((b): b is Storybook => !!b);
    if (bks.length === 0) return [];
    // loadedSig 로 안정화 — results 는 매 렌더 새 배열이라 deps 에 직접 넣지 않는다.
    return shuffle(bks.flatMap((b) => deriveStorybookUnit(b).words));
  }, [loadedSig]);

  const unit = useMemo<VocabularyUnit | null>(() => {
    if (words.length === 0) return null;
    const now = new Date().toISOString();
    return {
      id: '__random_classic_pool__',
      source: 'custom',
      nameKo: '세계 명작 어휘',
      nameEn: 'World Classics',
      words,
      language: 'ko',
      createdAt: now,
      updatedAt: now,
    };
  }, [words]);

  const loading = booksLoading || (pickedIds.length > 0 && words.length === 0);

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
                aria-label="다른 낱말로 바꾸기"
              >
                🎲 다른 낱말
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
        <VocabularyStudyContent unit={unit} lang={effectiveLang} />
      </main>
    </div>
  );
}
