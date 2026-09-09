import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { playUi } from '@/lib/uiSound';
import {
  canPlace,
  isSolved,
  key,
  nextHint,
  placedCells,
  remainingInventory,
  transformCells,
  type Art,
  type Cell,
  type Challenge,
  type Dir,
  type PieceDef,
  type PieceSet,
  type Placement,
  type Rot,
} from '../lib/puzzle';

/** 칸 중심에서 각 변 중앙까지 */
const STUB: Record<Dir, [number, number]> = { N: [0.5, 0], E: [1, 0.5], S: [0.5, 1], W: [0, 0.5] };
const NEIGHBOR: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/** 칸 변의 양 끝 (칸 좌상단 기준) */
const EDGE: Record<Dir, [number, number, number, number]> = {
  N: [0, 0, 1, 0],
  E: [1, 0, 1, 1],
  S: [0, 1, 1, 1],
  W: [0, 0, 0, 1],
};

// 실물 타일과 같은 색 — 풀밭 위에 난 흙길
const TILE = '#C6E39C';
const TILE_EDGE = '#9AC96A';
const ROAD = '#8A5A3B';

/**
 * 길 조각 한 개 — 풀밭 타일 위에 흙길이 난 모습.
 *
 * 🔴 칸마다 사각형을 그리면 「사각형 여러 개」로 보인다. 실물은 판지 한 장이라 이웃이 없는
 *    변에만 테두리를 긋고 몸통은 이어서 칠한다.
 * 🔴 길이 조각을 알아보는 유일한 단서라 굵게 그린다. 조각 색은 **표식 점**으로만 쓴다
 *    (길까지 조각 색으로 칠하면 다섯 개가 다섯 가지 길처럼 보여 되레 헷갈린다).
 */
function PieceShape({
  cells,
  color,
  opacity = 1,
  tint,
  selected,
}: {
  cells: Cell[];
  color: string;
  opacity?: number;
  /** 놓을 수 없는 자리에 있을 때 타일을 물들인다 */
  tint?: string;
  selected?: boolean;
}) {
  const has = new Set(cells.map((c) => key(c.x, c.y)));
  const body = tint ?? TILE;
  const mark = cells.find((c) => c.ports.length === 0) ?? cells[0];
  return (
    <g opacity={opacity}>
      {cells.map((c) => (
        <rect key={key(c.x, c.y)} x={c.x} y={c.y} width={1} height={1} fill={body} />
      ))}
      <g
        stroke={selected ? '#0B0805' : tint ? '#B03A3A' : TILE_EDGE}
        strokeWidth={selected ? 0.09 : 0.06}
        strokeLinecap="square"
        fill="none"
      >
        {cells.flatMap((c) =>
          (Object.keys(EDGE) as Dir[])
            .filter((d) => !has.has(key(c.x + NEIGHBOR[d][0], c.y + NEIGHBOR[d][1])))
            .map((d) => {
              const [x1, y1, x2, y2] = EDGE[d];
              return (
                <line
                  key={`${key(c.x, c.y)}-${d}`}
                  x1={c.x + x1}
                  y1={c.y + y1}
                  x2={c.x + x2}
                  y2={c.y + y2}
                />
              );
            })
        )}
      </g>
      <g stroke={ROAD} strokeWidth={0.4} strokeLinecap="butt" strokeLinejoin="round" fill="none">
        {cells
          .filter((c) => c.ports.length > 0)
          .map((c) => (
            <path
              key={`road-${key(c.x, c.y)}`}
              d={c.ports
                .map((d) => `M${c.x + 0.5},${c.y + 0.5}L${c.x + STUB[d][0]},${c.y + STUB[d][1]}`)
                .join(' ')}
            />
          ))}
      </g>
      {/* 조각 표식 — 어느 조각인지 알아보는 꽃 자리 */}
      <circle cx={mark.x + 0.5} cy={mark.y + 0.5} r={0.12} fill={color} opacity={0.9} />
    </g>
  );
}

/**
 * 팔레트 한 칸 — 조각 모양 + 남은 개수 + **↻ 돌리기**(기획서 §21.4).
 *
 * 🔴 돌리기는 조각 위에 붙어 있고 **항상 보인다**. 골라야만 보이면 아이는 그 기능이 있는 줄
 *    모른다. 놓기 전에 방향을 맞춰 놓고 끌어다 놓는 순서가 자연스럽다.
 */
