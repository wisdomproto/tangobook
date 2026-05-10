import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Mascot } from '@/design-system';
import { useVocabularyList } from '@/features/vocabulary/hooks/useVocabulary';
import {
  unitToKoreanBlockData,
  unitToEnglishBlockData,
} from '@/features/vocabulary-unit/lib/game-data-adapter';
import { vocabEntriesToVirtualUnit } from '@/features/vocabulary-unit/lib/random-vocab-pool';
import { KoreanBlockPlayer } from '@/features/games/components/players/KoreanBlockPlayer';
import { EnglishBlockPlayer } from '@/features/games/components/players/EnglishBlockPlayer';

interface Props {
  lang: 'ko' | 'en';
}

/**
 * 전체 어휘 풀에서 랜덤 N개 단어로 진행하는 블록 게임.
 * 사이드바 어휘 axis 아래 sub-button 진입점. AppShell 밖 (풀스크린).
 *
 * 데이터: `/api/vocabulary-db` (모든 동화책 + 어휘 단원 통합 풀, ~1400+ 단어)
 *  → vocabEntriesToVirtualUnit 으로 가상 VocabularyUnit 빌드
 *  → unitToKoreanBlockData / unitToEnglishBlockData 헬퍼 (랜덤 N개 sample) 통과
 *  → KoreanBlockPlayer / EnglishBlockPlayer 풀스크린 렌더
 */
export function RandomBlockGamePage({ lang }: Props) {
  const navigate = useNavigate();
  const { data: entries, isLoading, isError } = useVocabularyList();

  const gameData = useMemo(() => {
    if (!entries) return null;
    const unit = vocabEntriesToVirtualUnit(entries, lang);
    return lang === 'ko' ? unitToKoreanBlockData(unit) : unitToEnglishBlockData(unit);
  }, [entries, lang]);

  if (isLoading) {
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

  if (!gameData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
        <Mascot character="hori" state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 부족해요</h2>
        <p className="mt-2 text-base text-ink-500">
          {lang === 'ko'
            ? '한글 단어가 충분히 모이면 다시 도전해 봐요'
            : '6글자 이하 영문 단어가 더 필요해요'}
        </p>
        <button
          onClick={() => navigate('/library')}
          className="mt-6 px-6 py-3 bg-coral-500 text-white rounded-full font-black shadow-pop"
        >
          🏠 라이브러리로
        </button>
      </div>
    );
  }

  const handleBack = () => navigate('/library');

  if (lang === 'ko') {
    return (
      <KoreanBlockPlayer
        storybookId="__random_pool__"
        gameData={gameData}
        difficulty="medium"
        onComplete={handleBack}
        onBack={handleBack}
      />
    );
  }
  return (
    <EnglishBlockPlayer
      storybookId="__random_pool__"
      gameData={gameData}
      difficulty="medium"
      onComplete={handleBack}
      onBack={handleBack}
    />
  );
}

export default RandomBlockGamePage;
