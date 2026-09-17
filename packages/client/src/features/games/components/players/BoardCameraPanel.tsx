import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { BoardCameraState } from '../../hooks/useBoardCamera';

/**
 * 실물 블록 모드의 카메라 칸 — 화면 판(`TangoBoard`) 자리에 들어간다.
 *
 * 🔴 미리보기 영상은 **안 보여 준다**(2026-09-16 사용자). 아이가 볼 것은 낱말 카드와
 *    읽은 낱말뿐이다. 영상은 프레임을 내주려고 있을 뿐이라 1px 로 깔아 둔다 —
 *    `display:none` 이면 모바일 브라우저가 프레임 주기를 멈춘다.
 */
export function BoardCameraPanel({ cam, onSend }: { cam: BoardCameraState; onSend?: () => void }) {
  const [dbgOpen, setDbgOpen] = useState(false);
  const [sending, setSending] = useState<'idle' | 'busy' | 'done' | 'fail'>('idle');

  const send = async () => {
    setSending('busy');
    const ok = await cam.sendFrame();
    setSending(ok ? 'done' : 'fail');
    onSend?.();
    setTimeout(() => setSending('idle'), 2500);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 text-center">
      {/* 🔴 레이아웃에는 있고 눈에는 안 보이게 — 완전히 숨기면 프레임이 안 온다. */}
      <video
        ref={cam.videoRef}
        playsInline
        muted
        autoPlay
        className="fixed left-0 bottom-0 w-px h-px opacity-[0.01] pointer-events-none -z-10"
      />

      {cam.error && <p className="text-lg font-black text-danger break-keep px-4">{cam.error}</p>}

      {!cam.error && cam.cvProgress !== null && (
        <div className="w-full max-w-sm px-6">
          <p className="text-base font-black text-ink-700 break-keep">
            블록을 읽을 준비를 하고 있어요
          </p>
          <div className="mt-3 h-5 rounded-full bg-peach-200 overflow-hidden">
            <div
              className="h-full bg-coral-500 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.round(cam.cvProgress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-lg font-black text-ink-500 tabular-nums">
            {Math.round(cam.cvProgress * 100)}%
          </p>
          <p className="mt-1 text-xs text-ink-500">처음 한 번만 받아요</p>
        </div>
      )}

      {!cam.error && cam.cvProgress === null && (
        <p
          className={cn(
            'font-display font-black break-keep leading-tight',
            cam.word ? 'text-4xl text-ink-900' : 'text-xl text-ink-500'
          )}
        >
          {cam.word || (cam.ready ? '블록을 놓아 보세요' : '카메라를 여는 중…')}
        </p>
      )}

      {/* 🔴 판이 화면 밖으로 나가면 그 카드는 **정보가 없어서** 못 읽는다 — 알고리즘이 어쩔 수
          없는 자리라 화면이 말해 준다. 태블릿을 어느 방향으로 두든 이 한 줄이 맞춰 준다. */}
      {cam.clipped > 0 && cam.cvProgress === null && !cam.error && (
        <p className="text-sm font-bold text-ink-500 break-keep px-4">
          블록 {cam.clipped}개가 화면 끝에 걸렸어요 — 판을 조금 안쪽으로 옮겨 주세요
        </p>
      )}

      {/* 📤 + 디버그 — 테스트용. 기본은 접힘(2026-09-16 사용자). */}
      <div className="absolute right-2 bottom-1 flex items-center gap-2">
        <button
          onClick={() => setDbgOpen((v) => !v)}
          className="min-h-[36px] px-3 rounded-full bg-white/80 text-ink-500 text-xs font-black shadow-soft"
        >
          {dbgOpen ? '▾ 숨기기' : '▸ 진단'}
        </button>
        <button
          onClick={send}
          disabled={sending === 'busy' || !cam.ready}
          className="min-h-[36px] px-3 rounded-full bg-white/80 text-ink-700 text-xs font-black shadow-soft disabled:opacity-40"
          title="지금 프레임을 서버에 올린다 (2초 뒤에 찍어요 — 손을 치울 시간)"
        >
          {sending === 'busy'
            ? '보내는 중…'
            : sending === 'done'
              ? '보냈어요'
              : sending === 'fail'
                ? '실패'
                : '📤 보내기'}
        </button>
      </div>
      {dbgOpen && (
        <pre className="absolute left-2 bottom-1 max-w-[60%] text-left text-[10px] leading-tight text-ink-500 whitespace-pre-wrap">
          {cam.raw || '∅'} {JSON.stringify(cam.info ?? {})}
        </pre>
      )}
    </div>
  );
}
