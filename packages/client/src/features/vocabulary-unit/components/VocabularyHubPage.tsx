import { useNavigate, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Mascot, Skeleton } from '@/design-system';
import { StarCounter } from '@/features/rewards';
import { useVocabularyUnits } from '../hooks/useVocabularyUnits';

/** 학습자 어휘 학습 허브 — 단원 그리드 (공개된 것만) */
export function VocabularyHubPage() {
  const navigate = useNavigate();
  const { data: units, isLoading } = useVocabularyUnits();

  const publicUnits = useMemo(() => units?.filter((u) => u.isPublic) ?? [], [units]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-cream-50">
      {/* 헤더 */}
      <header className="px-6 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
          >
            ← 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <StarCounter />
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft text-ink-700 font-bold hover:shadow-pop transition"
            >
              🏠 홈
            </Link>
          </div>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <Mascot state="reading" size="md" />
            <h1 className="text-3xl md:text-4xl font-black font-display text-ink-900">
              어휘 마스터
            </h1>
          </div>
          <p className="text-ink-700 font-bold">토픽별로 단어를 차근차근 모아 마스터해요!</p>
        </div>
      </header>

      <main className="px-6 pb-12 mt-6 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : publicUnits.length === 0 ? (
          <div className="text-center py-16 text-ink-500">
            <p className="text-lg font-bold">아직 공개된 어휘 단원이 없어요</p>
            <p className="text-sm mt-1">곧 만나요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {publicUnits.map((unit) => (
              <button
                key={unit.id}
                onClick={() => navigate(`/vocabulary/${unit.id}`)}
                className="aspect-[3/4] rounded-2xl bg-white shadow-soft border-2 border-amber-200 overflow-hidden hover:shadow-pop hover:-translate-y-1 transition-all p-4 flex flex-col items-center justify-center gap-2"
              >
                <div className="text-6xl">{unit.emoji ?? '✨'}</div>
                <div className="text-base md:text-lg font-black text-ink-900 font-display text-center line-clamp-2">
                  {unit.nameKo}
                </div>
                {unit.nameEn && <div className="text-xs text-ink-500 font-bold">{unit.nameEn}</div>}
                <div className="mt-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-black">
                  {unit.wordCount}단어
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
