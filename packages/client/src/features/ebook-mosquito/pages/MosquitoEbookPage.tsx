import { useRef, useState, useMemo, useEffect, useCallback, type CSSProperties } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MosquitoEbookComposition,
  MOSQUITO_PAGES,
  EBOOK_FPS,
  EBOOK_WIDTH,
  EBOOK_HEIGHT,
  EBOOK_LANGS,
  EBOOK_LANG_LABEL,
  pageDurationFrames,
  type EbookLang,
} from '@tangobook/remotion';

/**
 * 모기 그림책 인터랙티브 웹 이북 (/ebook/mosquito).
 * 단일 Remotion 타임라인을 Player 로 임베드하고, 페이지 경계 프레임으로 seek 하며 넘긴다.
 * 페이지 진입 시 자동 재생, 끝에서 머무름(pause). 한/일 토글.
 */
export default function MosquitoEbookPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debug = searchParams.get('debug') === '1';
  const [lang, setLang] = useState<EbookLang>('ko');
  const [pageIdx, setPageIdx] = useState(0);
  const pageRef = useRef(0);
  const playerRef = useRef<PlayerRef>(null);
  const totalPages = MOSQUITO_PAGES.length;

  // 페이지 경계 누적 프레임 (언어별 TTS 길이로 달라짐)
  const { bounds, total } = useMemo(() => {
    const b: number[] = [];
    let acc = 0;
    for (const p of MOSQUITO_PAGES) {
      b.push(acc);
      acc += pageDurationFrames(p.ttsDurationSec[lang]);
    }
    return { bounds: b, total: Math.max(1, acc) };
  }, [lang]);

  const goToPage = useCallback(
    (idx: number, autoplay = true) => {
      const c = Math.max(0, Math.min(totalPages - 1, idx));
      pageRef.current = c;
      setPageIdx(c);
      const player = playerRef.current;
      if (!player) return;
      player.seekTo(bounds[c]);
      if (autoplay) player.play();
    },
    [bounds, totalPages]
  );

  // 현재 페이지 끝에 닿으면 멈춤(머무름)
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      const i = pageRef.current;
      const end = i < bounds.length - 1 ? bounds[i + 1] : total;
      if (e.detail.frame >= end - 1) player.pause();
    };
    player.addEventListener('frameupdate', onFrame);
    return () => player.removeEventListener('frameupdate', onFrame);
  }, [bounds, total]);

  // 언어 바뀌면(=bounds 재계산) 현재 페이지 시작으로 맞추고 멈춤
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(bounds[pageRef.current] ?? 0);
    player.pause();
  }, [bounds]);

  const atFirst = pageIdx === 0;
  const atLast = pageIdx === totalPages - 1;

  return (
    <div style={S.root}>
      <header style={S.header}>
        <button onClick={() => navigate('/library')} style={S.ghost}>
          ✕ 닫기
        </button>
        <div style={S.title}>모기의 항변</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {EBOOK_LANGS.map((l) => (
            <button key={l} onClick={() => setLang(l)} style={l === lang ? S.langOn : S.lang}>
              {EBOOK_LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </header>

      <div style={S.stage}>
        <Player
          ref={playerRef}
          component={MosquitoEbookComposition}
          inputProps={{ lang, debugCoords: debug }}
          durationInFrames={total}
          fps={EBOOK_FPS}
          compositionWidth={EBOOK_WIDTH}
          compositionHeight={EBOOK_HEIGHT}
          style={S.player}
          clickToPlay={false}
          doubleClickToFullscreen
        />
      </div>

      <footer style={S.footer}>
        <button
          onClick={() => goToPage(pageIdx - 1)}
          disabled={atFirst}
          style={atFirst ? S.navOff : S.nav}
        >
          ◀ 이전
        </button>
        <button onClick={() => goToPage(pageIdx)} style={S.replay}>
          ↻ 다시 듣기
        </button>
        <div style={S.counter}>
          {pageIdx + 1} / {totalPages}
        </div>
        <button
          onClick={() => goToPage(pageIdx + 1)}
          disabled={atLast}
          style={atLast ? S.navOff : S.nav}
        >
          다음 ▶
        </button>
      </footer>
    </div>
  );
}

const base: CSSProperties = {
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  padding: '10px 20px',
};
const S: Record<string, CSSProperties> = {
  root: {
    position: 'fixed',
    inset: 0,
    background: '#171a16',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Pretendard Variable", system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    gap: 12,
  },
  title: { fontWeight: 800, fontSize: 16, opacity: 0.92 },
  stage: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 16px',
    minHeight: 0,
  },
  player: {
    width: '100%',
    maxWidth: 1080,
    aspectRatio: `${EBOOK_WIDTH} / ${EBOOK_HEIGHT}`,
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 12px 48px rgba(0,0,0,.45)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: '16px 18px 22px',
  },
  counter: { minWidth: 64, textAlign: 'center', fontSize: 14, opacity: 0.75 },
  nav: { ...base, background: '#e6603f', color: '#fff' },
  navOff: { ...base, background: '#3a3d36', color: '#7a7d76', cursor: 'default' },
  replay: { ...base, background: '#2f332b', color: '#fff' },
  ghost: { ...base, background: 'transparent', color: '#cfd2c9', padding: '8px 12px' },
  lang: { ...base, background: '#2f332b', color: '#cfd2c9', padding: '8px 14px', fontSize: 13 },
  langOn: { ...base, background: '#e6603f', color: '#fff', padding: '8px 14px', fontSize: 13 },
};
