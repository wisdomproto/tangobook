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
  const next = usePlaylistStore((s) => s.next);
  const restart = usePlaylistStore((s) => s.restart);
  const reset = usePlaylistStore((s) => s.reset);
  const clearSleep = usePlaylistStore((s) => s.clearSleep);

  // ViewerContainer 는 URL `?lang=` 를 읽는다 — store 언어를 1회 주입.
  const spLang = sp.get('lang');
  useEffect(() => {
    if (queue.length === 0) return;
    if (spLang !== language) {
      setSp({ lang: language }, { replace: true });
    }
  }, [spLang, language, queue.length, setSp]);

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
      autoStart: index > 0, // 첫 책만 탭으로 오디오 해금, 나머지는 자동 시작
    }),
    [index, queue.length, next, speed]
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
