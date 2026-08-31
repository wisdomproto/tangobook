import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { KoreanPageOrderData, PageOrderItem } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useGameEntryGuide } from '../../hooks/useGameEntryGuide';
import { GameResultScreen } from '../GameResultScreen';
import { GameHeader } from '../GameHeader';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { shuffle } from '../../utils/shuffle';
import { cn } from '@/lib/cn';
import { ENTRY_GUIDE, voiceUrl } from '@/features/phonics-learner/hooks/useEntryGuide';

/**
 * 쪽 순서 맞추기 — 삽화를 이야기 순서대로 누른다. 낱말이 아니라 **이야기**를 묻는 독후활동이다.
 *
 * 🔴 **나레이션을 틀지 않는다.** 순서의 근거는 그림이어야 한다 — 게임 안에서 이야기를 다시
 *    들려주면 답을 알려주는 것이고, 쪽당 ~13초라 네 장이면 한 판이 1분을 넘는다.
 * 🔴 판정은 **누를 때 바로**. 다 놓은 뒤 채점하면 네 살은 어디서 틀렸는지 알 수 없다.
 */
export function PageOrderPlayer({ storybookId, gameData, onComplete, onBack }: GamePlayerProps) {
  const { t } = useTranslation('games');
  const data = gameData as KoreanPageOrderData;
  // 정답 순서로 담겨 오므로 화면 배치만 섞는다.
  const items = data.items;
  const tray = useMemo(() => shuffle(items.map((_, i) => i)), [items]);

  const { playAudio, playFeedbackSound } = useGameAudio();
  useGameEntryGuide(voiceUrl(ENTRY_GUIDE.orderListen), playAudio);

  /** 이미 자리를 잡은 항목의 인덱스 — 길이가 곧 다음에 놓아야 할 순서다. */
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  /** 이 자리에서 이미 한 번 틀렸나 — 첫 시도 정답만 점수로 센다. */
  const [missedHere, setMissedHere] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handlePick = useCallback(
    (idx: number) => {
      // 🔴 흔들리는 동안 입력을 막지 않는다 — 오답 뒤 700ms 를 잠그면 바로 이어 누른 정답이
      //    통째로 무시된다(네 살은 빨리 두 번 누른다). 흔들림은 표시일 뿐 상태가 아니다.
      if (finished || placed.includes(idx)) return;
      if (idx !== placed.length) {
        setWrongIdx(idx);
        playFeedbackSound(false);
        setMissedHere(true);
        setTimeout(() => setWrongIdx(null), 700);
        return;
      }
      const next = [...placed, idx];
      const gained = missedHere ? 0 : 1;
      setPlaced(next);
      setMissedHere(false);
      setScore((s) => s + gained);
      playFeedbackSound(true);
      if (next.length === items.length) {
        setFinished(true);
        onComplete(score + gained, items.length);
      }
    },
    [finished, placed, missedHere, items.length, playFeedbackSound, onComplete, score]
  );

  const handleRestart = useCallback(() => {
    setPlaced([]);
    setWrongIdx(null);
    setMissedHere(false);
    setScore(0);
    setFinished(false);
  }, []);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={items.length}
        onRestart={handleRestart}
        onBack={onBack}
        lang="ko"
      />
    );
  }

  const thumb = (it: PageOrderItem) => (
    <img src={it.illustrationUrl} alt="" className="w-full h-full object-cover" />
  );

  return (
    <GamePlayerLayout maxWidth="4xl">
      <GameHeader
        title={t('cards.pageOrder.label')}
        current={placed.length}
        total={items.length}
        onBack={onBack}
      />

      <div className="flex flex-col items-center gap-[clamp(0.5rem,2vh,1.5rem)] w-full flex-1 min-h-0">
        <p className="text-lg sm:text-xl font-black text-ink-900 break-keep text-center">
          {t('pageOrder.prompt')}
        </p>

        {/* 위 — 순서 슬롯. 번호가 곧 이야기 차례다. */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-3xl">
          {items.map((_, slot) => {
            const filledIdx = placed[slot];
            return (
              <div
                key={slot}
                className={cn(
                  'relative aspect-video rounded-2xl overflow-hidden border-4 bg-white/70',
                  filledIdx === undefined
                    ? 'border-dashed border-peach-300'
                    : 'border-success shadow-card'
                )}
              >
                {filledIdx === undefined ? (
                  <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-3xl font-black text-peach-400">
                    {slot + 1}
                  </span>
                ) : (
                  <>
                    {thumb(items[filledIdx])}
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-success text-white text-[0.65rem] sm:text-sm font-black flex items-center justify-center shadow-soft">
                      {slot + 1}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 아래 — 아직 안 놓은 그림. 놓인 것은 자리를 비우지 않고 흐리게 남겨 위치를 기억하게 둔다. */}
        {/* 🔴 `auto-rows-min content-center` — 없으면 grid 행이 flex-1 높이만큼 늘어나 375px 에서
            두 줄 사이가 308px 벌어진다(카드는 75px 인데). 넷을 한눈에 비교하는 게 이 게임이라
            2열을 유지하고, 남는 세로는 위아래로 나눈다. */}
        <div className="grid grid-cols-2 auto-rows-min content-center gap-3 sm:gap-4 w-full max-w-3xl flex-1 min-h-0 overflow-y-auto">
          {tray.map((idx) => {
            const done = placed.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handlePick(idx)}
                disabled={done}
                aria-label={t('pageOrder.pickAria')}
                className={cn(
                  'relative aspect-video rounded-2xl overflow-hidden border-4 transition-all bg-white shadow-card min-h-[44px]',
                  done && 'opacity-25 border-peach-200 cursor-default',
                  !done && wrongIdx === idx && 'border-danger ring-4 ring-danger animate-shake',
                  !done &&
                    wrongIdx !== idx &&
                    'border-peach-200 hover:scale-[1.02] hover:border-coral-300 hover:shadow-pop'
                )}
              >
                {thumb(items[idx])}
              </button>
            );
          })}
        </div>
      </div>
    </GamePlayerLayout>
  );
}
