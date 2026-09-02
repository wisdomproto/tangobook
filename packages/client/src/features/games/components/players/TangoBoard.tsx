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
  id,
  rotDeg,
  selected,
  onSelect,
  onRotate,
}: {
  id: number;
  rotDeg: number;
  selected: boolean;
  onSelect: () => void;
  onRotate: () => void;
}) {
  const sh = shapeAt(id, rotDeg);
  const ch = charAt(id, rotDeg);
  const canRotate = BLOCKS[id].rotKeys.length > 1;
  // 큰 조각(모음 5칸)과 작은 조각(자음 3칸)이 트레이에서 같은 높이로 보이게 여백을 맞춘다.
  const pad = 0.4;
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={selected && canRotate ? onRotate : onSelect}
        aria-label={selected && canRotate ? `${ch} 돌리기` : `${ch} 고르기`}
        className={cn(
          'relative rounded-2xl bg-white transition-all min-h-[44px] min-w-[44px] p-1.5 flex items-center justify-center',
          selected
            ? 'ring-4 ring-coral-400 shadow-pop -translate-y-0.5'
            : 'shadow-soft hover:shadow-pop hover:-translate-y-0.5'
        )}
      >
        <svg
          viewBox={`${-pad} ${-pad} ${sh.w + pad * 2} ${sh.h + pad * 2}`}
          className="w-full"
          style={{ height: 'clamp(2.25rem, 7vh, 3.25rem)', aspectRatio: `${sh.w} / ${sh.h}` }}
        >
          <BlockArt id={id} rotDeg={rotDeg} color="#3F2F24" />
        </svg>
      </button>
      {selected && canRotate && (
        <span className="text-[0.65rem] font-black text-coral-600">↻ 돌리기</span>
      )}
    </div>
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
  const boardRef = useRef<HTMLDivElement>(null);

  const handleBoardTap = useCallback(
    (e: ReactMouseEvent) => {
      if (disabled || !picked || !boardRef.current) return;
      const r = boardRef.current.getBoundingClientRect();
      const cw = r.width / COLS;
      const chh = r.height / ROWS;
      const sh = shapeAt(picked.id, picked.rotDeg);
      // 누른 곳이 조각의 **가운데**가 되게 놓는다 — 아이는 놓을 자리를 가운데로 겨눈다.
      const x = Math.round((e.clientX - r.left) / cw - sh.w / 2);
      const y = Math.round((e.clientY - r.top) / chh - sh.h / 2);
      onPlace(x, y);
    },
    [disabled, picked, onPlace]
  );

  const pins = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r <= ROWS; r++) for (let c = 0; c <= COLS; c++) out.push({ x: c, y: r });
    return out;
  }, []);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 판 — 흰 카드 위 격자. 칸 비율은 정사각이라 aspect 로 고정한다. */}
      <div
        ref={boardRef}
        onClick={handleBoardTap}
        className={cn(
          'relative w-full rounded-3xl bg-white shadow-card border-4 border-peach-200 overflow-hidden',
          picked && !disabled && 'cursor-copy ring-4 ring-coral-200'
        )}
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
      >
        <svg viewBox={`0 0 ${COLS} ${ROWS}`} className="absolute inset-0 w-full h-full">
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

      {/* 트레이 — 자음 13 · 모음 3. 나머지 글자는 돌리고 붙여서 만든다. */}
      <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr] gap-3">
        <TraySection
          title="자음"
          hint="돌리면 ㄱ→ㄴ · 둘을 나란히 놓으면 ㄲ"
          entries={TRAY_CHO}
          picked={picked}
          onPick={onPick}
        />
        <TraySection
          title="모음"
          hint="돌리면 ㅏ→ㅗ→ㅓ→ㅜ · ㅣ 를 더하면 ㅐ"
          entries={TRAY_JUNG}
          picked={picked}
          onPick={onPick}
        />
      </div>
    </div>
  );
}

function TraySection({
  title,
  hint,
  entries,
  picked,
  onPick,
}: {
  title: string;
  hint: string;
  entries: { id: number; rotDeg: number }[];
  picked: { id: number; rotDeg: number } | null;
  onPick: (p: { id: number; rotDeg: number } | null) => void;
}) {
  return (
    <div className="rounded-3xl bg-cream-50 border-2 border-peach-200 p-2 sm:p-3">
      <div className="flex items-baseline gap-2 mb-1.5 px-1">
        <h3 className="text-sm sm:text-base font-black font-display text-ink-900">{title}</h3>
        <span className="text-[0.65rem] sm:text-xs font-bold text-ink-600 break-keep">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        {entries.map((e) => {
          const selected = picked?.id === e.id;
          return (
            <TrayPiece
              key={e.id}
              id={e.id}
              rotDeg={selected ? picked.rotDeg : e.rotDeg}
              selected={selected}
              onSelect={() => onPick({ id: e.id, rotDeg: selected ? picked.rotDeg : e.rotDeg })}
              onRotate={() => {
                const keys = BLOCKS[e.id].rotKeys;
                const next = keys[(keys.indexOf(picked!.rotDeg) + 1) % keys.length];
                onPick({ id: e.id, rotDeg: next });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
