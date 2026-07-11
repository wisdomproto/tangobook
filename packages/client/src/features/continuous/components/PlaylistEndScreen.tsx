import { useTranslation } from 'react-i18next';

interface PlaylistEndScreenProps {
  onRestart: () => void;
  onExit: () => void;
}

/**
 * 큐가 끝났을 때(또는 슬립타이머 만료) 표시하는 잠자리 톤 종료 화면.
 * dim 배경 위에 "다 읽었어요" + 다시 보기 / 나가기.
 */
export function PlaylistEndScreen({ onRestart, onExit }: PlaylistEndScreenProps) {
  const { t } = useTranslation('viewer');
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink-900/90 backdrop-blur-sm px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-6xl" aria-hidden>
          🌙
        </span>
        <h1 className="font-display text-3xl font-black text-white break-keep">
          {t('continuous.end.title')}
        </h1>
        <p className="text-base text-white/70 break-keep">{t('continuous.end.subtitle')}</p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <button
          type="button"
          onClick={onRestart}
          className="w-full h-16 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white text-xl font-black shadow-soft transition active:scale-95 break-keep"
        >
          {t('continuous.end.restart')}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="w-full h-16 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xl font-black transition active:scale-95 break-keep"
        >
          {t('continuous.end.exit')}
        </button>
      </div>
    </div>
  );
}
