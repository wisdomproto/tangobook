import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { useGameAudio } from '../../hooks/useGameAudio';
import { resolveTtsUrl } from '@/features/tts';
import { playUi, playNote } from '@/lib/uiSound';
import { buildWalls, labelRegions, paintableRegions, borderRegions } from '@tangobook/shared';
import { buildPalette, type PaletteEntry } from '../../lib/answer-colors';

/**
 * 색칠공부 — **안내 색칠**(guided).
 *
 * 🔴 빈 도안과 물감 열두 통을 내주는 자유 색칠이 아니다. 네 살에게 "마음대로 해"는 자유가 아니라
 *    막막함이고, 이 장르 1위(Happy Color, 그림 4만 장)가 색칠할 곳마다 번호를 찍어 주는 앱인 게
 *    그 증거다. 유아 미술 연구도 같은 말을 한다 — 아이는 **어디서 시작할지 모를 때** 막힌다.
 *
 * 그래서 여기서는 **색을 고르면 그 색이 들어갈 칸이 반짝인다.** 다음에 뭘 할지 화면이 늘 알려 준다.
 * (숫자는 쓰지 않는다 — 숫자를 읽어야 시작할 수 있으면 그게 또 하나의 벽이라, 세 살은 못 들어온다.)
 *
 * 🔴 **정답은 있지만 틀리는 일은 없다.** 다른 칸을 눌러도 오답음·감점이 없고, 그 칸의 정답 물감이
 *    통통 튀어 어디를 누를지 알려 줄 뿐이다(색칠 앱들의 공통 처리 — "그림은 항상 올바르게 완성된다").
 *    우리 라인엔 이미 맞고 틀리는 게임이 다섯이라, 여섯 번째 시험을 만들지 않는 게 이 화면의 몫이다.
 *
 * 정답색은 **정답본**(같은 도안을 칠한 그림)에서 앱이 직접 읽는다 → `answer-colors.ts`.
 * 선 안을 지키는 건 아이가 아니라 코드다 → `@tangobook/shared` 의 `flood-fill`(생성 스크립트의 검사기와 **같은 구현**을 써야 검사기가 거짓말을 하지 않는다).
 */

export interface ColoringItem {
  word: string;
  /** 흰 면 + 검은 선 도안. */
  lineartUrl: string;
  /** 같은 도안을 칠한 정답본 — 칸별 정답색을 여기서 읽는다. */
  answerUrl: string;
  /** 다 칠하면 보여줄 원본 단어 삽화. */
  originalUrl?: string | null;
  /** 낱말 음원 직행 URL. 없으면 `resolveTtsUrl` 이 합성 경로로 푼다. */
  ttsUrl?: string | null;
  /** 음원 캐시 키 — 파닉스는 단원 id. */
  storybookId?: string;
}

interface ColoringPlayerProps {
  items: ColoringItem[];
  onBack?: () => void;
}

/** 힌트로 덧칠하는 진하기 — 원래 색을 알아볼 만큼은 보이되 다 칠한 칸과는 구분돼야 한다. */
const HINT_ALPHA = 0.5;
/**
 * 힌트 색의 밝기 상한.
 *
 * 🔴 **밝은 색은 힌트로 쓰면 안 보인다.** 여우 배(크림 `247,239,221`)를 0.4 로 흰 종이에 얹으면
 *    251.8 — 흰색과 구분이 안 된다. 그 색 칸을 골라도 화면이 그대로라 아이는 어디를 눌러야 할지
 *    모른다. 그래서 색칠 앱들이 힌트에 색 대신 체크무늬를 쓴다. 여기서는 색을 살리되(무슨 색이
 *    들어갈지 알려 주는 게 학습이다) **밝은 색만 눌러** 대비를 만든다. 진한 색은 그대로 지나간다.
 */
const HINT_MAX_LUMA = 170;