function PieceChip({
  def,
  left,
  rot,
  flip,
  hinted,
  onRotate,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  def: PieceDef;
  left: number;
  rot: Rot;
  flip: boolean;
  hinted: boolean;
  onRotate: () => void;
  onDragStart: (defId: string) => void;
  onDragMove: (e: ReactPointerEvent) => void;
  onDragEnd: (moved: boolean) => void;
}) {
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const cells = transformCells(def.cells, rot, flip);
  const w = Math.max(...cells.map((c) => c.x)) + 1;
  const h = Math.max(...cells.map((c) => c.y)) + 1;
  const out = left <= 0;
  const unit = 26;
  return (
    <div
      className={`relative rounded-2xl border-2 p-1.5 ${
        hinted ? 'border-warn bg-warn/15' : 'border-ink-200 bg-cream-50'
      } ${out ? 'opacity-25' : ''}`}
    >
      <div
        role="button"
        tabIndex={out ? -1 : 0}
        aria-label={`${def.nameKo} ${left}개 남음 — 끌어서 판에 놓기`}
        className={`flex touch-none items-center justify-center ${out ? '' : 'cursor-grab'}`}
        style={{ height: 2.2 * unit }}
        onPointerDown={(e) => {
          if (out) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, moved: false };
          onDragStart(def.id);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 5) {
            drag.current.moved = true;
          }
          if (drag.current.moved) onDragMove(e);
        }}
        onPointerUp={() => {
          onDragEnd(drag.current?.moved ?? false);
          drag.current = null;
        }}
        onPointerCancel={() => {
          onDragEnd(false);
          drag.current = null;
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} width={w * unit} height={h * unit} aria-hidden>
          <PieceShape cells={cells} color={def.color} />
        </svg>
      </div>
      <button
        type="button"
        onClick={onRotate}
        disabled={out}
        aria-label={`${def.nameKo} 돌리기`}
        data-sound="toggle"
        className="absolute -right-1.5 -top-1.5 h-7 w-7 rounded-full border-2 border-ink-200 bg-white text-sm font-bold text-ink-700 shadow-sm"
      >
        ↻
      </button>
      <span className="mt-0.5 block text-center text-xs font-bold text-ink-600">× {left}</span>
    </div>
  );
}

/**
 * 칸 위 그림 (캐릭터·사물).
 *
 * 🔴 소스는 전부 **16:9** 다(캐릭터 시트·낱말 카드). 시트에는 정면·측면·표정이 한 장에 있어서
 *    `crop` 으로 정면 하나만 집는다.
 * 🔴 자를 때 **중첩 svg 의 viewBox 에 기대지 않는다** — 그렇게 했더니 옆 포즈가 같이 새어
 *    나왔다. 배율과 위치를 직접 계산하고 `clipPath` 로 자른다.
 */
function TokenArt({
  x,
  y,
  art,
  ring,
  door,
}: {
  x: number;
  y: number;
  art: Art;
  ring: string;
  /** 문이 난 쪽 — 길은 이 쪽으로만 들어온다 */
  door?: Dir;
}) {
  const clip = useId().replace(/:/g, '');
  const W = 16;
  const H = 9;
  const BOX = art.noCard ? 0.99 : 0.84;
  const [cx, cy, cw, chh] = art.crop ?? [0, 0, 1, 1];
  const sw = cw * W;
  const sh = chh * H;
  // crop 이 있으면 잘라낸 인물이 통째로 보이게(맞춤), 없으면 카드가 칸을 채우게(채움)
  const s = art.crop ? Math.min(BOX / sw, BOX / sh) * 0.93 : Math.max(BOX / sw, BOX / sh);
  const pad = (1 - BOX) / 2;
  const ox = x + pad + (BOX - sw * s) / 2;
  const oy = y + pad + (BOX - sh * s) / 2;
  // 🔴 자르는 사각형은 **잘라낸 조각이 놓인 자리**다. 칸 전체로 잡으면 시트의 옆 포즈가
  //    그대로 같이 보인다(소녀가 둘로 나왔다). 칸 밖으로 나가는 부분만 칸으로 막는다.
  const cX = Math.max(x + pad, ox);
  const cY = Math.max(y + pad, oy);
  const cW = Math.min(x + pad + BOX, ox + sw * s) - cX;
  const cH = Math.min(y + pad + BOX, oy + sh * s) - cY;
  return (
    <g>
      {!art.noCard && (
        <rect
          x={x + 0.05}
          y={y + 0.05}
          width={0.9}
          height={0.9}
          rx={0.16}
          fill="#FFFFFF"
          stroke={ring}
          strokeWidth={0.07}
        />
      )}
      {art.imageUrl ? (
        <>
          <clipPath id={clip}>
            <rect x={cX} y={cY} width={cW} height={cH} rx={0.1} />
          </clipPath>
          <image
            clipPath={`url(#${clip})`}
            href={art.imageUrl}
            x={ox - cx * W * s}
            y={oy - cy * H * s}
            width={W * s}
            height={H * s}
            preserveAspectRatio="none"
          />
        </>
      ) : (
        <text
          x={x + 0.5}
          y={y + 0.5}
          fontSize={0.52}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {art.emoji ?? '?'}
        </text>
      )}
      {/* 🔴 문은 칸 **안쪽 가장자리**에 그린다. 칸 밖으로 꼭지를 내밀면 얼룩으로 보였다. */}
      {door && (
        <rect
          x={x + (door === 'E' ? 0.86 : door === 'W' ? 0.05 : 0.34)}
          y={y + (door === 'S' ? 0.86 : door === 'N' ? 0.05 : 0.34)}
          width={door === 'N' || door === 'S' ? 0.32 : 0.09}
          height={door === 'N' || door === 'S' ? 0.09 : 0.32}
          rx={0.04}
          fill={ROAD}
        />
      )}
      <title>{art.label}</title>
    </g>
  );
}

