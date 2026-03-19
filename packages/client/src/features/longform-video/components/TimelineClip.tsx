import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
  onTimingChange?: (startTime: number, endTime: number) => void;
  onTrimChange?: (trimStart: number, trimEnd: number) => void;
  onMove?: (newOffset: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Original trim values for drag delta calculation */
  trimStart?: number;
  trimEnd?: number;
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
}: TimelineClipProps) {
  const colors = TRACK_COLORS[trackType];
  const left = timeToPixel(startTime);
  const width = Math.max(timeToPixel(duration), 4);

  const canResize =
    (trackType === 'subtitle' && !!onTimingChange) ||
    ((trackType === 'video' || trackType === 'sfx') && !!onTrimChange);
  const canMove = (trackType === 'sfx' || trackType === 'tts') && !!onMove;
  const canReorder = trackType === 'video' && !!onReorder && sceneIndex !== undefined;

  const [dragState, setDragState] = useState<
    'resize-start' | 'resize-end' | 'move' | 'reorder' | null
  >(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragEndTime = useRef(0);
  const dragTrimStart = useRef(0);
  const dragTrimEnd = useRef(0);
  const dragOffset = useRef(0);

  // ----- Resize (edges) -----
  const handleResizeMouseDown = useCallback(
    (edge: 'start' | 'end', e: ReactMouseEvent<HTMLDivElement>) => {
      if (!canResize) return;
      e.stopPropagation();
      e.preventDefault();
      setDragState(edge === 'start' ? 'resize-start' : 'resize-end');
      dragStartX.current = e.clientX;
      dragStartTime.current = startTime;
      dragEndTime.current = startTime + duration;
      dragTrimStart.current = initTrimStart;
      dragTrimEnd.current = initTrimEnd;

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStartX.current;
        const dt = pixelToTime(dx);

        if (trackType === 'subtitle') {
          // Subtitle: adjust start/end timing
          let newStart = dragStartTime.current;
          let newEnd = dragEndTime.current;
          if (edge === 'start') {
            newStart = Math.max(0, dragStartTime.current + dt);
            if (newStart >= newEnd - 0.1) newStart = newEnd - 0.1;
          } else {
            newEnd = dragEndTime.current + dt;
            if (newEnd <= newStart + 0.1) newEnd = newStart + 0.1;
          }
          onTimingChange?.(newStart, newEnd);
        } else {
          // Video/SFX: adjust trim
          let newTrimStart = dragTrimStart.current;
          let newTrimEnd = dragTrimEnd.current;
          if (edge === 'start') {
            newTrimStart = Math.max(0, dragTrimStart.current + dt);
          } else {
            newTrimEnd = Math.max(0, dragTrimEnd.current - dt);
          }
          onTrimChange?.(newTrimStart, newTrimEnd);
        }
      };

      const handleMouseUp = () => {
        setDragState(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [
      canResize,
      trackType,
      startTime,
      duration,
      initTrimStart,
      initTrimEnd,
      pixelToTime,
      onTimingChange,
      onTrimChange,
    ]
  );

  // ----- Move (horizontal drag for SFX/TTS offset) -----
  const handleMoveMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!canMove) return;
      e.stopPropagation();
      e.preventDefault();
      setDragState('move');
      dragStartX.current = e.clientX;
      dragOffset.current = startTime; // current absolute position

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStartX.current;
        const dt = pixelToTime(dx);
        const newOffset = Math.max(0, dragOffset.current + dt);
        onMove?.(newOffset);
      };

      const handleMouseUp = () => {
        setDragState(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [canMove, startTime, pixelToTime, onMove]
  );

  // ----- Reorder (drag video clips to reorder scenes) -----
  const handleReorderMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!canReorder) return;
      e.stopPropagation();
      e.preventDefault();
      setDragState('reorder');
      dragStartX.current = e.clientX;

      const handleMouseMove = () => {
        // Visual feedback is handled via dragState
      };

      const handleMouseUp = (ev: MouseEvent) => {
        setDragState(null);
        const dx = ev.clientX - dragStartX.current;
        const dt = pixelToTime(dx);
        // Calculate how many scene slots we moved
        const direction = dt > 0 ? 1 : -1;
        // If moved more than half the clip width, trigger reorder
        if (Math.abs(dt) > duration * 0.3) {
          const toIndex = Math.max(0, sceneIndex! + direction);
          if (toIndex !== sceneIndex) {
            onReorder?.(sceneIndex!, toIndex);
          }
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [canReorder, sceneIndex, duration, pixelToTime, onReorder]
  );

  const handleBodyMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (canMove) {
      handleMoveMouseDown(e);
    } else if (canReorder) {
      handleReorderMouseDown(e);
    }
  };

  const bodyCursor = canMove
    ? dragState === 'move'
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : canReorder
      ? dragState === 'reorder'
        ? 'cursor-grabbing'
        : 'cursor-grab'
      : 'cursor-pointer';

  return (
    <div
      className={`absolute top-1 bottom-1 rounded border ${colors.bg} ${colors.border} ${
        isSelected ? 'ring-2 ring-violet-500 z-10' : ''
      } ${dragState === 'reorder' ? 'opacity-50' : ''} overflow-hidden select-none`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(trackType, id);
      }}
    >
      {/* Left resize handle */}
      {canResize && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-white/30 ${
            dragState === 'resize-start' ? 'bg-white/30' : ''
          }`}
          onMouseDown={(e) => handleResizeMouseDown('start', e)}
        />
      )}

      {/* Body (label + drag area) */}
      <div
        className={`px-1.5 text-[10px] leading-tight truncate ${colors.text} py-0.5 h-full ${bodyCursor}`}
        onMouseDown={handleBodyMouseDown}
      >
        {label}
      </div>

      {/* Right resize handle */}
      {canResize && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-white/30 ${
            dragState === 'resize-end' ? 'bg-white/30' : ''
          }`}
          onMouseDown={(e) => handleResizeMouseDown('end', e)}
        />
      )}
    </div>
  );
}
