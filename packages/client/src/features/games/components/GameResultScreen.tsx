const ACCENT_CLASSES: Record<string, { btn: string }> = {
  violet: { btn: 'bg-violet-600 hover:bg-violet-700' },
  sky: { btn: 'bg-sky-600 hover:bg-sky-700' },
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

interface GameResultScreenProps {
  score: number;
  total: number;
  accentColor?: 'violet' | 'sky' | 'emerald';
  onRestart: () => void;
  onBack: () => void;
}

export function GameResultScreen({
  score,
  total,
  accentColor = 'violet',
  onRestart,
  onBack,
}: GameResultScreenProps) {
  const isPerfect = score === total;
  const { btn } = ACCENT_CLASSES[accentColor];

  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-3">{isPerfect ? '🎉' : '👏'}</div>
      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">
        {score} / {total}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {isPerfect ? '완벽해요!' : '잘했어요!'}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRestart}
          className={`px-6 py-3 ${btn} text-white rounded-xl text-sm font-bold transition-colors`}
        >
          다시 하기
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          ← 돌아가기
        </button>
      </div>
    </div>
  );
}
