import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { useGameAudio } from '../../hooks/useGameAudio';
import { resolveTtsUrl } from '@/features/tts';
import { playUi, playNote, feedDrawLoop, stopDrawLoop } from '@/lib/uiSound';
import { buildWalls, labelRegions, paintableRegions, borderRegions } from '@tangobook/shared';
import type { Lang } from '@tangobook/shared';
import {
  boundsOf,
  buildPalette,
  cornerBackground,
  type PaletteEntry,
} from '../../lib/answer-colors';

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
 * 정답색은 **색 출처 그림**(정답본이나 원본 삽화)에서 앱이 직접 읽는다 → `answer-colors.ts`.
 * 선 안을 지키는 건 아이가 아니라 코드다 → `@tangobook/shared` 의 `flood-fill`(생성 스크립트의 검사기와 **같은 구현**을 써야 검사기가 거짓말을 하지 않는다).
 */

export interface ColoringItem {
  word: string;
  /** 흰 면 + 검은 선 도안. */
  lineartUrl: string;
  /**
   * 칸별 정답색을 읽어 올 그림. 「이렇게 칠해요」 미리보기로도 쓴다.
   *
   * 🔴 **정답본이어야 하는 건 아니다.** 칸 나누기는 도안 픽셀만 보는 flood fill 이라 두 번째
   *    그림은 색 출처일 뿐이고, **원본 삽화로도 된다** — 도안이 원본을 보고 그린 그림이라 자리가
   *    겹친다(실측: 오리 노랑·부리 주황·볼 분홍 / 여우 주황·주둥이 크림). 정답본이 있으면 그게
   *    더 정확하니 **있으면 정답본, 없으면 원본**으로 데이터에서 정한다.
   */
  colorSourceUrl: string;
  /** 다 칠하면 보여줄 원본 단어 삽화. */
  originalUrl?: string | null;
  /** 낱말 음원 직행 URL. 없으면 `resolveTtsUrl` 이 합성 경로로 푼다. */
  ttsUrl?: string | null;
  /** 음원 캐시 키 — 파닉스는 단원 id. */
  storybookId?: string;
  /** 낱말을 읽어 줄 언어. 영어 파닉스 낱말을 한국어로 이어 붙이면 딴 소리가 난다. */
  language?: 'korean' | 'english' | 'vi' | 'zh' | 'th';
  /**
   * 칭찬 언어 — 지시·칭찬은 **아이 말**이다. 없으면 `language` 로 추정한다(파닉스 데모 호환).
   * 🔴 예전엔 `english` 가 아니면 전부 `ko` 라 베트남 아이가 한국어 칭찬을 들을 뻔했다.
   */
  lang?: Lang;
}

interface ColoringPlayerProps {
  items: ColoringItem[];
  onBack?: () => void;
}

/**
 * 손으로 칠한 넓이가 이만큼이면 그 칸을 다 칠한 것으로 본다.
 *
 * 🔴 **60%로 뒀더니 「반쯤 칠하면 나머지가 저절로 칠해지는」 느낌이었다**(2026-09-10 사용자).
 *    아이가 칠하다 만 그림을 앱이 대신 끝내 주면, 칠한 사람이 자기가 아니게 된다.
 *    90%면 남는 건 붓이 닿기 어려운 가장자리뿐이라 **채워지는 게 티가 안 난다** — 끝은 코드가
 *    맺되 그림은 아이가 칠한 것이다(사용자 지정 값).
 * 🔴 100%로 못 두는 이유: 붓이 둥글어 모서리 몇 픽셀이 영영 안 닿으면 칸이 안 끝난다.
 *    (붓은 칸 안에서만 먹으므로 테두리 밖으로 마음껏 문질러 모서리까지 칠할 수는 있다.)
 */
const FILL_THRESHOLD = 0.9;
/** 붓 굵기 — 그림 짧은 변의 비율. 손가락으로도 몇 번이면 칸이 차야 한다. */
const BRUSH_RATIO = 0.055;

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

/**
 * 🔴 **늘리지 말고 맞춰 넣는다.** 색 출처가 정답본일 때는 도안과 같은 정사각이라 어느 쪽이든
 *    같지만, 원본 삽화를 쓸 때는 비율이 다를 수 있다. 늘리면 칸과 색이 어긋나 부리가 몸 색을 가져간다.
 */
