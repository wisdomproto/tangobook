import { useRef, useCallback, useEffect, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { feedDrawLoop } from '@/lib/uiSound';

/**
 * 단어 전체 색칠 캔버스 — 단어의 모든 음절/글자를 한 번에 표시하고, **음절 단위**로 채움을 채점한다.
 * 한 음절 영역을 threshold 만큼 칠하면 그 음절이 완료로 표시되고 onSyllableDone 이 호출된다.
 * 모든 음절이 완료되면 onComplete. 체크마크 등 별도 표식은 그리지 않는다(요청).
 *
 * source-atop 으로 글자 영역 안만 emerald 로 칠해지고, 각 글자의 x 열 범위로 음절별 coverage 를 계산한다.
 */
const CANVAS_W = 720;
const CANVAS_H = 360;
const LINE_WIDTH = 56;
const GUIDE_COLOR = '#e5e7eb'; // gray-200 글자 가이드
const PAINT_COLOR = '#10b981'; // emerald — 칠하는 중
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

function fontFamilyFor(text: string): string {
  return HANGUL_RE.test(text)
    ? "'NanumSquareRound', 'NanumSquare', system-ui, sans-serif"
    : 'system-ui, sans-serif';
}

interface WordFillCanvasProps {
  word: string;
  /** 음절(글자) 배열 — 채점 단위. 보통 [...word] 의 글자 단위. */
  syllables: string[];
  onSyllableDone?: (syllable: string, index: number) => void;
  onComplete?: () => void;
  /** 음절별 통과 threshold (0~1). */
  threshold?: number;
  /** 글꼴 override (zh=Noto Sans SC, th=Noto Sans Thai 등). 미지정 시 한글/라틴 자동 감지. */
  fontFamily?: string;
  /**
   * 🔴 기본 **순차 쓰기** — 지금 쓸 글자 한 칸만 밝히고 나머지는 덮는다. 칠하기도 그 칸에서만 먹는다.
   * `bat` 을 통째로 내주면 아이가 아무 데나 문질러 순서 없이 통과한다(파닉스는 왼→오른쪽 순서가 곧 학습).
   * 자유 색칠이 필요한 화면만 `false`.
   */
  sequential?: boolean;
  /**
   * 🔴 **쓰는 순서**(cell 인덱스 배열). 미지정 시 왼→오른쪽(`[0,1,2,…]`). 파닉스는 **패턴(라임) 먼저**
   * 쓰게 한다 — `can` 은 `[1,2,0]`(a→n→c), `bake` 는 `[1,2,3,0]`(a→k→e→b). 이땐 오른쪽 덮개 대신
   * 지금 칸만 코랄로 밝힌다(끝난 칸·다음 칸이 좌우로 흩어지므로). `syllables` 는 여전히 시각 순서다.
   */
  order?: number[];
}

export function WordFillCanvas({
  word,
  syllables,
  onSyllableDone,
  onComplete,
  threshold = 0.99,
  fontFamily,
  sequential = true,
  order,
}: WordFillCanvasProps) {
  const { t } = useTranslation('games');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // 각 음절의 x 열 범위 [start, end] (canvas 좌표) + 가이드 픽셀 수(분모).
  const rangesRef = useRef<Array<{ start: number; end: number; guide: number }>>([]);
  const doneRef = useRef<boolean[]>([]);
  /**
   * 🔴 `onComplete` 는 **한 번만** — `evaluate()` 가 획을 뗄 때마다 다시 불려서, 마지막 획에서
   *    move + up 으로 두 번 확정됐다. 호출부가 "다음 카드로" 를 걸어두면 카드가 한 장씩 건너뛴다.
   */
  const completedRef = useRef(false);
  const [doneCount, setDoneCount] = useState(0);
  // 하이라이트를 그리려면 렌더가 범위를 알아야 한다 — ref 와 같은 값을 state 로도 둔다.
  const [ranges, setRanges] = useState<Array<{ start: number; end: number }>>([]);
  /** 지금 쓸 칸. `order` 있으면 그 순서의 다음 칸, 아니면 왼→오른쪽 첫 미완 칸. 순차 아니면 없음(null). */
  const activeIdx = order
    ? doneCount < order.length
      ? order[doneCount]
      : null
    : sequential
      ? doneCount
      : null;
  const activeRange = activeIdx != null ? ranges[activeIdx] : undefined;

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 단어 전체가 폭에 맞도록 폰트 크기 조정
    const fam = fontFamily ?? fontFamilyFor(word);
    let size = CANVAS_H * 0.7;
    ctx.font = `bold ${size}px ${fam}`;
    while (ctx.measureText(word).width > CANVAS_W * 0.92 && size > 40) {
      size -= 4;
      ctx.font = `bold ${size}px ${fam}`;
    }
    const totalW = ctx.measureText(word).width;
    const startX = (CANVAS_W - totalW) / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = GUIDE_COLOR;
    ctx.fillText(word, startX, CANVAS_H / 2);

    // 음절별 x 범위 계산 (measureText 누적)
    const ranges: Array<{ start: number; end: number; guide: number }> = [];
    let acc = '';
    let prevX = startX;
    for (const syl of syllables) {
      acc += syl;
      const x = startX + ctx.measureText(acc).width;
      ranges.push({ start: prevX, end: x, guide: 0 });
      prevX = x;
    }
    // 가이드 픽셀을 음절 열에 배분
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    for (let p = 0; p < img.length; p += 4) {
      if (img[p + 3] === 0) continue;
      const px = (p / 4) % CANVAS_W;
      for (const r of ranges) {
        if (px >= r.start && px < r.end) {
          r.guide++;
          break;
        }
      }
    }
    rangesRef.current = ranges;
    doneRef.current = ranges.map(() => false);
    setDoneCount(0);
    setRanges(ranges.map((r) => ({ start: r.start, end: r.end })));
  }, [word, syllables, fontFamily]);

  useEffect(() => {
    let alive = true;
    let drew = false;
    const fam = fontFamily ?? fontFamilyFor(word);
    // 최초 1회만 그림(로드 완료 / 안전 타임아웃 중 먼저 오는 쪽) → 사용자 획을 지우지 않음.
    const draw = () => {
      if (!alive || drew) return;
      drew = true;
      drawGuide();
    };
    lastPointRef.current = null;
    const fonts = (typeof document !== 'undefined' ? document.fonts : undefined) as
      | (FontFaceSet & { load?: (font: string, text?: string) => Promise<unknown> })
      | undefined;
    if (fonts?.load) {
      // 웹폰트(zh/th/한글) 로딩을 기다렸다 그려야 두부/폴백 글리프로 zone 이 틀어지지 않음.
      fonts.load(`bold 80px ${fam}`, word).then(draw).catch(draw);
      const t = setTimeout(draw, 400); // 로드가 늦어도 일단 그림
      return () => {
        alive = false;
        clearTimeout(t);
      };
    }
    draw();
    return () => {
      alive = false;
    };
  }, [drawGuide, word, fontFamily]);

  /** 칠한 뒤 음절별 coverage 측정 → 새로 완료된 음절 처리. */
  const evaluate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const ranges = rangesRef.current;
    if (ranges.length === 0) return;
    const painted = ranges.map(() => 0);
    const img = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    for (let p = 0; p < img.length; p += 4) {
      const a = img[p + 3];
      if (a === 0) continue;
      const r = img[p];
      const g = img[p + 1];
      const b = img[p + 2];
      // emerald(초록 우세) = 사용자가 칠한 영역.
      if (!(g > r + 20 && g > b + 20)) continue;
      const px = (p / 4) % CANVAS_W;
      for (let i = 0; i < ranges.length; i++) {
        if (px >= ranges[i].start && px < ranges[i].end) {
          painted[i]++;
          break;
        }
      }
    }
    const newlyDone: number[] = [];
    for (let i = 0; i < ranges.length; i++) {
      if (doneRef.current[i]) continue;
      if (ranges[i].guide > 0 && painted[i] / ranges[i].guide >= threshold) {
        doneRef.current[i] = true; // 완성해도 자동 재도색 X — 사용자가 칠한 emerald 그대로.
        newlyDone.push(i);
      }
    }
    if (newlyDone.length) setDoneCount(doneRef.current.filter(Boolean).length);
    const allDone = doneRef.current.every(Boolean);
    // 🔴 이 evaluate 에서 낱말이 **완성되면** 이번에 새로 끝난 글자의 개별 이어읽기(onSyllableDone)는
    //    내지 않는다 — onComplete 가 낱말 전체를 읽으므로 같은 채널에서 겹친다(한 획으로 마지막 두
    //    칸을 몰아 칠할 때 `bak`+`bake`+띵동이 같은 ms 에 났다, 2026-08-06 검수). 완성이 아니면 이어읽기.
    //    소비자는 어차피 마지막 글자 이어읽기를 스킵하므로(게임 플레이어=microtask defer, 배우기=index
    //    체크) 마지막 글자의 onSyllableDone 을 안 내는 것은 동작 불변이다.
    // 🔴 **다만 소비자가 「마지막에 알려준 글자」를 기억해 두면 그 값은 마지막 글자가 아니다** —
    //    직전 글자다. 낱말 쓰기 플레이어가 그걸로 「다 쓴 뒤 읽어 줄 글자」를 정하다가, `가구` 를
    //    쓰면 「가」 → 쉼 → 「가구」 를 냈다(2026-08-18). 마지막 글자는 `syllables.at(-1)` 이지
    //    이 콜백이 알려주는 값이 아니다.
    if (!allDone) {
      for (const i of newlyDone) onSyllableDone?.(syllables[i], i);
    }
    if (allDone && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [syllables, threshold, onSyllableDone, onComplete]);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const paintTo = (x: number, y: number) => {
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.save();
    // 🔴 순차 모드에선 지금 칸 밖은 아예 칠해지지 않는다 — 덮개는 보기용일 뿐이고,
    //    실제 차단은 여기 clip 이 한다(안 그러면 덮개 위로 문질러 다음 글자가 채워진다).
    if (sequential) {
      // 지금 쓸 칸 = order 의 다음 칸(있으면) / 없으면 왼→오른쪽 첫 미완 칸. 그 칸에서만 칠해진다.
      const dn = doneRef.current.filter(Boolean).length;
      const ai = order ? order[dn] : doneRef.current.findIndex((d) => !d);
      const r = ai != null && ai >= 0 ? rangesRef.current[ai] : undefined;
      if (!r) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.rect(r.start, 0, r.end - r.start, CANVAS_H);
      ctx.clip();
    }
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = PAINT_COLOR;
    ctx.fillStyle = PAINT_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const last = lastPointRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    lastPointRef.current = { x, y };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    try {
      canvasRef.current!.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    lastPointRef.current = null;
    paintTo(pt.x, pt.y);
    feedDrawLoop();
    evaluate();
  };
  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = toCanvas(e);
    paintTo(pt.x, pt.y);
    feedDrawLoop();
    evaluate();
  };
  const onUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    evaluate();
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="relative w-full rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop">
        {/* 🔴 지금 쓸 칸만 남기고 덮는 스포트라이트. 캔버스 픽셀을 건드리면 이미 칠한 획이 지워지므로
         **DOM 오버레이**로 얹는다. 차단 자체는 paintTo 의 clip 이 담당한다. */}
        {activeRange && (
          <>
            {/* 🔴 **아직 안 쓴 오른쪽만 덮는다** — 왼쪽(이미 끝낸 글자)까지 덮으면 애써 칠한 초록이
                회색으로 눌려, 다 쓴 글자가 안 쓴 글자와 똑같아 보인다. 끝낸 것은 그대로 보여준다.
                🔴 `order`(패턴 먼저) 모드에선 끝난 칸·다음 칸이 좌우로 흩어져 오른쪽 덮개가 맞지 않으니
                덮지 않고 코랄 링으로만 지금 칸을 가리킨다. */}
            {!order && (
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 z-10 pointer-events-none bg-cream-50/90 backdrop-grayscale transition-all duration-300"
                style={{ width: `${((CANVAS_W - activeRange.end) / CANVAS_W) * 100}%` }}
              />
            )}
            {/* 지금 칸 = 코랄 테두리 + 아래 굵은 밑줄. 깜빡임까지 더해 눈이 바로 여기로 온다. */}
            <div
              aria-hidden
              className="absolute inset-y-1 z-20 pointer-events-none rounded-2xl ring-[5px] ring-coral-400 animate-pulse transition-all duration-300"
              style={{
                left: `${(activeRange.start / CANVAS_W) * 100}%`,
                width: `${((activeRange.end - activeRange.start) / CANVAS_W) * 100}%`,
              }}
            />
            <div
              aria-hidden
              className="absolute bottom-0 z-20 h-2 bg-coral-500 rounded-full pointer-events-none transition-all duration-300"
              style={{
                left: `${(activeRange.start / CANVAS_W) * 100}%`,
                width: `${((activeRange.end - activeRange.start) / CANVAS_W) * 100}%`,
              }}
            />
          </>
        )}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block w-full h-auto"
          style={{ touchAction: 'none' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      {syllables.length > 1 && (
        <p className="text-base sm:text-lg font-black text-ink-500">
          {t('writingGame.progress', { done: doneCount, total: syllables.length })}
        </p>
      )}
    </div>
  );
}
