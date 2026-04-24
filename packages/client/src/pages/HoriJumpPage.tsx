import { Link } from 'react-router-dom';
import { HoriJumpGame } from '../features/arcade-games/hori-jump';

export default function HoriJumpPage() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <Link
          to="/games"
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/90 hover:bg-white text-ink-700 text-sm font-medium rounded-full shadow-sm"
        >
          ← 나가기
        </Link>
      </div>
      <HoriJumpGame />
    </div>
  );
}
