import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Mascot } from '@/design-system';
import { useVocabularyList } from '@/features/vocabulary/hooks/useVocabulary';
import { useStorybooks } from '@/features/storybook';
import {
  unitToKoreanBlockData,
  unitToEnglishBlockData,
} from '@/features/vocabulary-unit/lib/game-data-adapter';
import { vocabEntriesToVirtualUnit } from '@/features/vocabulary-unit/lib/random-vocab-pool';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';
import type { VocabEntry } from '@tangobook/shared';

interface Props {
  lang: 'ko' | 'en';
}

type Level = 'L1' | 'L2' | 'L3';

const LEVEL_META: Record<Level, { emoji: string; label: string; sub: string; color: string }> = {
  L1: {
    emoji: '🌱',
    label: '쉬움',
    sub: '짧고 간단한 단어',
    color: 'from-emerald-400 to-emerald-500',
  },
  L2: { emoji: '🌿', label: '보통', sub: '받침 있는 단어', color: 'from-amber-400 to-amber-500' },
  L3: { emoji: '🌳', label: '어려움', sub: '복잡한 단어', color: 'from-rose-400 to-rose-500' },
};

// 한글 음절 분석 — 받침/쌍자음/이중모음/ㅐㅔ/복잡받침 검출 (vocabulary-table-ko.html 와 동일 공식)
// CLAUDE.md (단어 마스터 표 섹션) 명시 공식:
//   음절×0.7 + 받침×2 + 쌍자음×2 + 이중모음×2 + 복잡받침×3 + ㅐㅔ×2
// "자세" 가 ㅔ 가산 누락으로 L1(쉬움)에 잘못 떨어지던 문제 fix (2026-05-18).
const DOUBLE_INITIAL = new Set([1, 4, 8, 10, 13]); // ㄲ ㄸ ㅃ ㅆ ㅉ
const DIPHTHONG_MEDIAL = new Set([2, 3, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19]); // ㅑㅒㅕㅖㅘㅙㅚㅛㅝㅞㅟㅠㅢ
const AE_E_MEDIAL = new Set([1, 5]); // ㅐ ㅔ
const COMPLEX_FINAL = new Set([3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18]); // ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅄ

function koreanDifficulty(word: string): number {
  let syllables = 0;
  let batchim = 0;
  let doubleInit = 0;
  let diphthong = 0;
  let aeE = 0;
  let complexFinal = 0;
  for (const ch of word) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) continue;
    syllables++;
    const initial = Math.floor(code / 588);
    const medial = Math.floor((code % 588) / 28);
    const final = code % 28;
    if (final !== 0) batchim++;
    if (DOUBLE_INITIAL.has(initial)) doubleInit++;
    if (DIPHTHONG_MEDIAL.has(medial)) diphthong++;
    if (AE_E_MEDIAL.has(medial)) aeE++;
    if (COMPLEX_FINAL.has(final)) complexFinal++;
  }
  return (
    syllables * 0.7 + batchim * 2 + doubleInit * 2 + diphthong * 2 + aeE * 2 + complexFinal * 3
  );
}

function levelOfWord(word: string, lang: 'ko' | 'en'): Level {
  if (lang === 'ko') {
    const score = koreanDifficulty(word);
    if (score <= 1.5) return 'L1';
    if (score <= 3) return 'L2';
    return 'L3';
  }
  // 영어: 길이 기준 (블록 게임 최대 6자)
  const len = word.length;
  if (len <= 3) return 'L1';
  if (len <= 5) return 'L2';
  return 'L3';
}

function filterByLevel(
  entries: VocabEntry[],
  lang: 'ko' | 'en',
  level: Level,
  classicIds: Set<string>
): VocabEntry[] {
  return entries.filter((e) => {
    // 세계명작 책의 keyObject 단어만 (자연관찰 등 다른 카테고리 제외) — 사용자 정책 2026-07-08.
    // 단어 마스터 표와 동일하게 'storybook-key-object' source 만 인정하되, 그 출처 책이
    // 세계명작(classicIds)인 것으로 한정. ('storybook-vocabulary' 단어는 keyObject 아님 → 제외)
    if (
      !e.sources.some(
        (s) => s.sourceType === 'storybook-key-object' && classicIds.has(s.storybookId)
      )
    )
      return false;
    const w = lang === 'ko' ? (e.korean ?? '') : (e.word ?? '');
    if (!w) return false;
    return levelOfWord(w, lang) === level;
  });
}

/**
 * 전체 어휘 풀에서 랜덤 N개 단어로 진행하는 블록 게임.
 * 사이드바 어휘 axis 아래 sub-button 진입점. AppShell 밖 (풀스크린).
 *
 * 흐름: 레벨 선택 → 그 레벨 단어에서 랜덤 N개 추출 → 플레이어 렌더
 * 이미지 없는 단어도 진행 (플레이어가 conditional render).
 */
