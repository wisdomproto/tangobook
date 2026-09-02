import { useCallback, useMemo, useRef, type MouseEvent as ReactMouseEvent } from 'react';
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

/** 판 칸 수 — 실물 프로토타입(`public/tango-board.html`)과 같다. */
export const COLS = 24;
export const ROWS = 10;

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

const STROKE = 0.58;

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

/** 트레이 조각 한 개 — 탭하면 회전, 다시 탭하면 고른다. */
function TrayPiece({
  entry,
  picked,
  onPick,
}: {
  entry: { id: number; rotDeg: number };
  picked: { id: number; rotDeg: number } | null;
  onPick: (p: { id: number; rotDeg: number }) => void;
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
      onClick={selected && canRotate ? onRotate : onSelect}
      aria-label={selected && canRotate ? `${ch} 돌리기` : `${ch} 고르기`}
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
        <BlockArt id={id} rotDeg={rotDeg} color="#3F2F24" />
      </svg>
      {/* 🔴 「돌리기」 표시는 **띄워서** 붙인다 — 아래에 글자로 두면 트레이 줄 높이가 커지고
          그만큼 판이 줄어든다(트레이가 194px 를 먹어 판이 180px 밖에 못 받았다). */}
      {selected && canRotate && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-coral-500 text-white text-[0.7rem] font-black flex items-center justify-center shadow-soft">
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
  onPlace: (x: number, y: number) => void;
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
  onRotatePlaced,
  disabled,
}: TangoBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleBoardTap = useCallback(
    (e: ReactMouseEvent) => {
      const svg = svgRef.current;
      if (disabled || !picked || !svg) return;
      // 🔴 누른 지점을 **SVG 좌표계로** 되돌린다(`getScreenCTM`). 컨테이너 rect 를 칸 수로 나누면
      //    판이 레터박스로 그려질 때(납작한 화면) 어긋난다 — 그림과 판정이 갈라지는 종류의 버그다.
      const m = svg.getScreenCTM();
      if (!m) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(m.inverse());
      const sh = shapeAt(picked.id, picked.rotDeg);
      // 누른 곳이 조각의 **가운데**가 되게 놓는다 — 아이는 놓을 자리를 가운데로 겨눈다.
      onPlace(Math.round(p.x - sh.w / 2), Math.round(p.y - sh.h / 2));
    },
    [disabled, picked, onPlace]
  );

  const pins = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) out.push({ x: c, y: r });
    return out;
  }, []);

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-2 sm:gap-3">
      {/* 🔴 판이 남는 높이를 **먹고** 트레이는 제 높이를 지킨다. 예전엔 판이 폭 기준(24:10)이라
          납작한 화면(태블릿 가로 768 · 폰 가로 375)에서 트레이를 화면 밖으로 11~80px 밀어냈다. */}
      <div className="flex-1 min-h-0 flex justify-center">
        <div
          onClick={handleBoardTap}
          className={cn(
            // 🔴 폭 기준(24:10)이되 **높이 상한**을 건다. 높이 기준으로 두면 트레이가 먼저 자리를
            //    차지해 판이 굶는다(실측 칸 6.8px). 상한에 걸리면 판이 레터박스로 그려지는데,
            //    탭 판정은 SVG 좌표계(`getScreenCTM`)라 그림과 안 어긋난다.
            'relative w-full max-h-full rounded-3xl bg-white shadow-card border-4 border-peach-200 overflow-hidden',
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
              <circle key={i} cx={p.x} cy={p.y} r={0.12} fill="#EDE1D4" />
            ))}
            {placed.map((b) => {
              const sh = shapeAt(b.id, b.rotDeg);
              return (
                <g
                  key={b.uid}
                  transform={`translate(${b.x} ${b.y})`}
                  onClick={(e) => {
                    if (disabled) return;
                    e.stopPropagation();
                    onRotatePlaced(b.uid);
                  }}
                  className={disabled ? undefined : 'cursor-pointer'}
                >
                  {/* 투명한 판 — 획만 있으면 탭할 면적이 없다 */}
                  <rect x={0} y={0} width={sh.w} height={sh.h} fill="transparent" />
                  <BlockArt id={b.id} rotDeg={b.rotDeg} color="#FF5E3A" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 🔴 트레이는 **한 줄 16개**다 — 자음·모음 패널을 따로 두면 각자 줄바꿈이 생겨 세 줄이 되고
          (실측) 그만큼 판이 줄어든다. 조각이 열여섯뿐이라 나눌 만큼 많지도 않다. */}
      <div className="shrink-0 rounded-3xl bg-cream-50 border-2 border-peach-200 p-1.5 sm:p-2">
        {/* 🔴 줄바꿈 대신 **가로 스크롤** — 줄이 늘 때마다 판이 그만큼 줄어든다.
            라이브러리 표지 줄과 같은 규칙(스크롤바만 숨기고 네이티브 스크롤 유지). */}
        <div
          className="flex flex-nowrap gap-1 sm:gap-1.5 items-center justify-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="블록 고르기"
        >
          {TRAY_CHO.map((e) => (
            <TrayPiece key={e.id} entry={e} picked={picked} onPick={onPick} />
          ))}
          <span aria-hidden className="w-px self-stretch bg-peach-300 mx-1" />
          {TRAY_JUNG.map((e) => (
            <TrayPiece key={e.id} entry={e} picked={picked} onPick={onPick} />
          ))}
        </div>
      </div>
    </div>
  );
}
