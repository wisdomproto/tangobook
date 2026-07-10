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
      // 연속재생은 첫 책부터 자동재생 — 진입이 "지금 재생" 클릭(beginPlaylist)이라 그 제스처에서
      // 오디오가 해금돼 첫 책도 바로 재생된다. autoplay 를 막는 브라우저는 ViewerContainer 의
      // 폴백 게이트("탭해서 시작하기")가 자동으로 뜬다.
      autoStart: true,
      paused,
    }),
    [index, queue.length, next, speed, paused]
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
      <ContinuousControls />
    </>
  );
}
