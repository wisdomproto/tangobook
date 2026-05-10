import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Skeleton, Mascot } from '@/design-system';
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
  const { data: entries, isLoading } = useVocabularyList();

  const gameData = useMemo(() => {
    if (!entries) return null;
    const unit = vocabEntriesToVirtualUnit(entries, lang);
    return lang === 'ko' ? unitToKoreanBlockData(unit) : unitToEnglishBlockData(unit);
  }, [entries, lang]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Skeleton className="w-80 h-96 rounded-3xl" />
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50 text-center">
        <Mascot state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">단어가 부족해요</h2>
        <p className="mt-2 text-base text-ink-500">
          {lang === 'ko'
            ? '한글 단어가 충분히 모이면 다시 도전해 봐요'
            : '6글자 이하 영문 단어가 더 필요해요'}
        </p>
        <button
          onClick={() => navigate('/library')}
          className="mt-6 px-6 py-3 bg-coral-500 text-white rounded-full font-black"
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
