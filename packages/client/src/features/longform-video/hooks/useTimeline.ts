import { useState, useCallback, useMemo, useRef } from 'react';
import type { LongformProject, LongformScene, LongformSubtitleEntry } from '@tangobook/shared';

// ===== Types =====

export type TrackType = 'video' | 'sfx' | 'subtitle' | 'tts' | 'bgm';

interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTrack: TrackType | null;
}

interface TimelineActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  selectClip: (trackType: TrackType | null, clipId: string | null) => void;
  updateSubtitleTiming: (subtitleId: string, startTime: number, endTime: number) => void;
  updateSubtitleText: (subtitleId: string, text: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
  getSceneAtTime: (time: number) => LongformScene | null;
  timeToPixel: (time: number) => number;
  pixelToTime: (px: number) => number;
}

export interface UseTimelineReturn extends TimelineState, TimelineActions {
  totalDuration: number;
  pixelsPerSecond: number;
  setPixelsPerSecond: (pps: number) => void;
  animationRef: ReturnType<typeof useRef<number | null>>;
}

// ===== Constants =====

const DEFAULT_PPS = 40; // pixels per second

// ===== Hook =====

export function useTimeline(
  project: LongformProject,
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void
): UseTimelineReturn {
  const [state, setState] = useState<TimelineState>({
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null,
    selectedTrack: null,
  });
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PPS);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  // Compute total duration from scenes
  const totalDuration = useMemo(
    () => project.scenes.reduce((sum, s) => sum + s.clipDuration, 0),
    [project.scenes]
  );

  const play = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: true }));
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setState((prev) => {
        const next = prev.currentTime + dt;
        if (next >= totalDuration) {
          return { ...prev, currentTime: totalDuration, isPlaying: false };
        }
        return { ...prev, currentTime: next };
      });

      // Check if still playing (read from ref won't work, rely on next setState)
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  }, [totalDuration]);

  const pause = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const seek = useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(time, totalDuration));
      setState((prev) => ({ ...prev, currentTime: clamped }));
    },
    [totalDuration]
  );

  const selectClip = useCallback((trackType: TrackType | null, clipId: string | null) => {
    setState((prev) => ({ ...prev, selectedTrack: trackType, selectedClipId: clipId }));
  }, []);

  const updateSubtitleTiming = useCallback(
    (subtitleId: string, startTime: number, endTime: number) => {
      const updatedScenes = project.scenes.map((scene) => ({
        ...scene,
        subtitles: scene.subtitles.map((sub: LongformSubtitleEntry) =>
          sub.id === subtitleId ? { ...sub, startTime, endTime } : sub
        ),
      }));
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const updateSubtitleText = useCallback(
    (subtitleId: string, text: string) => {
      const updatedScenes = project.scenes.map((scene) => ({
        ...scene,
        subtitles: scene.subtitles.map((sub: LongformSubtitleEntry) =>
          sub.id === subtitleId ? { ...sub, text } : sub
        ),
      }));
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const reorderScenes = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newScenes = [...project.scenes];
      const [moved] = newScenes.splice(fromIndex, 1);
      newScenes.splice(toIndex, 0, moved);
      // Update order field
      const reordered = newScenes.map((s, i) => ({ ...s, order: i }));
      onUpdate({ scenes: reordered });
    },
    [project.scenes, onUpdate]
  );

  const getSceneAtTime = useCallback(
    (time: number): LongformScene | null => {
      let accumulated = 0;
      for (const scene of project.scenes) {
        if (time >= accumulated && time < accumulated + scene.clipDuration) {
          return scene;
        }
        accumulated += scene.clipDuration;
      }
      return project.scenes[project.scenes.length - 1] ?? null;
    },
    [project.scenes]
  );

  const timeToPixel = useCallback((time: number) => time * pixelsPerSecond, [pixelsPerSecond]);

  const pixelToTime = useCallback((px: number) => px / pixelsPerSecond, [pixelsPerSecond]);

  // Stop animation when isPlaying goes false
  // (handled in pause, but also safeguard)
  if (!state.isPlaying && animationRef.current) {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }

  return {
    ...state,
    totalDuration,
    pixelsPerSecond,
    setPixelsPerSecond,
    animationRef,
    play,
    pause,
    seek,
    selectClip,
    updateSubtitleTiming,
    updateSubtitleText,
    reorderScenes,
    getSceneAtTime,
    timeToPixel,
    pixelToTime,
  };
}
