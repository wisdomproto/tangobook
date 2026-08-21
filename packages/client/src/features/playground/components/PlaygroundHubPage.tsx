import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PLAYGROUND_GAMES, type PlaygroundGameMeta } from '@tangobook/shared';
import { Mascot } from '@/design-system';
import { StarCounter } from '@/features/rewards';

const ACCENT_BG: Record<PlaygroundGameMeta['accent'], string> = {
  coral: 'from-coral-100 via-peach-100 to-coral-200',
  mint: 'from-emerald-50 via-teal-50 to-emerald-100',
  blue: 'from-sky-50 via-blue-50 to-sky-100',
  purple: 'from-purple-50 via-violet-50 to-purple-100',
  yellow: 'from-yellow-50 via-amber-50 to-yellow-100',
  success: 'from-emerald-50 to-green-100',
  fun: 'from-pink-50 via-rose-50 to-pink-100',
};

const ACCENT_RING: Record<PlaygroundGameMeta['accent'], string> = {
  coral: 'border-coral-300',
  mint: 'border-emerald-300',
  blue: 'border-sky-300',
  purple: 'border-purple-300',
  yellow: 'border-amber-300',
  success: 'border-success',
  fun: 'border-pink-300',
};

export function PlaygroundHubPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-peach-100 to-coral-100/40 dark:from-darkbg dark:via-slate-900 dark:to-slate-900">
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
            <Mascot state="cheering" size="md" />
            <h1 className="text-3xl md:text-4xl font-black font-display text-ink-900 dark:text-peach-100">
              호리 놀이터
            </h1>
          </div>
          <p className="text-ink-700 dark:text-peach-200 font-bold">
            매일 짧게! 7가지 독후 게임으로 단어를 진짜 내 것으로 만들어요
          </p>
        </div>
      </header>

      {/* Daily Word 카드 */}
      <section className="px-6 mt-6 max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-br from-coral-400 to-coral-500 rounded-3xl shadow-pop p-6 overflow-hidden">
          <div className="absolute top-2 right-3 text-white/30 text-7xl select-none">⭐</div>
          <div className="relative flex items-center gap-4">
            <div className="text-5xl">📖</div>
            <div className="flex-1">
              <div className="text-white/80 text-sm font-bold mb-0.5">오늘의 단어</div>
              <div className="text-white text-xl md:text-2xl font-black font-display">
                30초 미니 활동
              </div>
              <div className="text-white/90 text-sm mt-1">매일 출석 +2 ⭐</div>
            </div>
            <button
              disabled
              title="곧 만나요"
              className="px-5 py-2 rounded-full bg-white/20 text-white font-black backdrop-blur-sm cursor-not-allowed"
            >
              곧 만나요
            </button>
          </div>
        </div>
      </section>

      {/* 7 게임 그리드 */}
      <main className="px-6 pb-12 mt-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {PLAYGROUND_GAMES.map((g) => (
            <GameCard key={g.id} game={g} onClick={() => navigate(`/playground/${g.id}`)} />
          ))}
        </div>

        {/* SR 안내 */}
        <div className="mt-8 bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-start gap-3">
            <div className="text-3xl">🧠</div>
            <div>
              <h3 className="text-lg font-black font-display text-ink-900 mb-1">
                Spaced Repetition — 잊을 때쯤 자동 복습
              </h3>
              <p className="text-sm text-ink-700">
                동화에서 만난 단어 → 1·3·7·14·30일 간격으로 자동 출제. 5~7번 다른 맥락에서 만나 진짜
                마스터!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  function GameCard({ game, onClick }: { game: PlaygroundGameMeta; onClick: () => void }) {
    const isAvailable = game.available;
    return (
      <motion.button
        whileHover={isAvailable ? { y: -4 } : undefined}
        whileTap={isAvailable ? { scale: 0.97 } : undefined}
        onClick={isAvailable ? onClick : undefined}
        disabled={!isAvailable}
        className={`relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br ${ACCENT_BG[game.accent]} dark:from-slate-800 dark:to-slate-700
          shadow-soft border-2 ${isAvailable ? ACCENT_RING[game.accent] : 'border-transparent'}
          ${isAvailable ? 'hover:shadow-pop' : 'opacity-60 cursor-not-allowed'}`}
      >
        <div className="absolute top-3 right-3">
          {isAvailable ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-success text-white font-black shadow-pop">
              놀러가기
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-ink-500 font-black">
              곧 만나요
            </span>
          )}
        </div>
        <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
          <div className="text-6xl drop-shadow-sm">{game.emoji}</div>
          <div className="text-base md:text-lg font-black text-ink-900 dark:text-peach-100 font-display text-center drop-shadow-sm">
            {game.nameKo}
          </div>
          <div className="text-xs md:text-sm text-ink-700 dark:text-peach-200 font-bold text-center line-clamp-2">
            {game.description}
          </div>
        </div>
      </motion.button>
    );
  }
}
