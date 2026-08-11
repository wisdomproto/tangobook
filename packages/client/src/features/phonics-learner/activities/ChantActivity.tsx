import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityShell } from '../components/ActivityShell';

interface Props {
  unitId: string;
  /** 이 단원의 찬트 mp3 URL 배열(여러 곡일 수 있다 — 운모 a/o/e 3곡 등). */
  urls: string[];
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 🎵 유닛송(찬트) — 마무리 노래 듣기. 채점·정답 없음(그냥 재생기).
 *
 * 🔴 진입 자동재생을 시도하되 브라우저가 막으면(사용자 제스처 필요) 큰 재생 버튼으로 폴백한다.
 * 🔴 자동재생 effect 는 배열 신원이 아니라 **트랙 인덱스(내용)** 에만 건다(파닉스 단골 함정).
 * 🔴 언마운트 시 정지 — 나가는 도중 노래가 빈 화면에서 울리지 않게.
 * 완료 = 한 곡을 끝까지 들으면(ended) 또는 「다 들었어요」 버튼 → `onMarkComplete`. 자동 back 은 안 함.
 */
export function ChantActivity({ unitId, urls, onMarkComplete, onBack }: Props) {
  const { t } = useTranslation('phonics');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const multi = urls.length > 1;

  const markRef = useRef(onMarkComplete);
  markRef.current = onMarkComplete;

  // 진입/트랙 변경 시 재생 시도. 막히면 playing=false 로 남아 큰 재생 버튼이 폴백을 맡는다.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => setPlaying(false));
  }, [idx, unitId]);

  // 언마운트 정지 — 나가며 소리가 이어지지 않게. 🔴 `src=''` 는 하지 않는다: 정지엔 `pause()` 로 충분하고,
  // dev(StrictMode) 이중마운트에서 cleanup 이 src 를 비우면 prop(urls[idx])이 안 바뀌어 재마운트 때 src 가
  // 안 다시 써져 첫 진입이 무음이 된다(game-reviewer, dev 전용). 프로덕션엔 이중마운트가 없어 무해했으나 제거.
  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);

  const goto = useCallback(
    (next: number) => {
      if (next < 0 || next >= urls.length) return;
      setIdx(next);
    },
    [urls.length]
  );

  if (!urls.length) return null;

  return (
    <ActivityShell onBack={onBack}>
      <audio
        ref={audioRef}
        src={urls[idx]}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setHeard(true);
          markRef.current();
        }}
      />

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6">
        <div className="text-7xl sm:text-8xl animate-bounce">🎵</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{t('chant.title')}</h2>

        <div className="flex items-center gap-5 sm:gap-8">
          {multi && (
            <button
              onClick={() => goto(idx - 1)}
              disabled={idx === 0}
              aria-label={t('chant.prev')}
              className="w-16 h-16 rounded-full bg-white shadow-soft text-4xl text-ink-700 disabled:opacity-30 active:scale-[0.95] transition"
            >
              ‹
            </button>
          )}

          <button
            onClick={toggle}
            aria-label={playing ? t('chant.pause') : t('chant.play')}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-coral-500 text-white text-6xl sm:text-7xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition flex items-center justify-center"
          >
            {playing ? '⏸' : '▶'}
          </button>

          {multi && (
            <button
              onClick={() => goto(idx + 1)}
              disabled={idx === urls.length - 1}
              aria-label={t('chant.next')}
              className="w-16 h-16 rounded-full bg-white shadow-soft text-4xl text-ink-700 disabled:opacity-30 active:scale-[0.95] transition"
            >
              ›
            </button>
          )}
        </div>

        {multi && (
          <div className="flex items-center gap-2.5">
            {urls.map((u, i) => (
              <span
                key={u + i}
                className={[
                  'w-3.5 h-3.5 rounded-full transition',
                  i === idx ? 'bg-coral-500 scale-110' : 'bg-white',
                ].join(' ')}
              />
            ))}
          </div>
        )}

        <button
          onClick={onMarkComplete}
          className="mt-2 px-8 py-4 rounded-full bg-white border-2 border-mint-300 text-mint-700 font-black text-xl sm:text-2xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
        >
          {heard ? t('chant.heardDone') : t('chant.heard')}
        </button>
      </div>
    </ActivityShell>
  );
}