function readPixels(img: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d 없음');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, w, h).data;
}

/**
 * 색 출처를 **도안에 맞춰 다시 그려서** 읽는다.
 *
 * 🔴 도안은 원본을 보고 **다시 그린** 그림이라 크기와 자세가 안 맞는다. 그냥 겹쳐 읽으면
 *    고양이 몸통 칸에 원본의 흰 배경이 걸려 흰 고양이가 나온다. 그래서 원본에서 **그림이
 *    차지한 사각형**을 도안에서 **선이 차지한 사각형**에 맞춰 늘려 놓고 읽는다.
 *    (표본 200장: 칸 절반 이상을 배경색으로 읽은 도안 81장 → 28장.)
 */
function readColorSource(
  img: HTMLImageElement,
  w: number,
  h: number,
  ink: { x: number; y: number; w: number; h: number }
): { pixels: Uint8ClampedArray; background: number[] } {
  const flat = readPixels(img, w, h);
  const background = cornerBackground(flat, w, h);
  const subject = boundsOf(w, h, (i) => {
    const o = i * 4;
    return (
      Math.abs(flat[o] - background[0]) > 18 ||
      Math.abs(flat[o + 1] - background[1]) > 18 ||
      Math.abs(flat[o + 2] - background[2]) > 18
    );
  });

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d 없음');
  ctx.fillStyle = `rgb(${background.map(Math.round).join(',')})`;
  ctx.fillRect(0, 0, w, h);
  // subject 는 위 캔버스 좌표다 — 원본 이미지 좌표로 되돌려 잘라낸다.
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const ox = (w - img.naturalWidth * s) / 2;
  const oy = (h - img.naturalHeight * s) / 2;
  ctx.drawImage(
    img,
    (subject.x - ox) / s,
    (subject.y - oy) / s,
    subject.w / s,
    subject.h / s,
    ink.x,
    ink.y,
    ink.w,
    ink.h
  );
  return { pixels: ctx.getImageData(0, 0, w, h).data, background };
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
  /** 칸별 넓이(픽셀). 얼마나 칠했는지 재려면 분모가 있어야 한다. */
  const sizesRef = useRef<number[]>([]);
  /** 칸별로 지금까지 손으로 칠한 픽셀 수. */
  const coveredRef = useRef<Map<number, number>>(new Map());
  /** 붓이 지나간 마지막 자리 — 빠르게 그으면 점이 띄엄띄엄 찍혀서 선을 이어 준다. */
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  /**
   * 손이 지나간 픽셀 표시.
   *
   * 🔴 **알파로는 못 센다** — 흰 종이를 `fill(255)` 로 깔아서 **모든 픽셀이 이미 알파 255**다.
   *    그걸 「이미 칠함」으로 읽으면 붓이 한 점도 안 먹는다(실측: 화면이 그대로였다).
   *    색을 비교하는 것도 흰 물감(백조)에서 무너진다. 지나간 자리는 따로 적는다.
   */
  const strokeMaskRef = useRef<Uint8Array | null>(null);
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
  const colorSourceUrl = item?.colorSourceUrl;
  useEffect(() => {
    if (!lineartUrl || !colorSourceUrl) return;
    let cancelled = false;
    setReady(false);
    setDone(false);
    setRevealed(false);
    setSelected(0);
    doneRef.current = false;
    paintedRef.current = new Set();
    if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);

    (async () => {
      const [line, answer] = await Promise.all([loadImage(lineartUrl), loadImage(colorSourceUrl)]);
      if (cancelled) return;

      const w = line.naturalWidth;
      const h = line.naturalHeight;
      const walls = buildWalls(readPixels(line, w, h));
      const regions = labelRegions(walls, w, h);
      const required = paintableRegions(regions, w * h, 0.003, borderRegions(regions.labels, w, h));
      // 🔴 색 출처는 도안의 그림 사각형에 맞춰 읽는다 — 크기가 달라도 같은 자리를 보게.
      const ink = boundsOf(w, h, (i) => walls[i] === 1);
      const source = readColorSource(answer, w, h, ink);
      const { palette: pal, colorOfRegion } = buildPalette(
        regions,
        source.pixels,
        required,
        source.background
      );

      labelsRef.current = regions.labels;
      requiredRef.current = required;
      sizesRef.current = regions.sizes;
      coveredRef.current = new Map();
      strokeMaskRef.current = new Uint8Array(w * h);
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
  }, [lineartUrl, colorSourceUrl, render]);

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
      language: item.language ?? 'korean',
      storybookId: item.storybookId,
      directUrl: item.ttsUrl ?? undefined,
      identifierPrefix: 'color',
    });
    playCorrectSequence({
      ttsUrl,
      language: item.lang ?? (item.language === 'english' ? 'en' : 'ko'),
    });
  }, [item, playCorrectSequence]);

  /**
   * 손으로 칠한다 — **누르면 그 칸이 차던 것을 붓질로 바꿨다**(2026-09-10 사용자).
   *
   * 🔴 탭 한 번에 칸이 차면 그건 색칠이 아니라 **순서대로 누르기**다. 아이가 하는 일이
   *    「어디를 누를까」뿐이라 손이 하는 일이 없다.
   * 🔴 대신 붓은 **고른 물감의 칸 안에서만 먹는다.** 밖으로 나가도 벌은 없고 그냥 안 칠해질 뿐이라,
   *    선 밖으로 나가지 않으려고 애쓸 필요가 없다 — 선을 지키는 건 아이가 아니라 코드다.
   *    (`WordFillCanvas` 가 지금 쓸 칸만 `clip` 으로 먹게 한 것과 같은 규칙.)
   */
  const paintStroke = useCallback(
    (clientX: number, clientY: number, first: boolean) => {
      const canvas = canvasRef.current;
      const labels = labelsRef.current;
      const paint = paintRef.current;
      const entry = palette[selected];
      if (!canvas || !labels || !paint || !entry || doneRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const W = canvas.width;
      const H = canvas.height;
      const x = (clientX - rect.left) * (W / rect.width);
      const y = (clientY - rect.top) * (H / rect.height);
      if (x < 0 || y < 0 || x >= W || y >= H) return;

      const radius = Math.max(6, Math.round(Math.min(W, H) * BRUSH_RATIO));
      const from = first ? { x, y } : (lastPtRef.current ?? { x, y });
      lastPtRef.current = { x, y };

      const r = parseInt(entry.color.slice(1, 3), 16);
      const g = parseInt(entry.color.slice(3, 5), 16);
      const b = parseInt(entry.color.slice(5, 7), 16);
      const data = paint.data;
      const mask = strokeMaskRef.current;
      if (!mask) return;
      const covered = coveredRef.current;
      const touched = new Set<number>();
      let painted = 0;

      const stamp = (cx: number, cy: number) => {
        const x0 = Math.max(0, Math.floor(cx - radius));
        const x1 = Math.min(W - 1, Math.ceil(cx + radius));
        const y0 = Math.max(0, Math.floor(cy - radius));
        const y1 = Math.min(H - 1, Math.ceil(cy + radius));
        for (let py = y0; py <= y1; py++) {
          for (let px = x0; px <= x1; px++) {
            const dx = px - cx;
            const dy = py - cy;
            if (dx * dx + dy * dy > radius * radius) continue;
            const i = py * W + px;
            const id = labels[i];
            if (id === 0 || paintedRef.current.has(id)) continue;
            if (colorOfRegionRef.current.get(id) !== entry.color) continue;
            if (mask[i]) continue; // 이미 지나간 픽셀은 두 번 안 센다
            mask[i] = 1;
            const o = i * 4;
            data[o] = r;
            data[o + 1] = g;
            data[o + 2] = b;
            data[o + 3] = 255;
            covered.set(id, (covered.get(id) ?? 0) + 1);
            touched.add(id);
            painted++;
          }
        }
      };

      // 🔴 빠르게 그으면 점이 띄엄띄엄 찍힌다 — 지난 자리에서 여기까지 이어 찍는다.
      const dist = Math.hypot(x - from.x, y - from.y);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.5)));
      for (let step = 1; step <= steps; step++) {
        stamp(from.x + ((x - from.x) * step) / steps, from.y + ((y - from.y) * step) / steps);
      }

      if (painted === 0) {
        // 🔴 누른 데가 **다른 색 칸**이면 그 물감이 통통 튀어 알려 준다 — 벌은 없다.
        if (first) {
          const id = labels[Math.floor(y) * W + Math.floor(x)];
          const target = id ? colorOfRegionRef.current.get(id) : undefined;
          if (target && target !== entry.color) {
            playUi('toggle', 0.85);
            setBounce(target);
            if (bounceTimerRef.current != null) window.clearTimeout(bounceTimerRef.current);
            bounceTimerRef.current = window.setTimeout(() => setBounce(null), 900);
          }
        }
        return;
      }

      feedDrawLoop(); // 칠하는 동안 연필 소리 (`stopDrawLoop` 은 손을 떼면)

      // 충분히 칠한 칸은 **남은 가장자리를 코드가 채운다** — 아이가 테두리를 문지르게 두지 않는다.
      let completed = 0;
      for (const id of touched) {
        const size = sizesRef.current[id] ?? 0;
        if (!size || (covered.get(id) ?? 0) / size < FILL_THRESHOLD) continue;
        for (let i = 0; i < labels.length; i++) {
          if (labels[i] !== id) continue;
          const o = i * 4;
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = b;
          data[o + 3] = 255;
        }
        paintedRef.current.add(id);
        completed++;
      }

      render();
      setTick((t) => t + 1);
      if (completed === 0) return;

      const total = requiredRef.current.length;
      const filled = requiredRef.current.filter((rid) => paintedRef.current.has(rid)).length;
      const colorCleared = entry.regionIds.every((rid) => paintedRef.current.has(rid));

      // 🔴 **칸을 채울 때마다 도레미파솔라시도 한 음씩.** 칸이 몇 개든 진행률에 음계를 얹으므로
      //    첫 칸이 낮은 도, 마지막 칸이 높은 도로 **항상 한 옥타브가 완성된다**.
      playNote(((filled - 1) / Math.max(1, total - 1)) * 7, filled >= total ? 0.65 : 0.5);

      if (filled >= total) {
        stopDrawLoop();
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
    coveredRef.current = new Map();
    strokeMaskRef.current?.fill(0);
    lastPtRef.current = null;
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

      {/* 🔴 **원본 삽화는 칠하는 동안 안 보여 준다**(2026-09-10 사용자). 옆에 완성본을 띄워 두면
          아이가 보는 것은 자기 그림이 아니라 남의 그림이고, 색은 물감통과 반짝이는 칸이 이미 말해 준다.
          다 칠하면 그 자리에서 삽화로 바뀐다 — 끝에 한 번 보는 게 상이다.
          🔴 `landscape:` 는 쓰지 않는다 — 이 저장소는 `theme.extend.screens.short:{raw}` 때문에
          변형이 조용히 안 만들어진 전례가 있다(`max-*`). 검증된 컨벤션인 모바일 base + `sm:` 로. */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-3">
        {/* 🔴 정사각을 **세로에선 폭으로, 가로에선 높이로** 잡는다. `aspect-square h-full` 하나로 두면
            세로 화면에서 `h-full` 이 이겨 그림이 455×864 로 늘어난다(도안이 찌그러져 보인다). */}
        <div className="relative aspect-square w-full sm:w-auto sm:h-full max-w-full max-h-full rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            style={{ touchAction: 'none', opacity: ready ? 1 : 0 }}
            onPointerDown={(e: ReactPointerEvent<HTMLCanvasElement>) => {
              e.preventDefault();
              // 🔴 포인터를 이 캔버스에 묶는다 — 손이 그림 밖으로 나갔다 돌아와도 획이 안 끊긴다.
              e.currentTarget.setPointerCapture(e.pointerId);
              paintStroke(e.clientX, e.clientY, true);
            }}
            onPointerMove={(e: ReactPointerEvent<HTMLCanvasElement>) => {
              if (e.buttons === 0) return;
              e.preventDefault();
              paintStroke(e.clientX, e.clientY, false);
            }}
            onPointerUp={() => {
              lastPtRef.current = null;
              stopDrawLoop();
            }}
            onPointerCancel={() => {
              lastPtRef.current = null;
              stopDrawLoop();
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
