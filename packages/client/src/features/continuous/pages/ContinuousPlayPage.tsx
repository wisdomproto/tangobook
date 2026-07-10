import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ViewerContainer } from '@/features/viewer/components/ViewerContainer';
import { usePlaylistStore } from '../store/playlist.store';
import { ContinuousControls } from '../components/ContinuousControls';
import { PlaylistEndScreen } from '../components/PlaylistEndScreen';

/**
 * 연속재생 런타임 — 큐를 책 단위로 `ViewerContainer` 에 흘려보낸다.
 * 재생 상태/컨트롤/슬립타이머는 playlist.store 가 단일 소유.
 */
export default function ContinuousPlayPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const queue = usePlaylistStore((s) => s.queue);
  const index = usePlaylistStore((s) => s.index);
  const language = usePlaylistStore((s) => s.language);
  const speed = usePlaylistStore((s) => s.speed);
  const ended = usePlaylistStore((s) => s.ended);
  const paused = usePlaylistStore((s) => s.paused);
  const next = usePlaylistStore((s) => s.next);
  const markStarted = usePlaylistStore((s) => s.markStarted);
  const restart = usePlaylistStore((s) => s.restart);
  const reset = usePlaylistStore((s) => s.reset);
  const clearSleep = usePlaylistStore((s) => s.clearSleep);

  // ViewerContainer 는 URL `?lang=`·`?autoplay=` 를 읽는다 — store 언어 + 자동재생 강제 주입.
  // 🔴 autoplay=1 필수: 사용자의 뷰어 autoPlayTts 설정이 OFF(영속)면 연속재생도 나레이션 없이
  //   BGM 만 나온다(자막은 정적 전문). 잠자리 연속재생은 나레이션이 핵심이라 항상 켠다.
  const spLang = sp.get('lang');
  const spAutoplay = sp.get('autoplay');
  useEffect(() => {
    if (queue.length === 0) return;
    if (spLang !== language || spAutoplay !== '1') {
      setSp({ lang: language, autoplay: '1' }, { replace: true });
    }
  }, [spLang, spAutoplay, language, queue.length, setSp]);

  // 페이지 이탈 시 슬립타이머 확실히 해제 (setTimeout 누수 방지).
  useEffect(() => () => clearSleep(), [clearSleep]);

  // playlist prop 을 반드시 memoize — 인라인 객체는 매 렌더마다 새 참조라
  // ViewerContainer 의 stall-guard / speed effect 를 계속 리셋한다.
  const current = queue[index];
  const playlist = useMemo(
    () => ({
      hasNext: index < queue.length - 1,
      onBookEnd: next,
      speed,
      // 🔴 첫 책(index 0)만 "탭해서 시작하기" 게이트 — 브라우저가 첫 책 나레이션 autoplay 를 막으면
      //   (진입 클릭 제스처가 버퍼링 동안 만료) TTS 가 무음이 되고, autoPlayTts ON(autoplay=1) 상태에선
      //   stall-guard 가 무음 책을 순식간에 넘겨 "다 읽었어요"로 직행하는 버그가 있었다.
      //   그 탭이 오디오를 확실히 해금 → 2번째 책부터는 autoStart 로 자동 이어재생.
      autoStart: index > 0,
      paused,
      onStart: markStarted,
    }),
    [index, queue.length, next, speed, paused, markStarted]
  );

  if (queue.length === 0) {
    return <Navigate to="/continuous" replace />;
  }

  if (ended || !current) {
    return (
      <PlaylistEndScreen
        onRestart={restart}
        onExit={() => {
          reset();
          navigate('/continuous');
        }}
      />
    );
  }

  return (
    <>
      <ViewerContainer key={current.bookId} storybookId={current.bookId} playlist={playlist} />
      {/* 상시 우상단 나가기 — 컨트롤이 숨겨져 있어도 언제든 홈으로. */}
      <button
        type="button"
        onClick={() => {
          reset();
          navigate('/library');
        }}
        aria-label="홈으로 나가기"
        className="fixed right-3 top-3 z-[80] flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur transition hover:bg-black/60 active:scale-95"
      >
        🏠
      </button>
      <ContinuousControls />
    </>
  );
}
