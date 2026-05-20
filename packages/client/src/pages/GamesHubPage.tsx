import { Link, useNavigate } from 'react-router-dom';
import { AppIcon } from '@/design-system';

/**
 * 학습 게임 허브 — /games 라우트.
 * AppShell 사이드바의 "학습 게임" axis 클릭 시 진입.
 * 한글 블록 / 알파벳 블록 두 게임 선택.
 *
 * 기존 hori arcade (run/catch/whack 등) 는 폐기됨 (Phase 0). 이 파일이 그 자리를 대체.
 */

interface GameCard {
  id: string;
  iconSrc: string;
  title: string;
  subtitle: string;
  path: string;
  gradient: string;
  badge: string;
}

const GAMES: GameCard[] = [
  {
    id: 'korean-block',
    iconSrc: 'game/korean-block.webp',
    title: '한글 블록 게임',
    subtitle: '자음과 모음을 조합해 한글 단어 완성',
    path: '/games/korean-block',
    gradient: 'from-coral-400 to-coral-500',
    badge: '한글',
  },
  {
    id: 'alphabet-block',
    iconSrc: 'game/korean-block.webp', // TODO: alphabet-block.webp 자산 필요
    title: '알파벳 블록 게임',
    subtitle: '알파벳을 조합해 영어 단어 완성',
    path: '/games/alphabet-block',
    gradient: 'from-indigo-400 to-blue-500',
    badge: 'ABC',
  },
];

export default function GamesHubPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <button
            onClick={() => navigate('/library')}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white shadow-soft hover:shadow-pop text-ink-700 flex items-center justify-center text-xl font-black transition"
            aria-label="라이브러리로"
          >
            ←
          </button>
          <h1 className="text-2xl md:text-4xl font-black font-display text-ink-900">학습 게임</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              to={g.path}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${g.gradient} aspect-[4/3] md:aspect-[3/2] shadow-pop hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:scale-95 transition-all duration-150 p-6 md:p-8 flex flex-col justify-between text-white`}
            >
              <div className="self-start px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm text-xs md:text-sm font-black tracking-wide">
                {g.badge}
              </div>

              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-20 h-20 md:w-28 md:h-28 shrink-0 rounded-2xl bg-white/85 flex items-center justify-center ring-2 ring-white shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
                  <AppIcon
                    src={g.iconSrc}
                    size={56}
                    alt={g.title}
                    className="md:[width:80px] md:[height:80px] drop-shadow-md"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-3xl font-black font-display leading-tight">
                    {g.title}
                  </h2>
                  <p className="text-xs md:text-sm font-bold mt-1 md:mt-2 text-white/90 leading-snug">
                    {g.subtitle}
                  </p>
                </div>
                <span className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-white/25 text-2xl md:text-3xl font-black flex items-center justify-center group-hover:translate-x-1 transition">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
