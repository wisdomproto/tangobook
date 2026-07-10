import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaylistStore } from '../store/playlist.store';
import { cn } from '@/lib/cn';

const SPEED_OPTIONS = [0.75, 1, 1.25] as const;
const SLEEP_OPTIONS: { label: string; value: number | null }[] = [
  { label: '끄기', value: null },
  { label: '20분', value: 20 },
  { label: '30분', value: 30 },
];

/**
 * 연속재생 하단 컨트롤 바. 4-5세 부모가 조작 — 큰 터치 타깃.
 * 진행 "N권 중 M권" · 속도 · 슬립타이머 · 다음 책 · 나가기.
 * 탭하면 노출 토글(선택) — 재생 화면을 가리지 않게.
 */
export function ContinuousControls() {
  const navigate = useNavigate();
  const queue = usePlaylistStore((s) => s.queue);
  const index = usePlaylistStore((s) => s.index);
  const speed = usePlaylistStore((s) => s.speed);
  const sleepMinutes = usePlaylistStore((s) => s.sleepMinutes);
  const paused = usePlaylistStore((s) => s.paused);
  const setSpeed = usePlaylistStore((s) => s.setSpeed);
  const setSleep = usePlaylistStore((s) => s.setSleep);
  const skip = usePlaylistStore((s) => s.skip);
  const reset = usePlaylistStore((s) => s.reset);
  const togglePause = usePlaylistStore((s) => s.togglePause);

  // 재생 시작 시 컨트롤은 숨긴 채로 — 화면(동화)을 가리지 않게. 하단 "컨트롤 보기" 로 열기.
  const [visible, setVisible] = useState(false);

  const total = queue.length;
  const current = Math.min(index + 1, total);

  const exit = () => {
    reset();
    navigate('/continuous');
  };

  if (!visible) {
    // "컨트롤 보기" 버튼 제거(재생 화면 immersive) → 하단을 탭하면 컨트롤을 연다.
    // 하단 얇은 투명 영역이라 중앙의 첫 책 "탭해서 시작하기" 버튼(뷰어 내부 z-50)과 안 겹침.
    // 나가기는 우상단 🏠(ContinuousPlayPage)가 상시 커버.
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        aria-label="컨트롤 열기"
        className="fixed inset-x-0 bottom-0 z-[70] h-16"
      />
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-3 bg-ink-900/80 px-4 pb-5 pt-4 backdrop-blur-md">
      {/* 진행 표시 + 숨김 토글 */}
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-black text-white break-keep">
          {total > 0 ? `${total}권 중 ${current}권` : '재생 중'}
        </span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/80 break-keep"
        >
          숨기기
        </button>
      </div>

      {/* 일시정지 / 재생 */}
      <button
        type="button"
        onClick={togglePause}
        className={cn(
          'h-14 w-full rounded-xl text-xl font-black transition active:scale-95 break-keep',
          paused
            ? 'bg-coral-500 text-white shadow-soft hover:bg-coral-600'
            : 'bg-white/20 text-white hover:bg-white/30'
        )}
        aria-label={paused ? '재생' : '일시정지'}
      >
        {paused ? '▶ 재생' : '⏸ 일시정지'}
      </button>

      {/* 속도 */}
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-bold text-white/60 break-keep">속도</span>
        <div className="flex flex-1 gap-2">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                'h-12 flex-1 rounded-xl text-base font-black transition active:scale-95 break-keep',
                speed === s
                  ? 'bg-coral-500 text-white shadow-soft'
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* 슬립타이머 */}
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-xs font-bold text-white/60 break-keep">잠자기</span>
        <div className="flex flex-1 gap-2">
          {SLEEP_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSleep(opt.value)}
              className={cn(
                'h-12 flex-1 rounded-xl text-base font-black transition active:scale-95 break-keep',
                sleepMinutes === opt.value
                  ? 'bg-mint-500 text-white shadow-soft'
                  : 'bg-white/15 text-white/80 hover:bg-white/25'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 다음 책 / 나가기 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={skip}
          className="h-14 flex-1 rounded-xl bg-white/15 text-lg font-black text-white transition hover:bg-white/25 active:scale-95 break-keep"
        >
          ⏭ 다음 책
        </button>
        <button
          type="button"
          onClick={exit}
          className="h-14 flex-1 rounded-xl bg-coral-500 text-lg font-black text-white shadow-soft transition hover:bg-coral-600 active:scale-95 break-keep"
        >
          {/* 🏠 는 홈(/library)으로 오해됨 — 실제 목적지는 연속재생 홈이라 🚪 로 */}
          🚪 나가기
        </button>
      </div>
    </div>
  );
}
