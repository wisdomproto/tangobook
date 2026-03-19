import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { TrackType } from '../hooks/useTimeline';

interface TimelineClipProps {
  id: string;
  trackType: TrackType;
  label: string;
  startTime: number;
  duration: number;
  sceneIndex?: number;
  timeToPixel: (time: number) => number;
  pixelToTime: (px: number) => number;
  isSelected: boolean;
  onSelect: (trackType: TrackType, clipId: string) => void;
  /** Subtitle: resize edges change start/end timing */
  onTimingChange?: (startTime: number, endTime: number) => void;
  /** Video/SFX: resize edges change trim */
  onTrimChange?: (trimStart: number, trimEnd: number) => void;
  /** SFX/TTS/Subtitle: body drag to move (receives relative offset) */
  onMove?: (newRelativeOffset: number) => void;
  /** Video: body drag to reorder scenes */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  trimStart?: number;
  trimEnd?: number;
  /** Current relative offset within scene (for SFX/TTS move) */
  currentOffset?: number;
}

const TRACK_COLORS: Record<TrackType, { bg: string; border: string; text: string }> = {
  video: {
    bg: 'bg-violet-500/20 dark:bg-violet-500/30',
    border: 'border-violet-400 dark:border-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
  },
  sfx: {
    bg: 'bg-amber-500/20 dark:bg-amber-500/30',
    border: 'border-amber-400 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  subtitle: {
    bg: 'bg-sky-500/20 dark:bg-sky-500/30',
    border: 'border-sky-400 dark:border-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
  },
  tts: {
    bg: 'bg-green-500/20 dark:bg-green-500/30',
    border: 'border-green-400 dark:border-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  bgm: {
    bg: 'bg-rose-500/20 dark:bg-rose-500/30',
    border: 'border-rose-400 dark:border-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
  },
};

export function TimelineClip({
  id,
  trackType,
  label,
  startTime,
  duration,
  sceneIndex,
  timeToPixel,
  pixelToTime,
  isSelected,
  onSelect,
  onTimingChange,
  onTrimChange,
  onMove,
  onReorder,
  trimStart: initTrimStart = 0,
  trimEnd: initTrimEnd = 0,
  currentOffset = 0,
}: TimelineClipProps) {
  const colors = TRACK_COLORS[trackType];
  const left = timeToPixel(startTime);
  const width = Math.max(timeToPixel(duration), 4);

  const canResize =
    (trackType === 'subtitle' && !!onTimingChange) || (trackType === 'video' && !!onTrimChange);
  const canMove = !!onMove;
  const canReorder = trackType === 'video' && !!onReorder && sceneIndex !== undefined;

  const [dragDx, setDragDx] = useState(0);
  const [dragType, setDragType] = useState<
    'resize-start' | 'resize-end' | 'move' | 'reorder' | null
  >(null);
  const isDragging = dragType !== null;

  // Refs to snapshot values at drag start (immune to re-renders)
  const refs = useRef({
    startX: 0,
    startTime: 0,
    endTime: 0,
    trimStart: 0,
    trimEnd: 0,
    offset: 0,
  });

  // Use refs for callbacks to avoid stale closures during drag
  const callbackRefs = useRef({ onTimingChange, onTrimChange, onMove, onReorder });
  callbackRefs.current = { onTimingChange, onTrimChange, onMove, onReorder };

  const startDrag = (type: typeof dragType, e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setDragType(type);
    setDragDx(0);
    refs.current = {
      startX: e.clientX,
      startTime: startTime,
      endTime: startTime + duration,
      trimStart: initTrimStart,
      trimEnd: initTrimEnd,
      offset: currentOffset,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - refs.current.startX;
      setDragDx(dx);
      const dt = pixelToTime(dx);

      if (type === 'resize-start' || type === 'resize-end') {
        if (trackType === 'subtitle') {
          let s = refs.current.startTime;
          let end = refs.current.endTime;
          if (type === 'resize-start') {
            s = Math.max(0, refs.current.startTime + dt);
            if (s >= end - 0.1) s = end - 0.1;
          } else {
            end = refs.current.endTime + dt;
            if (end <= s + 0.1) end = s + 0.1;
          }
          callbackRefs.current.onTimingChange?.(s, end);
        } else {
          let ts = refs.current.trimStart;
          let te = refs.current.trimEnd;
          if (type === 'resize-start') {
            ts = Math.max(0, refs.current.trimStart + dt);
          } else {
            te = Math.max(0, refs.current.trimEnd - dt);
          }
          callbackRefs.current.onTrimChange?.(ts, te);
        }
      } else if (type === 'move') {
        // Pass new relative offset directly
        const newOffset = Math.max(0, refs.current.offset + dt);
        callbackRefs.current.onMove?.(newOffset);
      }
      // reorder: visual only during drag, commit on mouseup
    };

    const handleMouseUp = (ev: MouseEvent) => {
      setDragType(null);
      setDragDx(0);

      if (type === 'reorder') {
        const dx2 = ev.clientX - refs.current.startX;
        const dt2 = pixelToTime(dx2);
        if (Math.abs(dt2) > duration * 0.25 && sceneIndex !== undefined) {
          const slots = Math.round(dt2 / Math.max(duration, 1));
          const toIndex = Math.max(0, sceneIndex + slots);
          if (toIndex !== sceneIndex) {
            callbackRefs.current.onReorder?.(sceneIndex, toIndex);
          }
        }
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleBodyMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (canMove) {
      startDrag('move', e);
    } else if (canReorder) {
      startDrag('reorder', e);
    }
  };

  // Visual offset during reorder drag
  const visualLeft = dragType === 'reorder' ? left + dragDx : left;

  const bodyCursor = canMove
    ? dragType === 'move'
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : canReorder
      ? dragType === 'reorder'
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : 'cursor-pointer';

  return (
    <div
      className={`absolute top-1 bottom-1 rounded border ${colors.bg} ${colors.border} ${
        isSelected ? 'ring-2 ring-violet-500 z-10' : ''
      } ${isDragging ? 'z-20' : ''} ${dragType === 'reorder' ? 'opacity-60' : ''} overflow-hidden select-none`}
      style={{ left: `${visualLeft}px`, width: `${width}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(trackType, id);
      }}
    >
      {/* Body (label + drag area) — full clip area, under resize handles */}
      <div
        className={`absolute inset-0 flex items-center px-2 text-[10px] leading-tight truncate ${colors.text} ${bodyCursor}`}
        onMouseDown={handleBodyMouseDown}
      >
        {label}
      </div>

      {/* Left resize handle — on top of body */}
      {canResize && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/40 ${
            dragType === 'resize-start' ? 'bg-white/40' : ''
          }`}
          onMouseDown={(e) => startDrag('resize-start', e)}
        />
      )}

      {/* Right resize handle — on top of body */}
      {canResize && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 hover:bg-white/40 ${
            dragType === 'resize-end' ? 'bg-white/40' : ''
          }`}
          onMouseDown={(e) => startDrag('resize-end', e)}
        />
      )}
    </div>
  );
}