function hintRgb(r: number, g: number, b: number): [number, number, number] {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const k = luma > HINT_MAX_LUMA ? HINT_MAX_LUMA / luma : 1;
  return [r * k, g * k, b * k];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

function readPixels(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d 없음');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

export function ColoringPlayer({ items, onBack }: ColoringPlayerProps) {
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [palette, setPalette] = useState<PaletteEntry[]>([]);
  const [selected, setSelected] = useState(0);
  /** 엉뚱한 칸을 눌렀을 때 통통 튈 물감 — 오답이 아니라 안내다. */
  const [bounce, setBounce] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);
  /** 다시 그리기를 강제하는 카운터 — 칠한 칸은 ref 에 있어 state 로 안 들고 있다. */
  const [tick, setTick] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLCanvasElement>(null);
  const lineImgRef = useRef<HTMLImageElement | null>(null);
  const labelsRef = useRef<Int32Array | null>(null);
  const requiredRef = useRef<number[]>([]);
  const colorOfRegionRef = useRef<Map<number, string>>(new Map());
  const paintedRef = useRef<Set<number>>(new Set());
  const paintRef = useRef<ImageData | null>(null);
  const doneRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const bounceTimerRef = useRef<number | null>(null);

  const { playCorrectSequence, praiseVisible } = useGameAudio();
  const item = items[idx];

  useEffect(
    () => () => {
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      if (bounceTimerRef.current != null) window.clearTimeout(bounceTimerRef.current);
    },
    []
  );

  /** paint 레이어를 깔고 도안을 multiply 로 얹는다 — 흰 면은 색을 통과시키고 검은 선만 남는다. */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const paint = paintRef.current;
    const img = lineImgRef.current;
    if (!canvas || !paint || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.putImageData(paint, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // ── 도안 + 정답본 읽기 ─────────────────────────────────────────────────────
  /**
   * 🔴 **deps 는 URL(문자열)이지 `item`(객체)이 아니다.**
   *    호출부가 `items` 를 매 렌더 새로 만들면 `items[idx]` 도 매번 새 객체라, `item` 을 deps 에
   *    두면 이 effect 가 **매 렌더** 돌면서 `paint` 를 흰 종이로 밀어 버린다. 증상은 "한 칸씩만
   *    칠해지고 다른 칸을 칠하면 앞에 칠한 게 흰색으로 돌아간다" — 칠하기 자체는 멀쩡한데
   *    `setTick` 이 부른 리렌더가 방금 칠한 걸 지우는 것이다.
   *    (`ConnectTheDotsPlayer` 가 같은 버그를 겪고 주석으로 경고해 뒀는데 그대로 밟았다.)
   */
  const lineartUrl = item?.lineartUrl;
  const answerUrl = item?.answerUrl;
  useEffect(() => {
    if (!lineartUrl || !answerUrl) return;
    let cancelled = false;
    setReady(false);
    setDone(false);
    setRevealed(false);
    setSelected(0);
    doneRef.current = false;
    paintedRef.current = new Set();
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);

    (async () => {
      const [line, answer] = await Promise.all([loadImage(lineartUrl), loadImage(answerUrl)]);
      if (cancelled) return;

      const w = line.naturalWidth;
      const h = line.naturalHeight;
      const regions = labelRegions(buildWalls(readPixels(line, w, h)), w, h);
      const required = paintableRegions(regions, w * h, 0.003, borderRegions(regions.labels, w, h));
      // 🔴 정답본은 도안 크기로 맞춰 읽는다 — 모델이 낸 크기가 달라도 같은 자리를 보게.
      const { palette: pal, colorOfRegion } = buildPalette(
        regions,
        readPixels(answer, w, h),
        required
      );

      labelsRef.current = regions.labels;
      requiredRef.current = required;
      colorOfRegionRef.current = colorOfRegion;
      lineImgRef.current = line;

      const paint = new ImageData(w, h);
      paint.data.fill(255); // 흰 종이부터
      paintRef.current = paint;

      for (const c of [canvasRef.current, hintRef.current]) {
        if (c) {
          c.width = w;
          c.height = h;
        }
      }
      setPalette(pal);
      setReady(true);
      setTick((t) => t + 1);
      render();
    })().catch(() => {
      /* 이미지 하나가 없으면 그 그림은 건너뛴다 — 색칠은 실패가 없어야 한다. */
    });

    return () => {
      cancelled = true;
    };
  }, [lineartUrl, answerUrl, render]);

  // ── 힌트: 고른 색으로 칠할 칸을 반짝이게 ──────────────────────────────────
  useEffect(() => {
    const hint = hintRef.current;
    const labels = labelsRef.current;
    const entry = palette[selected];
    if (!hint || !labels || !entry || done) {
      hint?.getContext('2d')?.clearRect(0, 0, hint?.width ?? 0, hint?.height ?? 0);
      return;
    }
    const ctx = hint.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(hint.width, hint.height);
    const [r, g, b] = hintRgb(
      parseInt(entry.color.slice(1, 3), 16),
      parseInt(entry.color.slice(3, 5), 16),
      parseInt(entry.color.slice(5, 7), 16)
    );
    const todo = new Set(entry.regionIds.filter((id) => !paintedRef.current.has(id)));
    if (todo.size > 0) {
      const w = hint.width;
      for (let i = 0; i < labels.length; i++) {
        if (!todo.has(labels[i])) continue;
        // 🔴 **체크무늬로 칠한다, 꽉 채우지 않는다.** 평면으로 물들이면 힌트가 물감처럼 보여서
        //    "한 칸 눌렀는데 같은 색 칸이 다 칠해졌다"로 읽힌다(사용자 지적 — 실제로는 한 탭에
        //    한 칸만 찬다). 색칠 앱들이 힌트에 체크무늬를 쓰는 게 같은 이유다: 아직 할 일이라는 표시지
        //    칠해진 게 아니다.
        if ((((i % w) >> 4) + ((i / w) >> 4)) & 1) continue;
        const o = i * 4;
        img.data[o] = r;
        img.data[o + 1] = g;
        img.data[o + 2] = b;
        img.data[o + 3] = Math.round(HINT_ALPHA * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [palette, selected, done, tick]);

  const finish = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    revealTimerRef.current = window.setTimeout(() => setRevealed(true), 1400);
    const ttsUrl = await resolveTtsUrl({
      text: item.word,
      language: 'korean',
      storybookId: item.storybookId,
      directUrl: item.ttsUrl ?? undefined,
      identifierPrefix: 'color',
    });
    playCorrectSequence({ ttsUrl, language: 'ko' });
  }, [item, playCorrectSequence]);

  const handleTap = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const labels = labelsRef.current;
      const paint = paintRef.current;
      const entry = palette[selected];
      if (!canvas || !labels || !paint || !entry || doneRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) * (canvas.width / rect.width));
      const y = Math.floor((clientY - rect.top) * (canvas.height / rect.height));
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

      const id = labels[y * canvas.width + x];
      if (id === 0 || paintedRef.current.has(id)) return; // 선 위이거나 이미 칠한 칸

      const target = colorOfRegionRef.current.get(id);
      if (!target) return; // 셈에서 뺀 티끌 칸 — 조용히 무시

      // 🔴 다른 색 칸이면 **아무 벌도 주지 않는다.** 그 칸의 물감이 통통 튀어 알려 줄 뿐.
      //    소리도 오답음(`playIncorrect`)을 쓰지 않는다 — 여기선 틀린 게 아니라 "거기 말고 여기"다.
      //    음높이를 낮춰 낸 평범한 탭이면 아이가 "안 됐네"를 알아듣고도 혼난 기분은 안 든다.
      if (target !== entry.color) {
        playUi('toggle', 0.85);
        setBounce(target);
        if (bounceTimerRef.current != null) window.clearTimeout(bounceTimerRef.current);
        bounceTimerRef.current = window.setTimeout(() => setBounce(null), 900);
        return;
      }

      const r = parseInt(entry.color.slice(1, 3), 16);
      const g = parseInt(entry.color.slice(3, 5), 16);
      const b = parseInt(entry.color.slice(5, 7), 16);
      const data = paint.data;
      for (let i = 0; i < labels.length; i++) {
        if (labels[i] !== id) continue;
        const o = i * 4;
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = 255;
      }
      paintedRef.current.add(id);
      render();
      setTick((t) => t + 1);

      const total = requiredRef.current.length;
      const filled = requiredRef.current.filter((rid) => paintedRef.current.has(rid)).length;
      const colorCleared = entry.regionIds.every((rid) => paintedRef.current.has(rid));

      // 🔴 **칸을 채울 때마다 도레미파솔라시도 한 음씩.** 칸이 몇 개든 진행률에 음계를 얹으므로
      //    첫 칸이 낮은 도, 마지막 칸이 높은 도로 **항상 한 옥타브가 완성된다**. 칸 수에 맞춰
      //    음을 하나씩 세면 칸 3개짜리는 미에서 끝나고 14개짜리는 두 옥타브를 올라가 날카로워진다.
      //    (예전엔 같은 mp3 를 배속으로 올렸는데, 그러면 음과 함께 **길이도 줄어** 소리가 잘린 느낌이 났다.)
      playNote(((filled - 1) / Math.max(1, total - 1)) * 7, filled >= total ? 0.65 : 0.5);

      if (filled >= total) {
        finish();
        return;
      }
      // 🔴 고른 색을 다 썼으면 **다음 색으로 저절로 넘어간다** — 다 칠한 물감을 든 채 화면이
      //    아무 데도 안 반짝이면, 아이는 자기가 끝낸 줄 알거나 멈춘 줄 안다.
      if (colorCleared) {
        const nextIdx = palette.findIndex((p) =>
          p.regionIds.some((rid) => !paintedRef.current.has(rid))
        );
        if (nextIdx >= 0) setSelected(nextIdx);
      }
    },
    [palette, selected, render, finish]
  );

  const reset = () => {
    const paint = paintRef.current;
    if (!paint) return;
    paint.data.fill(255);
    paintedRef.current = new Set();
    doneRef.current = false;
    setDone(false);
    setRevealed(false);
    setSelected(0);
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    render();
    setTick((t) => t + 1);
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-cream-50 to-peach-100 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-2 sm:py-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center px-4 min-h-[44px] rounded-full bg-white shadow-soft text-ink-700 font-bold break-keep"
          >
            ← 돌아가기
          </button>
        ) : (
          <span />
        )}
        <p className="text-3xl sm:text-4xl font-black font-display text-ink-900 break-keep">
          {item.word}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 min-h-[44px] rounded-full bg-white shadow-soft text-ink-700 font-bold break-keep"
        >
          다시
        </button>
      </div>

      {/* 🔴 **왼쪽 정답 · 오른쪽 색칠** — 종이 색칠공부 책이 원래 이 모양이고, 아이가 "무슨 색인지"를
          반짝임 하나로만 알아내야 하는 것보다 훨씬 분명하다(사용자 지적). 세로 화면에선 위/아래.
          정답 그림은 작게 둔다 — 주인공은 아이가 칠하는 쪽이다. */}
      {/* 🔴 `landscape:` 는 쓰지 않는다 — 이 저장소는 `theme.extend.screens.short:{raw}` 때문에
          변형이 조용히 안 만들어진 전례가 있다(`max-*`). 검증된 컨벤션인 모바일 base + `sm:` 로. */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-3">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="text-sm sm:text-base font-bold text-ink-500 break-keep">
            이렇게 칠해요
          </span>
          <img
            src={item.answerUrl}
            alt={`${item.word} 정답`}
            className="block aspect-square h-[13vh] w-auto sm:h-auto sm:w-[26vw] sm:max-w-[280px] rounded-2xl border-4 border-peach-200 bg-white shadow-soft"
            draggable={false}
          />
        </div>

        {/* 🔴 정사각을 **세로에선 폭으로, 가로에선 높이로** 잡는다. `aspect-square h-full` 하나로 두면
            세로 화면에서 `h-full` 이 이겨 그림이 455×864 로 늘어난다(도안이 찌그러져 보인다). */}
        <div className="relative aspect-square w-full sm:w-auto sm:h-full max-w-full max-h-full rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ touchAction: 'none', opacity: ready ? 1 : 0 }}
            onPointerDown={(e: ReactPointerEvent<HTMLCanvasElement>) => {
              e.preventDefault();
              handleTap(e.clientX, e.clientY);
            }}
          />
          {/* 힌트 — 지금 고른 색으로 칠할 칸이 깜박인다. 탭은 아래 캔버스가 받는다. */}
          <canvas
            ref={hintRef}
            className="absolute inset-0 w-full h-full pointer-events-none animate-pulse"
          />

          {/* 다 칠한 그림을 1.4초 보여준 뒤 원본 삽화로 넘어간다 — 방금 완성한 자기 그림을 볼 틈. */}
          {item.originalUrl && (
            <img
              src={item.originalUrl}
              alt={item.word}
              className="absolute inset-0 w-full h-full object-contain bg-white transition-opacity duration-700 pointer-events-none"
              style={{ opacity: revealed ? 1 : 0 }}
            />
          )}
        </div>
      </div>

      <div className="shrink-0 px-3 sm:px-6 py-3">
        {done ? (
          <button
            onClick={() => setIdx((i) => (i + 1) % items.length)}
            className="w-full max-w-md mx-auto block min-h-[56px] rounded-full bg-coral-500 text-white text-2xl font-black shadow-pop break-keep"
          >
            다음 그림
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {palette.map((entry, i) => {
              const cleared = entry.regionIds.every((rid) => paintedRef.current.has(rid));
              return (
                <button
                  key={entry.color}
                  onClick={() => setSelected(i)}
                  aria-label={`${entry.color} 물감`}
                  aria-pressed={i === selected}
                  // 물감 고르기는 전역 위임 리스너의 기본 `tap` 을 그대로 쓴다 — 여기서 따로 안 낸다.
                  className={`relative rounded-full border-4 transition ${
                    // 🔴 안 고른 물감 테두리를 흰색으로 두면 **크림색 물감이 통째로 안 보인다**
                    //    (배경도 cream-50 이다). 힌트와 같은 이유 — 밝은 색은 흰 바탕에서 사라진다.
                    i === selected
                      ? 'w-[60px] h-[60px] border-ink-900 scale-110'
                      : 'w-12 h-12 border-peach-200'
                  } ${cleared ? 'opacity-35' : ''} ${bounce === entry.color ? 'animate-bounce' : ''}`}
                  style={{ backgroundColor: entry.color }}
                >
                  {cleared && (
                    <span className="absolute inset-0 grid place-items-center text-white text-xl font-black drop-shadow">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </div>
  );
}
