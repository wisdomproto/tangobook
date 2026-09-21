import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  BLOCKS,
  TRAY_CHO,
  TRAY_JUNG,
  charAt,
  rasterize,
  shapeAt,
} from '../../lib/tango-board/blocks';
import type { PlacedItem } from '../../lib/tango-board/compose';
import { cn } from '@/lib/cn';

/**
 * 판 칸 수. 폭은 실물 인식판과 같은 24칸.
 * 🔴 **높이는 8칸이다**(인식판은 10칸). 한 음절이 쓰는 세로는 받침까지 넣어도 8칸이 최대라
 *    (자음 3 + 가로모음 2 + 받침 3 = 8 · 세로모음 5 + 받침 3 = 8) 나머지 두 줄은 늘 비어 있고,
 *    그 두 줄이 칸 크기를 20% 깎는다. 좁은 화면에서 그 차이가 놀 수 있냐 없냐를 가른다.
 */
export const COLS = 24;
export const ROWS = 8;

export interface PlacedBlock {
  uid: number;
  id: number;
  rotDeg: number;
  x: number;
  y: number;
}

/** 판 위 블록 → 조합기가 읽는 형태. */
export function toItems(placed: PlacedBlock[]): PlacedItem[] {
  return placed.map((p) => {
    const sh = shapeAt(p.id, p.rotDeg);
    return { ch: charAt(p.id, p.rotDeg), x: p.x, y: p.y, w: sh.w, h: sh.h };
  });
}

/** 이 자리에 놓을 수 있나 — 판 안이고, 다른 블록이 지나는 칸과 겹치지 않아야 한다. */
export function canPlace(
  placed: PlacedBlock[],
  id: number,
  rotDeg: number,
  x: number,
  y: number
): boolean {
  const sh = shapeAt(id, rotDeg);
  if (x < 0 || y < 0 || x + sh.w > COLS || y + sh.h > ROWS) return false;
  const taken = new Set<string>();
  for (const p of placed) {
    const s = shapeAt(p.id, p.rotDeg);
    for (const [r, c] of rasterize(s)) taken.add(`${p.y + r},${p.x + c}`);
  }
  return rasterize(sh).every(([r, c]) => !taken.has(`${y + r},${x + c}`));
}

/** 원하는 자리가 막혔을 때 판 안에서 가장 가까운 빈자리를 찾는다. */
export function findNearestPlacement(
  placed: PlacedBlock[],
  id: number,
  rotDeg: number,
  preferredX: number,
  preferredY: number
): { x: number; y: number } | null {
  const sh = shapeAt(id, rotDeg);
  const originX = Math.max(0, Math.min(COLS - sh.w, Math.round(preferredX)));
  const originY = Math.max(0, Math.min(ROWS - sh.h, Math.round(preferredY)));
  let nearest: { x: number; y: number; distance: number } | null = null;

  for (let y = 0; y <= ROWS - sh.h; y++) {
    for (let x = 0; x <= COLS - sh.w; x++) {
      if (!canPlace(placed, id, rotDeg, x, y)) continue;
      const distance = (x - originX) ** 2 + (y - originY) ** 2;
      if (!nearest || distance < nearest.distance) nearest = { x, y, distance };
    }
  }

  return nearest ? { x: nearest.x, y: nearest.y } : null;
}

const STROKE = 0.58;

/**
 * 🔴 자음과 모음을 **색으로** 가른다. 아이는 아직 이름으로 못 가르는데, 자음은 왼쪽·위에
 * 모음은 오른쪽·아래에 붙는다는 규칙을 색이 먼저 알려 준다.
 */
/**
 * 🔴 **실물 블록 색 그대로** — 자음 노랑 · 모음 녹색. 값은 지어내지 않고
 * 3D 보드(`public/tango-board-3d.html` 의 `COLOR.cho`/`COLOR.jung`)에서 가져왔다.
 * 앱이 다른 색을 쓰면 아이가 실물 보드를 쥐었을 때 색을 다시 배워야 한다.
 */
const CHO_COLOR = '#F09E5C'; // 자음 — rgb(0.94, 0.62, 0.36)
const JUNG_COLOR = '#59B89E'; // 모음 — rgb(0.35, 0.72, 0.62)
const colorOf = (id: number) => (BLOCKS[id].kind === 'jung' ? JUNG_COLOR : CHO_COLOR);

