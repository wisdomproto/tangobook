import { useMemo, useState } from 'react';
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
  type Cell,
  type Challenge,
  type Dir,
  type PieceDef,
  type PieceSet,
  type Placement,
  type Rot,
} from '../lib/puzzle';

/** 칸 중심에서 각 변 중앙까지 — 파이프 한 획 */
const STUB: Record<Dir, [number, number]> = { N: [0.5, 0], E: [1, 0.5], S: [0.5, 1], W: [0, 0.5] };

function Pipe({ cells, color, opacity = 1 }: { cells: Cell[]; color: string; opacity?: number }) {
  return (
    <g opacity={opacity} stroke={color} strokeWidth={0.24} strokeLinecap="round" fill="none">
      {cells.map((c) => (
        <g key={key(c.x, c.y)}>
          <circle cx={c.x + 0.5} cy={c.y + 0.5} r={0.12} fill={color} stroke="none" />
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
  );
}

/**
 * 팔레트 한 칸 — 조각 모양 + **남은 개수**(기획서 §21.4).
 * 0 이면 비활성. 실물 블록을 다 쓴 것과 같은 상태다.
 */
function PieceChip({
  def,
  left,
  rot,
  flip,
  selected,
  hinted,
  onClick,
}: {
  def: PieceDef;
  left: number;
  rot: Rot;
  flip: boolean;
  selected: boolean;
  hinted: boolean;
  onClick: () => void;
}) {
  const cells = transformCells(def.cells, rot, flip);
  const w = Math.max(...cells.map((c) => c.x)) + 1;
  const h = Math.max(...cells.map((c) => c.y)) + 1;
  const out = left <= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={out}
      data-sound="select"
      aria-label={`${def.nameKo} ${left}개 남음`}
      aria-pressed={selected}
      className={`shrink-0 rounded-2xl border-2 px-2 pb-1 pt-2 transition ${
        selected ? 'border-coral-500 bg-coral-50' : 'border-ink-200 bg-cream-50'
      } ${hinted ? 'ring-4 ring-warn/60' : ''} ${out ? 'opacity-35' : ''}`}
      style={{ minHeight: 72, minWidth: 64 }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} width={w * 24} height={h * 24} className="mx-auto" aria-hidden>
        {cells.map((c) => (
          <rect
            key={key(c.x, c.y)}
            x={c.x + 0.04}
            y={c.y + 0.04}
            width={0.92}
            height={0.92}
            rx={0.12}
            fill="#FFF3E8"
          />
        ))}
        <Pipe cells={cells} color={def.color} />
      </svg>
      <span className="mt-1 block text-center text-xs font-bold text-ink-600">× {left}</span>
    </button>
  );
}

function TokenCell({
  x,
  y,
  label,
  emoji,
  imageUrl,
  ring,
}: {
  x: number;
  y: number;
  label: string;
  emoji?: string;
  imageUrl?: string;
  ring: string;
}) {
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
      {imageUrl ? (
        <image
          href={imageUrl}
          x={x + 0.08}
          y={y + 0.08}
          width={0.84}
          height={0.84}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text x={x + 0.5} y={y + 0.5} fontSize={0.5} textAnchor="middle" dominantBaseline="central">
          {emoji ?? '?'}
        </text>
      )}
      <title>{label}</title>
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
  /** 팔레트에서 고른 조각 종류 */
  const [pickedDef, setPickedDef] = useState<string | null>(null);
  /** 판 위에서 고른 조각 (placed 인덱스) */
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [result, setResult] = useState<'none' | 'wrong' | 'solved' | 'stuck'>('none');
  const [hoverAnchor, setHoverAnchor] = useState<{ x: number; y: number } | null>(null);

  const left = remainingInventory(ch, placed);
  const activeDef = pickedIdx !== null ? placed[pickedIdx].defId : pickedDef;

  const anchors = useMemo(() => {
    if (!pickedDef || pickedIdx !== null) return [];
    const o = orient[pickedDef];
    return legalAnchors(ch, set, placed, pickedDef, o.rot, o.flip);
  }, [ch, set, placed, pickedDef, pickedIdx, orient]);

  const hint = hintLevel > 0 ? nextHint(ch, set, placed) : null;

  function place(x: number, y: number) {
    if (!pickedDef) return;
    const o = orient[pickedDef];
    const next: Placement = { defId: pickedDef, x, y, rot: o.rot, flip: o.flip };
    if (!canPlace(ch, set, placed, next)) return;
    setPlaced((prev) => [...prev, next]);
    setHoverAnchor(null);
    setHintLevel(0);
    setResult('none');
    if (left[pickedDef] - 1 <= 0) setPickedDef(null); // 다 쓴 종류는 손에서 놓는다
    playUi('tap');
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
    pickedDef && pickedIdx === null && hoverAnchor
      ? placedCells(set[pickedDef], { defId: pickedDef, ...hoverAnchor, ...orient[pickedDef] })
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

      <svg
        viewBox={`0 0 ${ch.width} ${ch.height}`}
        className="w-full rounded-3xl bg-peach-50 shadow-inner"
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
                {b && (
                  <TokenCell
                    x={x}
                    y={y}
                    label={b.label}
                    emoji={b.emoji}
                    imageUrl={b.imageUrl}
                    ring="#E75757"
                  />
                )}
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
                    onClick={() => place(x, y)}
                  />
                )}
              </g>
            );
          })
        )}

        <TokenCell {...ch.start} ring="#FF5E3A" />
        <TokenCell {...ch.goal} ring="#3AA87E" />
        <Pipe
          cells={[
            { x: ch.start.x, y: ch.start.y, ports: [ch.start.port] },
            { x: ch.goal.x, y: ch.goal.y, ports: [ch.goal.port] },
          ]}
          color="#B29E8E"
          opacity={0.7}
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
                fillOpacity={0.25}
                stroke="#FFC857"
                strokeWidth={0.06}
              />
            ))}
            {hintLevel >= 2 && (
              <Pipe cells={hintCells} color={set[hint.defId].color} opacity={0.45} />
            )}
          </g>
        )}

        {ghost.length > 0 && <Pipe cells={ghost} color={set[pickedDef!].color} opacity={0.4} />}

        {placed.map((p, i) => {
          const def = set[p.defId];
          const cells = placedCells(def, p);
          return (
            <g
              key={`${p.defId}-${i}`}
              className="cursor-pointer"
              onClick={() => {
                setPickedIdx(i);
                setPickedDef(null);
                playUi('select');
              }}
            >
              {cells.map((c) => (
                <rect
                  key={key(c.x, c.y)}
                  x={c.x + 0.04}
                  y={c.y + 0.04}
                  width={0.92}
                  height={0.92}
                  rx={0.14}
                  fill="#FFFFFF"
                  stroke={pickedIdx === i ? def.color : 'transparent'}
                  strokeWidth={0.06}
                />
              ))}
              <Pipe cells={cells} color={def.color} />
            </g>
          );
        })}
      </svg>

      {/* 팔레트 = 남은 재고. 실물 상자에 남은 블록과 같은 것이다. */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
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
          />
        ))}
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
