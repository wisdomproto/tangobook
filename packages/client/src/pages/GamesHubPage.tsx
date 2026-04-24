import { Link } from 'react-router-dom';

interface GameCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  path: string;
  gradient: string;
}

const GAMES: GameCard[] = [
  {
    id: 'run',
    emoji: '🏃',
    title: '호리 달리기',
    subtitle: '장애물 점프 러너',
    path: '/games/hori-run',
    gradient: 'from-sky-200 to-emerald-300',
  },
  {
    id: 'catch',
    emoji: '🧺',
    title: '호리 바구니',
    subtitle: '하늘에서 떨어지는 것 받기',
    path: '/games/hori-catch',
    gradient: 'from-amber-200 to-orange-300',
  },
  {
    id: 'whack',
    emoji: '🎯',
    title: '두더지 잡기',
    subtitle: '빠르게 탭!',
    path: '/games/hori-whack',
    gradient: 'from-green-200 to-green-400',
  },
  {
    id: 'memory',
    emoji: '🃏',
    title: '짝 맞추기',
    subtitle: '호리 카드 짝 찾기',
    path: '/games/hori-memory',
    gradient: 'from-pink-200 to-rose-300',
  },
  {
    id: 'simon',
    emoji: '🎵',
    title: '따라해봐',
    subtitle: '순서대로 눌러봐',
    path: '/games/hori-simon',
    gradient: 'from-indigo-300 to-purple-400',
  },
  {
    id: 'jump',
    emoji: '🦘',
    title: '호리 점프',
    subtitle: '높이높이 올라가기',
    path: '/games/hori-jump',
    gradient: 'from-cyan-200 to-sky-400',
  },
];

export default function GamesHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-peach-100 dark:from-darkbg-900 dark:to-darkbg-800 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/library"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-sm text-ink-700"
            aria-label="돌아가기"
          >
            ←
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900 dark:text-peach-100">
              🎮 호리 놀이터
            </h1>
            <p className="text-sm text-ink-500 dark:text-peach-200 mt-1">좋아하는 게임을 골라봐!</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              to={g.path}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${g.gradient} aspect-[4/5] shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 active:scale-95`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="text-6xl md:text-7xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {g.emoji}
                </div>
                <div className="text-lg md:text-xl font-bold text-ink-900 text-center">
                  {g.title}
                </div>
                <div className="text-xs md:text-sm text-ink-700/80 text-center mt-1">
                  {g.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