/** 블록 한 개를 칸 좌표계 SVG 로 그린다 — 획은 중심선이라 둥근 선으로 긋는다. */
function BlockArt({ id, rotDeg, color }: { id: number; rotDeg: number; color: string }) {
  const sh = shapeAt(id, rotDeg);
  return (
    <g stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {sh.paths.map((p, i) => (
        <polyline key={i} points={p.map(([x, y]) => `${x},${y}`).join(' ')} />
      ))}
      {sh.circles.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
    </g>
  );
}

/**
 * 트레이 조각 한 개.
 * - **끌어다 놓기**(주된 방법) — 실물 보드처럼 집어서 판에 놓는다.
 * - 짧게 **탭**하면 고르고, 고른 걸 또 탭하면 **돌아간다**(판을 탭해도 놓인다).
 */
function TrayPiece({
  entry,
  picked,
  onPick,
  onDragStart,
}: {
  entry: { id: number; rotDeg: number };
  picked: { id: number; rotDeg: number } | null;
  onPick: (p: { id: number; rotDeg: number }) => void;
  onDragStart: (p: { id: number; rotDeg: number }, e: ReactPointerEvent) => void;
}) {
  const id = entry.id;
  const selected = picked?.id === id;
  const rotDeg = selected ? picked.rotDeg : entry.rotDeg;
  const onSelect = () => onPick({ id, rotDeg });
  const onRotate = () => {
    const keys = BLOCKS[id].rotKeys;
    onPick({ id, rotDeg: keys[(keys.indexOf(rotDeg) + 1) % keys.length] });
  };
  const sh = shapeAt(id, rotDeg);
  const ch = charAt(id, rotDeg);
  const canRotate = BLOCKS[id].rotKeys.length > 1;
  // 큰 조각(모음 5칸)과 작은 조각(자음 3칸)이 트레이에서 같은 높이로 보이게 여백을 맞춘다.
  const pad = 0.4;
  return (
    <button
      type="button"
      onPointerDown={(e) => onDragStart({ id, rotDeg }, e)}
      onClick={selected && canRotate ? onRotate : onSelect}
      aria-label={selected && canRotate ? `${ch} 돌리기` : `${ch} 고르기`}
      style={{ touchAction: 'none' }}
      className={cn(
        'relative rounded-2xl bg-white transition-all min-h-[44px] min-w-[44px] p-1 flex items-center justify-center',
        selected
          ? 'ring-4 ring-coral-400 shadow-pop -translate-y-0.5'
          : 'shadow-soft hover:shadow-pop hover:-translate-y-0.5'
      )}
    >
      <svg
        viewBox={`${-pad} ${-pad} ${sh.w + pad * 2} ${sh.h + pad * 2}`}
        className="w-full"
        style={{ height: 'clamp(1.75rem, 4.5vh, 2.5rem)', aspectRatio: `${sh.w} / ${sh.h}` }}
      >
        <BlockArt id={id} rotDeg={rotDeg} color={colorOf(id)} />
      </svg>
      {/* 🔴 「돌리기」 표시는 **띄워서** 붙인다 — 아래에 글자로 두면 트레이 줄 높이가 커지고
          그만큼 판이 줄어든다(트레이가 194px 를 먹어 판이 180px 밖에 못 받았다). */}
      {/* 🔴 돌아가는 조각은 **늘** ↻ 를 달고 있는다 — 눌러보기 전엔 돌아가는지 알 수가 없다. */}
      {canRotate && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[0.7rem] font-black flex items-center justify-center shadow-soft',
            selected ? 'bg-coral-500 text-white' : 'bg-peach-200 text-ink-700'
          )}
        >
          ↻
        </span>
      )}
    </button>
  );
}

export interface TangoBoardProps {
  placed: PlacedBlock[];
  /** 트레이에서 고른 조각 — `null` 이면 아무것도 안 골랐다. */
  picked: { id: number; rotDeg: number } | null;
  onPick: (p: { id: number; rotDeg: number } | null) => void;
  onPlace: (x: number, y: number, id: number, rotDeg: number) => void;
  /** 판 위 조각을 다른 자리로 — 끌어서 옮긴다(2026-09-16 사용자). */
  onMovePlaced: (uid: number, x: number, y: number) => void;
  /** 판 위 조각을 보드 바깥에 놓으면 지운다. */
  onRemovePlaced: (uid: number) => void;
  onRotatePlaced: (uid: number) => void;
  disabled?: boolean;
}

