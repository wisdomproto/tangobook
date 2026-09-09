import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Mascot } from '@/design-system';
import { playUi } from '@/lib/uiSound';
import {
  canPlace,
  isSolved,
  key,
  legalAnchors,
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
  type Terminal,
} from '../lib/puzzle';

/** 칸 중심에서 각 변 중앙까지 — 파이프 한 획 */
const STUB: Record<Dir, [number, number]> = { N: [0.5, 0], E: [1, 0.5], S: [0.5, 1], W: [0, 0.5] };
const NEIGHBOR: Record<Dir, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
/** 칸 변의 양 끝 (칸 좌상단 기준) */
const EDGE: Record<Dir, [number, number, number, number]> = {
  N: [0, 0, 1, 0],
  E: [1, 0, 1, 1],
  S: [0, 1, 1, 1],
  W: [0, 0, 0, 1],
};

/**
 * 블록 한 개 — **실물 블록처럼 한 덩어리 실루엣**으로 그린다.
 *
 * 🔴 칸마다 사각형을 그리면 「사각형 여러 개」로 보인다. 실물은 폴리오미노 판지 한 장이라,
 *    이웃이 없는 변에만 외곽선을 긋고 몸통은 이어서 칠한다.
 */
function PieceShape({
  cells,
  color,
  opacity = 1,
  outline,
}: {
  cells: Cell[];
  color: string;
  opacity?: number;
  outline?: string;
}) {
  const has = new Set(cells.map((c) => key(c.x, c.y)));
  return (
    <g opacity={opacity}>
      {cells.map((c) => (
        <rect
          key={key(c.x, c.y)}
          x={c.x}
          y={c.y}
          width={1}
          height={1}
          fill={color}
          fillOpacity={0.16}
        />
      ))}
      <g stroke={outline ?? color} strokeWidth={0.06} strokeLinecap="square">
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
      <g stroke={color} strokeWidth={0.22} strokeLinecap="round" fill="none">
        {cells.map((c) => (
          <g key={`pipe-${key(c.x, c.y)}`}>
            <circle cx={c.x + 0.5} cy={c.y + 0.5} r={0.11} fill={color} stroke="none" />
            {c.ports.map((d) => (
              <line
                key={d}
                x1={c.x + 0.5}
                y1={c.y + 0.5}
                x2={c.x + STUB[d][0]}
                y2={c.y + STUB[d][1]}
              />
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

/**
 * 팔레트 한 칸 — 조각 모양 + **남은 개수**(기획서 §21.4). 0 이면 비활성.
 * 탭해서 고르거나, 그대로 끌어서 판에 놓는다.
 */
function PieceChip({
  def,
  left,
  rot,
  flip,
  selected,
  hinted,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  def: PieceDef;
  left: number;
  rot: Rot;
  flip: boolean;
  selected: boolean;
  hinted: boolean;
  onClick: () => void;
  onDragStart: (defId: string) => void;
  onDragMove: (e: ReactPointerEvent) => void;
  onDragEnd: (moved: boolean) => void;
}) {
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const cells = transformCells(def.cells, rot, flip);
  const w = Math.max(...cells.map((c) => c.x)) + 1;
  const h = Math.max(...cells.map((c) => c.y)) + 1;
  const out = left <= 0;
  const unit = 17;
  return (
    <button
      type="button"
      onClick={() => {
        // 끌어서 놓은 뒤에 따라오는 click 은 무시한다(탭 선택과 구분)
        if (!drag.current?.moved) onClick();
      }}
      disabled={out}
      data-sound="select"
      aria-label={`${def.nameKo} ${left}개 남음`}
      aria-pressed={selected}
      onPointerDown={(e) => {
        if (out) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, moved: false };
        onDragStart(def.id);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 6) {
          drag.current.moved = true;
        }
        if (drag.current.moved) onDragMove(e);
      }}
      onPointerUp={() => {
        const moved = drag.current?.moved ?? false;
        onDragEnd(moved);
        // click 이 pointerup 뒤에 오므로 판단이 남아 있어야 한다
        setTimeout(() => {
          drag.current = null;
        }, 0);
      }}
      onPointerCancel={() => {
        onDragEnd(false);
        drag.current = null;
      }}
      className={`w-full shrink-0 touch-none rounded-2xl border-2 px-1 pb-1 pt-2 transition ${
        selected ? 'border-coral-500 bg-coral-50' : 'border-ink-200 bg-white'
      } ${hinted ? 'ring-4 ring-warn/60' : ''} ${out ? 'opacity-30' : ''}`}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w * unit}
        height={h * unit}
        className="mx-auto"
        aria-hidden
      >
        <PieceShape cells={cells} color={def.color} />
      </svg>
      <span className="mt-1 block text-center text-xs font-bold text-ink-600">× {left}</span>
    </button>
  );
}

/**
 * 칸 위 그림 (캐릭터·사물).
 *
 * 🔴 소스는 전부 **16:9** 다(캐릭터 시트·낱말 카드·표지). 안쪽 이미지를 16×9 로 놓고 crop 을
 *    같은 좌표계로 자르므로 비율이 안 망가진다.
 * crop 이 있으면 `meet`(잘라낸 인물이 통째로 보이게), 없으면 `slice`(낱말 카드가 칸을 채우게).
 */
function TokenArt({ x, y, art, ring }: { x: number; y: number; art: Art; ring: string }) {
  const W = 16;
  const H = 9;
  const [cx, cy, cw, chh] = art.crop ?? [0, 0, 1, 1];
  return (
    <g>
      <rect
        x={x + 0.04}
        y={y + 0.04}
        width={0.92}
        height={0.92}
        rx={0.16}
        fill="#FFFFFF"
        stroke={ring}
        strokeWidth={0.06}
      />
      {art.imageUrl ? (
        <svg
          x={x + 0.07}
          y={y + 0.07}
          width={0.86}
          height={0.86}
          viewBox={`${cx * W} ${cy * H} ${cw * W} ${chh * H}`}
          preserveAspectRatio={art.crop ? 'xMidYMid meet' : 'xMidYMid slice'}
        >
          <image href={art.imageUrl} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
        </svg>
      ) : (
        <text x={x + 0.5} y={y + 0.5} fontSize={0.5} textAnchor="middle" dominantBaseline="central">
          {art.emoji ?? '?'}
        </text>
      )}
      <title>{art.label}</title>
    </g>
  );
}

/**
 * 시작·목적지에서 길이 나가는 방향 표시.
 *
 * 🔴 칸 **가장자리에 붙는 짧은 꼭지**다. 예전엔 칸 중심에서 그려서 카드 그림 위를 가로질러
 *    덮었고, 방향 표시가 아니라 얼룩으로 보였다.
 */
function TerminalStub({ t, color }: { t: Terminal; color: string }) {
  const [ex, ey] = STUB[t.port];
  return (
    <line
      x1={t.x + 0.5 + (ex - 0.5) * 0.62}
      y1={t.y + 0.5 + (ey - 0.5) * 0.62}
      x2={t.x + ex}
      y2={t.y + ey}
      stroke={color}
      strokeWidth={0.22}
      strokeLinecap="round"
    />
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
  /** 팔레트에서 고른 조각 종류 */
  const [pickedDef, setPickedDef] = useState<string | null>(null);
  /** 판 위에서 고른 조각 (placed 인덱스) */
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved' | 'stuck'>('none');
  const [hoverAnchor, setHoverAnchor] = useState<{ x: number; y: number } | null>(null);
  /** 끌고 있는 조각 — 판 위 스냅 자리와 놓을 수 있는지 */
  const [drag, setDrag] = useState<{
    defId: string;
    anchor: { x: number; y: number };
    ok: boolean;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragDefRef = useRef<string | null>(null);
  const dropRef = useRef<{ defId: string; x: number; y: number } | null>(null);

  const left = remainingInventory(ch, placed);
  const activeDef = pickedIdx !== null ? placed[pickedIdx].defId : pickedDef;

  const anchors = useMemo(() => {
    if (!pickedDef || pickedIdx !== null || drag) return [];
    const o = orient[pickedDef];
    return legalAnchors(ch, set, placed, pickedDef, o.rot, o.flip);
  }, [ch, set, placed, pickedDef, pickedIdx, orient, drag]);

  const hint = hintLevel > 0 ? nextHint(ch, set, placed) : null;

  function place(defId: string, x: number, y: number) {
    const o = orient[defId];
    const next: Placement = { defId, x, y, rot: o.rot, flip: o.flip };
    if (!canPlace(ch, set, placed, next)) return;
    setPlaced((prev) => [...prev, next]);
    setHoverAnchor(null);
    setHintLevel(0);
    setResult('none');
    if (left[defId] - 1 <= 0 && pickedDef === defId) setPickedDef(null); // 다 쓴 종류는 손에서 놓는다
    playUi('tap');
  }

  // ─── 끌어서 놓기 ───
  // 🔴 좌표는 `getScreenCTM().inverse()` 로 옮긴다. 폭÷칸수로 나누면 svg 가 남는 폭 안에서
  //    가운데 정렬될 때(레터박싱) 어긋난다.
  function dragMove(e: ReactPointerEvent) {
    const defId = dragDefRef.current;
    const svg = svgRef.current;
    if (!defId || !svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const o = orient[defId];
    const shape = transformCells(set[defId].cells, o.rot, o.flip);
    const w = Math.max(...shape.map((c) => c.x)) + 1;
    const h = Math.max(...shape.map((c) => c.y)) + 1;
    // 조각 가운데가 손가락에 오게 잡는다
    const anchor = { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2) };
    const ok = canPlace(ch, set, placed, { defId, ...anchor, rot: o.rot, flip: o.flip });
    dropRef.current = ok ? { defId, ...anchor } : null;
    setDrag({ defId, anchor, ok });
  }

  function dragEnd(moved: boolean) {
    const drop = dropRef.current;
    if (moved && drop) place(drop.defId, drop.x, drop.y);
    dragDefRef.current = null;
    dropRef.current = null;
    setDrag(null);
  }

  function turn(kind: 'rot' | 'flip') {
    if (!activeDef) return;
    const o = orient[activeDef];
    const nextO: { rot: Rot; flip: boolean } =
      kind === 'rot'
        ? { rot: ((o.rot + 90) % 360) as Rot, flip: o.flip }
        : { rot: o.rot, flip: !o.flip };
    if (pickedIdx !== null) {
      const moved = { ...placed[pickedIdx], ...nextO };
      if (!canPlace(ch, set, placed, moved, pickedIdx)) return; // 그 자리에서 못 돌면 가만히 둔다
      setPlaced((prev) => prev.map((p, i) => (i === pickedIdx ? moved : p)));
    }
    setOrient((prev) => ({ ...prev, [activeDef]: nextO }));
    setResult('none');
    playUi('toggle');
  }

  /** 판에서 빼면 재고로 돌아온다 (§21.4) */
  function takeBack() {
    if (pickedIdx === null) return;
    const defId = placed[pickedIdx].defId;
    setPlaced((prev) => prev.filter((_, i) => i !== pickedIdx));
    setPickedIdx(null);
    setPickedDef(defId);
    setHintLevel(0);
    setResult('none');
    playUi('back');
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
      setPickedDef(null);
      setPickedIdx(null);
      setHintLevel(0);
      playUi('star');
      return;
    }
    setHintLevel((n) => n + 1);
    setPickedDef(target.defId);
    setPickedIdx(null);
    setResult('none');
    playUi('star');
  }

  function reset() {
    setPlaced([]);
    setOrient(
      Object.fromEntries(Object.keys(ch.inventory).map((id) => [id, { rot: 0, flip: false }]))
    );
    setPickedDef(null);
    setPickedIdx(null);
    setHintLevel(0);
    setResult('none');
  }

  const blockedAt = new Map(ch.blocked.map((b) => [key(b.x, b.y), b]));
  const hintCells = hint ? placedCells(set[hint.defId], hint) : [];
  const ghost =
    pickedDef && pickedIdx === null && !drag && hoverAnchor
      ? placedCells(set[pickedDef], { defId: pickedDef, ...hoverAnchor, ...orient[pickedDef] })
      : [];
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
        <svg
          ref={svgRef}
          viewBox={`0 0 ${ch.width} ${ch.height}`}
          className="min-w-0 flex-1 touch-none rounded-3xl bg-peach-50 shadow-inner"
          role="group"
          aria-label={`${ch.title} 퍼즐 판`}
        >
          {Array.from({ length: ch.height }, (_, y) =>
            Array.from({ length: ch.width }, (_, x) => {
              const b = blockedAt.get(key(x, y));
              const isAnchor = anchors.some((a) => a.x === x && a.y === y);
              return (
                <g key={key(x, y)}>
                  <rect
                    x={x + 0.04}
                    y={y + 0.04}
                    width={0.92}
                    height={0.92}
                    rx={0.14}
                    fill={b ? '#FFE4DC' : '#FFF9F3'}
                    stroke="#EDE1D4"
                    strokeWidth={0.03}
                  />
                  {b && <TokenArt x={x} y={y} art={b} ring="#E75757" />}
                  {isAnchor && (
                    <rect
                      x={x + 0.08}
                      y={y + 0.08}
                      width={0.84}
                      height={0.84}
                      rx={0.14}
                      fill="#5CC99F"
                      fillOpacity={0.18}
                      stroke="#3AA87E"
                      strokeWidth={0.05}
                      strokeDasharray="0.12 0.1"
                      className="cursor-pointer"
                      onPointerEnter={() => setHoverAnchor({ x, y })}
                      onPointerLeave={() => setHoverAnchor(null)}
                      onClick={() => pickedDef && place(pickedDef, x, y)}
                    />
                  )}
                </g>
              );
            })
          )}

          <TokenArt x={ch.start.x} y={ch.start.y} art={ch.start} ring="#FF5E3A" />
          <TokenArt x={ch.goal.x} y={ch.goal.y} art={ch.goal} ring="#3AA87E" />
          <TerminalStub t={ch.start} color="#FF5E3A" />
          <TerminalStub t={ch.goal} color="#3AA87E" />

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
                  fillOpacity={0.25}
                  stroke="#FFC857"
                  strokeWidth={0.06}
                />
              ))}
              {hintLevel >= 2 && (
                <PieceShape cells={hintCells} color={set[hint.defId].color} opacity={0.5} />
              )}
            </g>
          )}

          {ghost.length > 0 && (
            <PieceShape cells={ghost} color={set[pickedDef!].color} opacity={0.45} />
          )}

          {placed.map((p, i) => (
            <g
              key={`${p.defId}-${i}`}
              className="cursor-pointer"
              onClick={() => {
                setPickedIdx(i);
                setPickedDef(null);
                playUi('select');
              }}
            >
              <PieceShape
                cells={placedCells(set[p.defId], p)}
                color={set[p.defId].color}
                outline={pickedIdx === i ? '#0B0805' : undefined}
              />
            </g>
          ))}

          {drag && (
            <PieceShape
              cells={dragCells}
              color={drag.ok ? set[drag.defId].color : '#E75757'}
              opacity={0.6}
            />
          )}
        </svg>

        <div className="flex w-[72px] shrink-0 flex-col gap-2 sm:w-24">
          {Object.keys(ch.inventory).map((defId) => (
            <PieceChip
              key={defId}
              def={set[defId]}
              left={left[defId] ?? 0}
              rot={orient[defId].rot}
              flip={orient[defId].flip}
              selected={pickedDef === defId}
              hinted={hintLevel >= 2 && hint?.defId === defId}
              onClick={() => {
                setPickedDef(defId);
                setPickedIdx(null);
              }}
              onDragStart={(id) => {
                dragDefRef.current = id;
                setPickedDef(id);
                setPickedIdx(null);
              }}
              onDragMove={dragMove}
              onDragEnd={dragEnd}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => turn('rot')}
          disabled={!activeDef}
          className="min-h-[44px] rounded-xl border-2 border-ink-200 bg-white px-4 font-bold text-ink-700 disabled:opacity-40"
        >
          ↻ 돌리기
        </button>
        <button
          type="button"
          onClick={() => turn('flip')}
          disabled={!activeDef}
          className="min-h-[44px] rounded-xl border-2 border-ink-200 bg-white px-4 font-bold text-ink-700 disabled:opacity-40"
        >
          ⇄ 뒤집기
        </button>
        <button
          type="button"
          onClick={takeBack}
          disabled={pickedIdx === null}
          className="min-h-[44px] rounded-xl border-2 border-ink-200 bg-white px-4 font-bold text-ink-700 disabled:opacity-40"
        >
          빼기
        </button>
        <button
          type="button"
          onClick={useHint}
          className="min-h-[44px] rounded-xl border-2 border-warn bg-warn/15 px-4 font-bold text-ink-700"
        >
          💡 {HINT_LABEL[Math.min(hintLevel, 2)]}
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