interface Props {
  challenge: Challenge;
  set: PieceSet;
}

export function PathPuzzlePlayer({ challenge: ch, set }: Props) {
  const [placed, setPlaced] = useState<Placement[]>([]);
  const [orient, setOrient] = useState<Record<string, { rot: Rot; flip: boolean }>>(() =>
    Object.fromEntries(Object.keys(ch.inventory).map((id) => [id, { rot: 0 as Rot, flip: false }]))
  );
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved' | 'stuck'>('none');
  /** 끌고 있는 조각 — 어디서 왔는지, 지금 어느 칸에 걸쳐 있는지 */
  const [drag, setDrag] = useState<{
    defId: string;
    from: number | null; // 판에서 집어 든 것이면 그 index
    anchor: { x: number; y: number };
    ok: boolean;
  } | null>(null);
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ defId: string; from: number | null } | null>(null);
  const dropRef = useRef<Placement | null>(null);

  const left = remainingInventory(ch, placed);
  const hint = hintLevel > 0 ? nextHint(ch, set, placed) : null;

  // ─── 끌어서 놓기 ───
  // 🔴 좌표는 `getScreenCTM().inverse()` 로 옮긴다. 폭÷칸수로 나누면 svg 가 남는 폭 안에서
  //    가운데 정렬될 때(레터박싱) 어긋난다.
  function dragMove(e: ReactPointerEvent) {
    const src = dragRef.current;
    const svg = svgRef.current;
    if (!src || !svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const o = orient[src.defId];
    const shape = transformCells(set[src.defId].cells, o.rot, o.flip);
    const w = Math.max(...shape.map((c) => c.x)) + 1;
    const h = Math.max(...shape.map((c) => c.y)) + 1;
    // 조각 가운데가 손가락에 오게 잡는다
    const anchor = { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2) };
    const cand: Placement = { defId: src.defId, ...anchor, rot: o.rot, flip: o.flip };
    const rest = src.from === null ? placed : placed.filter((_, i) => i !== src.from);
    const ok = canPlace(ch, set, rest, cand);
    dropRef.current = ok ? cand : null;
    setDrag({ defId: src.defId, from: src.from, anchor, ok });
  }

  function dragEnd(moved: boolean) {
    const src = dragRef.current;
    const drop = dropRef.current;
    if (src && moved) {
      const rest = src.from === null ? placed : placed.filter((_, i) => i !== src.from);
      if (drop) {
        setPlaced([...rest, drop]);
        setHintLevel(0);
        setResult('none');
        playUi('tap');
      } else if (src.from !== null) {
        // 놓을 수 없는 데로 끌고 갔으면 재고로 돌려준다
        setPlaced(rest);
        playUi('back');
      }
    }
    dragRef.current = null;
    dropRef.current = null;
    setDrag(null);
  }

  function rotate(defId: string, index: number | null) {
    const o = orient[defId];
    const next = { rot: ((o.rot + 90) % 360) as Rot, flip: o.flip };
    if (index !== null) {
      const moved = { ...placed[index], ...next };
      if (!canPlace(ch, set, placed, moved, index)) return; // 그 자리에서 못 돌면 가만히 둔다
      setPlaced((prev) => prev.map((p, i) => (i === index ? moved : p)));
    }
    setOrient((prev) => ({ ...prev, [defId]: next }));
    setResult('none');
    playUi('toggle');
  }

  function check() {
    if (isSolved(ch, set, placed)) {
      setResult('solved');
      playUi('reward');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      // 🔴 사용자 탭 안에서 바로 재생해야 iOS 가 막지 않는다
      if (ch.goal.ttsUrl) void new Audio(ch.goal.ttsUrl).play().catch(() => {});
    } else {
      setResult('wrong');
    }
  }

  function useHint() {
    const target = nextHint(ch, set, placed);
    if (!target) {
      // 지금 놓인 조각으로는 끝까지 갈 수 없다 — 뭘 빼야 하는지가 진짜 힌트다
      setResult('stuck');
      setHintLevel(0);
      return;
    }
    if (hintLevel >= 2) {
      setPlaced((prev) => [...prev, target]);
      setOrient((prev) => ({ ...prev, [target.defId]: { rot: target.rot, flip: target.flip } }));
      setHintLevel(0);
      playUi('star');
      return;
    }
    setHintLevel((n) => n + 1);
    setResult('none');
    playUi('star');
  }

  function reset() {
    setPlaced([]);
    setOrient(
      Object.fromEntries(Object.keys(ch.inventory).map((id) => [id, { rot: 0, flip: false }]))
    );
    setHintLevel(0);
    setResult('none');
  }

  const hintCells = hint ? placedCells(set[hint.defId], hint) : [];
  const dragCells = drag
    ? placedCells(set[drag.defId], { defId: drag.defId, ...drag.anchor, ...orient[drag.defId] })
    : [];
  const HINT_LABEL = ['힌트 보기', '더 알려줘', '한 조각 놓아 줘'];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-3 flex items-center gap-3">
        {ch.book.coverUrl && (
          <img
            src={ch.book.coverUrl}
            alt=""
            className="h-14 w-24 shrink-0 rounded-lg object-cover shadow-sm"
          />
        )}
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-ink-900 break-keep sm:text-xl">
            {ch.title}
          </h2>
          <p className="text-sm text-ink-600 break-keep">{ch.prompt}</p>
        </div>
      </header>

      {/* 판 + 오른쪽 블록 통 — 실물에서 상자를 판 옆에 두는 것과 같다 */}
      <div className="flex items-start gap-2 sm:gap-3">
        {/* 판은 숲 바닥 위에 놓인다. svg 는 모서리를 안 깎으므로 감싼 div 가 깎는다. */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-3xl shadow-inner">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${ch.width} ${ch.height}`}
            className="block w-full touch-none"
            role="group"
            aria-label={`${ch.title} 퍼즐 판`}
          >
            {/*
              🔴 배경은 **칸 하나를 반복**한다. 큰 그림 한 장을 판에 늘이면 칸마다 무늬가 달라
                 어떤 칸이 도드라지고, 아이는 그걸 단서로 읽는다. 빈 칸은 전부 똑같아야 한다.
            */}
            <defs>
              <pattern id={`floor-${uid}`} width={1} height={1} patternUnits="userSpaceOnUse">
                <image
                  href="/images/puzzle/board-bg.webp"
                  x={0}
                  y={0}
                  width={1}
                  height={1}
                  preserveAspectRatio="xMidYMid slice"
                />
              </pattern>
            </defs>
            <rect x={0} y={0} width={ch.width} height={ch.height} fill={`url(#floor-${uid})`} />
            {/* 🔴 숲 바닥은 **깔개**지 볼거리가 아니다. 크림색을 덮어 무늬를 눌러 둔다 —
                바닥이 시끄러우면 그 위에 놓인 길과 말이 안 읽힌다. */}
            <rect x={0} y={0} width={ch.width} height={ch.height} fill="#FFF6EA" opacity={0.62} />
            {Array.from({ length: ch.height }, (_, y) =>
              Array.from({ length: ch.width }, (_, x) => (
                // 🔴 칸은 반투명이다. 불투명하게 칠하면 애써 깐 숲 바닥이 통째로 가려진다.
                <rect
                  key={key(x, y)}
                  x={x + 0.04}
                  y={y + 0.04}
                  width={0.92}
                  height={0.92}
                  rx={0.14}
                  fill="#FFFFFF"
                  fillOpacity={0.16}
                  stroke="#FFFFFF"
                  strokeOpacity={0.7}
                  strokeWidth={0.035}
                />
              ))
            )}

            {/* 놓인 조각 — 다시 끌어서 옮기거나 빼낼 수 있다 */}
            {placed.map((p, i) => (
              <g
                key={`${p.defId}-${i}`}
                className="cursor-grab touch-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  dragRef.current = { defId: p.defId, from: i };
                }}
                onPointerMove={(e) => dragRef.current && dragMove(e)}
                onPointerUp={() => dragEnd(true)}
                onPointerCancel={() => dragEnd(false)}
                onDoubleClick={() => rotate(p.defId, i)}
              >
                <PieceShape
                  cells={placedCells(set[p.defId], p)}
                  color={set[p.defId].color}
                  opacity={drag?.from === i ? 0.25 : 1}
                />
              </g>
            ))}

            {ch.blocked.map((b) => (
              <TokenArt key={key(b.x, b.y)} x={b.x} y={b.y} art={b} ring="#E75757" />
            ))}
            <TokenArt x={ch.start.x} y={ch.start.y} art={ch.start} ring="#FF5E3A" />
            <TokenArt
              x={ch.goal.x}
              y={ch.goal.y}
              art={ch.goal}
              ring="#3AA87E"
              door={ch.goal.port}
            />

            {hint && hintLevel >= 1 && (
              <g>
                {hintCells.map((c) => (
                  <rect
                    key={key(c.x, c.y)}
                    x={c.x + 0.06}
                    y={c.y + 0.06}
                    width={0.88}
                    height={0.88}
                    rx={0.14}
                    fill="#FFC857"
                    fillOpacity={0.3}
                    stroke="#FFC857"
                    strokeWidth={0.06}
                  />
                ))}
                {hintLevel >= 2 && (
                  <PieceShape cells={hintCells} color={set[hint.defId].color} opacity={0.55} />
                )}
              </g>
            )}

            {drag && (
              <PieceShape
                cells={dragCells}
                color={set[drag.defId].color}
                opacity={0.85}
                tint={drag.ok ? undefined : '#F6C7C7'}
                selected={drag.ok}
              />
            )}
          </svg>
        </div>

        <div className="flex w-[76px] shrink-0 flex-col gap-2.5 sm:w-24">
          {Object.keys(ch.inventory).map((defId) => (
            <PieceChip
              key={defId}
              def={set[defId]}
              left={left[defId] ?? 0}
              rot={orient[defId].rot}
              flip={orient[defId].flip}
              hinted={hintLevel >= 2 && hint?.defId === defId}
              onRotate={() => rotate(defId, null)}
              onDragStart={(id) => {
                dragRef.current = { defId: id, from: null };
              }}
              onDragMove={dragMove}
              onDragEnd={dragEnd}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-ink-500 break-keep">
        조각을 <b>끌어서</b> 판에 놓아요 · ↻ 를 눌러 <b>돌려</b> 놓을 수 있어요
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useHint}
          className="min-h-[44px] rounded-xl border-2 border-warn bg-warn/15 px-4 font-bold text-ink-700"
        >
          💡 {HINT_LABEL[Math.min(hintLevel, 2)]}
        </button>
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-xl border-2 border-ink-200 bg-white px-4 font-bold text-ink-700"
        >
          처음부터
        </button>
        <button
          type="button"
          onClick={check}
          className="ml-auto min-h-[44px] rounded-xl bg-coral-500 px-6 font-bold text-white shadow"
        >
          확인하기
        </button>
      </div>

      {result === 'wrong' && (
        <p className="mt-3 rounded-2xl bg-cream-100 p-3 text-center text-ink-700 break-keep">
          아직 길이 안 이어졌어요. 조각을 돌려서 다시 놓아 볼까요?
        </p>
      )}

      {result === 'stuck' && (
        <p className="mt-3 rounded-2xl bg-cream-100 p-3 text-center text-ink-700 break-keep">
          지금 놓인 조각으로는 끝까지 갈 수 없어요. 하나를 빼고 다시 해 볼까요?
        </p>
      )}

      {result === 'solved' && (
        <div className="mt-3 rounded-3xl border-2 border-mint-300 bg-mint-50 p-4 text-center">
          <Mascot state="celebrating" size="md" />
          <p className="mt-1 font-display text-lg font-bold text-ink-900 break-keep">
            길이 이어졌어요! {ch.goal.label}에 도착!
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              to={`/library/${ch.book.id}`}
              className="min-h-[44px] rounded-xl bg-coral-500 px-5 py-2.5 font-bold text-white"
            >
              📖 《{ch.book.title}》 읽으러 가기
            </Link>
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] rounded-xl border-2 border-ink-200 bg-white px-5 font-bold text-ink-700"
            >
              다시 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