/**
 * 탱고 보드 — 실물과 같은 24×10 핀 판. 조각 16개를 돌리고 붙여 한글을 만든다.
 *
 * 🔴 **드래그가 아니라 「고르고 → 놓기」**다. 4~7세 손가락과 모바일에서 드래그는
 *    자주 놓치고, 실물 보드도 집어서 놓는 동작이다. 판 위 조각을 탭하면 돌아간다.
 */
export function TangoBoard({
  placed,
  picked,
  onPick,
  onPlace,
  onMovePlaced,
  onRemovePlaced,
  onRotatePlaced,
  disabled,
}: TangoBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  /**
   * 끌고 있는 조각. 🔴 포인터 이벤트로 직접 짠다 — HTML5 drag&drop 은 터치에서 안 뜨고,
   * 4~7세는 마우스보다 손가락으로 논다. 손가락 아래에 조각이 따라다녀야 「집었다」가 읽힌다.
   */
  const [drag, setDrag] = useState<{
    id: number;
    rotDeg: number;
    /** 판 위에서 집은 조각이면 그 조각의 uid — 트레이에서 집었으면 없다. */
    uid?: number;
    x: number;
    y: number;
    moved: boolean;
    outsideBoard: boolean;
    /** 판 위 블록을 잡은 칸 좌표. 가운데로 순간 이동하지 않고 잡은 지점을 유지한다. */
    grabOffset?: { x: number; y: number };
  } | null>(null);
  const dragRef = useRef<typeof drag>(null);
  dragRef.current = drag;
  /** 끌어 옮긴 직후의 클릭은 회전이 아니다 — 포인터를 떼면 클릭이 뒤따라 온다. */
  const draggedRef = useRef(false);

  const isPointInsideBoard = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    );
  }, []);

  const boardPointAt = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg || typeof svg.getScreenCTM !== 'function' || typeof svg.createSVGPoint !== 'function')
      return null;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(m.inverse());
  }, []);

  /** 화면 좌표 → 판 칸. 판 위 블록은 처음 집은 지점, 트레이 블록은 가운데를 기준으로 놓는다. */
  const cellAt = useCallback(
    (
      clientX: number,
      clientY: number,
      id: number,
      rotDeg: number,
      grabOffset?: { x: number; y: number }
    ) => {
      const p = boardPointAt(clientX, clientY);
      if (!p) return null;
      const sh = shapeAt(id, rotDeg);
      return {
        x: Math.round(p.x - (grabOffset?.x ?? sh.w / 2)),
        y: Math.round(p.y - (grabOffset?.y ?? sh.h / 2)),
      };
    },
    [boardPointAt]
  );

  const handleDragStart = useCallback(
    (piece: { id: number; rotDeg: number; uid?: number }, e: ReactPointerEvent) => {
      if (disabled) return;
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      draggedRef.current = false;
      const placedBlock =
        piece.uid === undefined ? undefined : placed.find((block) => block.uid === piece.uid);
      const boardPoint = boardPointAt(e.clientX, e.clientY);
      const shape = shapeAt(piece.id, piece.rotDeg);
      const grabOffset =
        placedBlock && boardPoint
          ? {
              x: Math.max(0, Math.min(shape.w, boardPoint.x - placedBlock.x)),
              y: Math.max(0, Math.min(shape.h, boardPoint.y - placedBlock.y)),
            }
          : undefined;
      setDrag({
        ...piece,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        outsideBoard: false,
        grabOffset,
      });
    },
    [boardPointAt, disabled, placed]
  );

  const handleDragMove = useCallback(
    (e: ReactPointerEvent) => {
      setDrag((d) =>
        d
          ? {
              ...d,
              x: e.clientX,
              y: e.clientY,
              moved: true,
              outsideBoard: d.uid !== undefined && !isPointInsideBoard(e.clientX, e.clientY),
            }
          : d
      );
    },
    [isPointInsideBoard]
  );

  const handleDragEnd = useCallback(
    (e: ReactPointerEvent) => {
      const d = dragRef.current;
      setDrag(null);
      if (!d || !d.moved) return; // 안 움직였으면 그냥 탭 — onClick 이 고르거나 돌린다
      draggedRef.current = true;
      if (d.uid !== undefined && !isPointInsideBoard(e.clientX, e.clientY)) {
        onRemovePlaced(d.uid);
        return;
      }
      const cell = cellAt(e.clientX, e.clientY, d.id, d.rotDeg, d.grabOffset);
      if (!cell) return;
      if (d.uid !== undefined) onMovePlaced(d.uid, cell.x, cell.y);
      else onPlace(cell.x, cell.y, d.id, d.rotDeg);
    },
    [cellAt, isPointInsideBoard, onPlace, onMovePlaced, onRemovePlaced]
  );

  const handleBoardTap = useCallback(
    (e: ReactMouseEvent) => {
      if (disabled || !picked) return;
      const cell = cellAt(e.clientX, e.clientY, picked.id, picked.rotDeg);
      if (cell) onPlace(cell.x, cell.y, picked.id, picked.rotDeg);
    },
    [disabled, picked, cellAt, onPlace]
  );

  const pins = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) out.push({ x: c, y: r });
    return out;
  }, []);

  /**
   * 화면 좌표(clientX/Y)를 쓰는 미리보기는 body 에 그린다. `EmbedStage`처럼 조상에
   * `transform: scale(...)`이 있으면 그 안의 fixed 요소도 로컬 좌표로 축소되어 포인터와
   * 어긋난다. 포털 밖에서는 left/top이 실제 뷰포트 좌표와 그대로 일치한다.
   */
  const dragPreview =
    drag?.moved && typeof document !== 'undefined'
      ? createPortal(
          <div
            data-tango-drag-preview
            className={cn(
              'pointer-events-none fixed z-[95] drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]',
              drag.outsideBoard && 'opacity-60'
            )}
            style={{
              left: drag.x,
              top: drag.y,
              transform: drag.grabOffset
                ? `translate(-${((drag.grabOffset.x + 0.4) / (shapeAt(drag.id, drag.rotDeg).w + 0.8)) * 100}%, -${((drag.grabOffset.y + 0.4) / (shapeAt(drag.id, drag.rotDeg).h + 0.8)) * 100}%)`
                : 'translate(-50%, -50%)',
            }}
          >
            <svg
              viewBox={`-0.4 -0.4 ${shapeAt(drag.id, drag.rotDeg).w + 0.8} ${shapeAt(drag.id, drag.rotDeg).h + 0.8}`}
              style={{
                height: '3rem',
                aspectRatio: `${shapeAt(drag.id, drag.rotDeg).w} / ${shapeAt(drag.id, drag.rotDeg).h}`,
              }}
            >
              <BlockArt id={drag.id} rotDeg={drag.rotDeg} color={colorOf(drag.id)} />
            </svg>
            {drag.uid !== undefined && (
              <span
                className={cn(
                  'absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black text-white shadow-pop',
                  drag.outsideBoard ? 'bg-danger' : 'bg-ink-700'
                )}
              >
                {drag.outsideBoard ? '놓아서 삭제' : '판 밖으로 옮기면 삭제'}
              </span>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className="w-full flex-1 min-h-0 flex flex-col gap-2 sm:gap-3 short:gap-1"
      onPointerMove={drag ? handleDragMove : undefined}
      onPointerUp={drag ? handleDragEnd : undefined}
      onPointerCancel={drag ? () => setDrag(null) : undefined}
    >
      {/* 🔴 판이 남는 높이를 **먹고** 트레이는 제 높이를 지킨다. 예전엔 판이 폭 기준(24:10)이라
          납작한 화면(태블릿 가로 768 · 폰 가로 375)에서 트레이를 화면 밖으로 11~80px 밀어냈다. */}
      <div className="flex-1 min-h-0 flex justify-center">
        <div
          onClick={handleBoardTap}
          className={cn(
            // 🔴 폭 기준(24:10)이되 **높이 상한**을 건다. 높이 기준으로 두면 트레이가 먼저 자리를
            //    차지해 판이 굶는다(실측 칸 6.8px). 상한에 걸리면 판이 레터박스로 그려지는데,
            //    탭 판정은 SVG 좌표계(`getScreenCTM`)라 그림과 안 어긋난다.
            // 🔴 판이 화면을 가득 채울 필요는 없다 — 가운데로 모으면 조각이 오가는 거리가 짧아진다.
            'relative w-full max-w-5xl mx-auto max-h-full rounded-3xl bg-white shadow-card border-4 border-peach-200 overflow-hidden',
            picked && !disabled && 'cursor-copy ring-4 ring-coral-200'
          )}
          style={{ aspectRatio: `${COLS} / ${ROWS}` }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${COLS} ${ROWS}`}
            className="absolute inset-0 w-full h-full"
          >
            {pins.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={0.1} fill="#F4ECE2" />
            ))}
            {placed.map((b) => {
              const sh = shapeAt(b.id, b.rotDeg);
              return (
                <g
                  key={b.uid}
                  transform={`translate(${b.x} ${b.y})`}
                  // 🔴 판 위 조각도 끌어서 옮긴다(2026-09-16 사용자) — 잘못 놓으면 되돌리기로 지웠다가
                  //    다시 놓아야 했다. 끌면 옮기고, 그냥 누르면 예전처럼 돌아간다.
                  onPointerDown={(e) =>
                    handleDragStart({ id: b.id, rotDeg: b.rotDeg, uid: b.uid }, e)
                  }
                  onClick={(e) => {
                    if (disabled) return;
                    e.stopPropagation();
                    if (draggedRef.current) {
                      draggedRef.current = false;
                      return;
                    }
                    onRotatePlaced(b.uid);
                  }}
                  onKeyDown={(e) => {
                    if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
                    e.preventDefault();
                    onRotatePlaced(b.uid);
                  }}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={`${charAt(b.id, b.rotDeg)} 블록 — 클릭해서 돌리기, 판 밖으로 끌어 삭제`}
                  style={{ touchAction: 'none' }}
                  opacity={drag?.uid === b.uid && drag.moved ? 0.25 : 1}
                  className={cn(
                    // 브라우저 기본 SVG 포커스 외곽선은 viewBox 배율로 확대되어 거대한 검은 도형처럼 보인다.
                    // 기본 외곽선을 끄고 아래 rect로 키보드 포커스만 블록 크기에 맞게 표시한다.
                    'group outline-none focus:outline-none',
                    !disabled && 'cursor-pointer'
                  )}
                >
                  {/* 투명한 판 — 획만 있으면 탭할 면적이 없다 */}
                  <rect x={0} y={0} width={sh.w} height={sh.h} fill="transparent" />
                  <BlockArt id={b.id} rotDeg={b.rotDeg} color={colorOf(b.id)} />
                  <rect
                    x={-0.18}
                    y={-0.18}
                    width={sh.w + 0.36}
                    height={sh.h + 0.36}
                    rx={0.18}
                    fill="none"
                    stroke="#FF7A59"
                    strokeWidth={0.08}
                    className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 끌고 있는 조각 — transform 조상 밖에서 실제 포인터 화면 좌표에 그린다. */}
      {dragPreview}

      {/* 🔴 트레이는 **한 줄 16개**다 — 자음·모음 패널을 따로 두면 각자 줄바꿈이 생겨 세 줄이 되고
          (실측) 그만큼 판이 줄어든다. 조각이 열여섯뿐이라 나눌 만큼 많지도 않다. */}
      <div className="shrink-0 rounded-3xl bg-cream-50 border-2 border-peach-200 p-1.5 sm:p-2 short:p-0.5 short:border">
        {/* 🔴 줄바꿈 대신 **가로 스크롤** — 줄이 늘 때마다 판이 그만큼 줄어든다.
            라이브러리 표지 줄과 같은 규칙(스크롤바만 숨기고 네이티브 스크롤 유지). */}
        <div
          className="flex flex-nowrap gap-1 sm:gap-1.5 items-center justify-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="블록 고르기"
        >
          {TRAY_CHO.map((e) => (
            <TrayPiece
              key={e.id}
              entry={e}
              picked={picked}
              onPick={onPick}
              onDragStart={handleDragStart}
            />
          ))}
          <span aria-hidden className="w-px self-stretch bg-peach-300 mx-1" />
          {TRAY_JUNG.map((e) => (
            <TrayPiece
              key={e.id}
              entry={e}
              picked={picked}
              onPick={onPick}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