export function RandomBlockGamePage({ lang }: Props) {
  const navigate = useNavigate();
  const [level, setLevel] = useState<Level | null>(null);
  const [seed, setSeed] = useState(0);
  const { data: entries, isLoading, isError } = useVocabularyList();
  const { data: books, isLoading: booksLoading } = useStorybooks();

  // 세계명작 책 id 집합 — 게임 단어 풀을 이 카테고리로 한정 (자연관찰 등 제외).
  const classicIds = useMemo(() => {
    const s = new Set<string>();
    (books ?? []).forEach((b) => {
      if (b.category === '세계 명작') s.add(b.id);
    });
    return s;
  }, [books]);

  const gameData = useMemo(() => {
    if (!entries || !level) return null;
    const filtered = filterByLevel(entries, lang, level, classicIds);
    if (filtered.length === 0) return null;
    const unit = vocabEntriesToVirtualUnit(filtered, lang);
    return lang === 'ko' ? unitToKoreanBlockData(unit) : unitToEnglishBlockData(unit);
  }, [entries, lang, level, seed, classicIds]);

  const handleBack = () => {
    if (level) {
      setLevel(null);
    } else {
      navigate('/library');
    }
  };

  if (isLoading || booksLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 gap-6 px-6 text-center">
        <Mascot character="hori" state="thinking" size="xl" />
        <h2 className="text-3xl md:text-4xl font-black text-ink-900 font-display animate-pulse">
          단어 모으는 중...
        </h2>
        <p className="text-lg font-bold text-ink-500">잠깐만 기다려 줘! 🐯</p>
        <div className="flex gap-2 mt-2">
          <span
            className="w-3 h-3 rounded-full bg-coral-400 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-coral-400 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-3 h-3 rounded-full bg-coral-400 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
        <Mascot character="hori" state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">
          단어를 가져오지 못했어요
        </h2>
        <p className="mt-2 text-base text-ink-500">잠시 후 다시 시도해 주세요</p>
        <button
          onClick={() => navigate('/library')}
          className="mt-6 px-6 py-3 bg-coral-500 text-white rounded-full font-black shadow-pop"
        >
          🏠 라이브러리로
        </button>
      </div>
    );
  }

  // 레벨 선택 화면
  if (!level) {
    const counts = entries
      ? {
          L1: filterByLevel(entries, lang, 'L1', classicIds).length,
          L2: filterByLevel(entries, lang, 'L2', classicIds).length,
          L3: filterByLevel(entries, lang, 'L3', classicIds).length,
        }
      : { L1: 0, L2: 0, L3: 0 };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 gap-8 relative">
        <button
          onClick={() => navigate('/library')}
          className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white shadow-soft text-ink-700 hover:shadow-pop transition flex items-center justify-center text-2xl"
          title="뒤로 가기"
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <Mascot character="hori" state="cheering" size="xl" />
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-ink-900 font-display">
            {lang === 'ko' ? '🇰🇷 한글 블록 게임' : '🔤 알파벳 블록 게임'}
          </h1>
          <p className="mt-3 text-lg font-bold text-ink-500">난이도를 골라봐!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
          {(['L1', 'L2', 'L3'] as Level[]).map((lv) => {
            const m = LEVEL_META[lv];
            const n = counts[lv];
            const disabled = n === 0;
            return (
              <button
                key={lv}
                onClick={() => !disabled && setLevel(lv)}
                disabled={disabled}
                className={`bg-gradient-to-br ${m.color} text-white rounded-3xl shadow-pop hover:shadow-card transition p-6 flex flex-col items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                <span className="text-6xl">{m.emoji}</span>
                <span className="text-2xl font-black font-display">{m.label}</span>
                <span className="text-sm font-bold opacity-90">{m.sub}</span>
                <span className="text-xs font-bold bg-white/30 rounded-full px-3 py-1 mt-1">
                  단어 {n}개
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 text-center gap-4">
        <Mascot character="hori" state="thinking" size="lg" />
        <h2 className="text-2xl font-black text-ink-900 font-display">이 레벨 단어가 부족해요</h2>
        <p className="text-base text-ink-500">다른 레벨을 골라봐!</p>
        <button
          onClick={() => setLevel(null)}
          className="mt-4 px-6 py-3 bg-coral-500 text-white rounded-full font-black shadow-pop"
        >
          ← 레벨 다시 고르기
        </button>
      </div>
    );
  }

  const handleComplete = () => {
    // 다시 하기: 같은 레벨에서 랜덤 재추출
    setSeed((s) => s + 1);
  };

  const levelToDifficulty: Record<Level, 'easy' | 'medium' | 'hard'> = {
    L1: 'easy',
    L2: 'medium',
    L3: 'hard',
  };
  const difficulty = levelToDifficulty[level];

  if (lang === 'ko') {
    return (
      <KoreanBlockPlayer
        storybookId="__random_pool__"
        gameData={gameData}
        difficulty={difficulty}
        onComplete={handleComplete}
        onBack={handleBack}
      />
    );
  }
  return (
    <EnglishBlockPlayer
      storybookId="__random_pool__"
      gameData={gameData}
      difficulty={difficulty}
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}

export default RandomBlockGamePage;
