import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import type { TrackType } from '../hooks/useTimeline';

interface TimelineClipProps {
  id: string;
  trackType: TrackType;
  label: string;
  startTime: number;
  duration: number;
  timeToPixel: (time: number) => number;
  pixelToTime: (px: number) => number;
  isSelected: boolean;
  onSelect: (trackType: TrackType, clipId: string) => void;
  onTimingChange?: (startTime: number, endTime: number) => void;
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
  timeToPixel,
  pixelToTime,
  isSelected,
  onSelect,
  onTimingChange,
}: TimelineClipProps) {
  const colors = TRACK_COLORS[trackType];
  const left = timeToPixel(startTime);
  const width = Math.max(timeToPixel(duration), 4); // min 4px
  const canResize = trackType === 'subtitle' && !!onTimingChange;

  const [resizing, setResizing] = useState<'start' | 'end' | null>(null);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);
  const dragEndTime = useRef(0);

  const handleMouseDown = useCallback(
    (edge: 'start' | 'end', e: ReactMouseEvent<HTMLDivElement>) => {
      if (!canResize) return;
      e.stopPropagation();
      setResizing(edge);
      dragStartX.current = e.clientX;
      dragStartTime.current = startTime;
      dragEndTime.current = startTime + duration;

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStartX.current;
        const dt = pixelToTime(dx);

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
      };

      const handleMouseUp = () => {
        setResizing(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [canResize, startTime, duration, pixelToTime, onTimingChange]
  );

  return (
    <div
      className={`absolute top-1 bottom-1 rounded border ${colors.bg} ${colors.border} ${
        isSelected ? 'ring-2 ring-violet-500 z-10' : ''
      } cursor-pointer overflow-hidden select-none`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(trackType, id);
      }}
    >
      {/* Left resize handle */}
      {canResize && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-sky-400/50 ${
            resizing === 'start' ? 'bg-sky-400/50' : ''
          }`}
          onMouseDown={(e) => handleMouseDown('start', e)}
        />
      )}

      {/* Label */}
      <div className={`px-1.5 text-[10px] leading-tight truncate ${colors.text} py-0.5`}>
        {label}
      </div>

      {/* Right resize handle */}
      {canResize && (
        <div
          className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-sky-400/50 ${
            resizing === 'end' ? 'bg-sky-400/50' : ''
          }`}
          onMouseDown={(e) => handleMouseDown('end', e)}
        />
      )}
    </div>
  );
}
