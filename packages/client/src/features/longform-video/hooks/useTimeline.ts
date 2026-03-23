import { useState, useCallback, useMemo, useRef } from 'react';
import type { LongformProject, LongformScene, LongformSubtitleEntry } from '@tangobook/shared';
import { getEffectiveDuration } from '../utils/timeline.utils';

// ===== Types =====

export type TrackType = 'video' | 'sfx' | 'subtitle' | 'tts' | 'bgm';

interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTrack: TrackType | null;
}

// ===== Constants =====

const DEFAULT_PPS = 40; // pixels per second
const MIN_CLIP_DURATION = 1; // seconds

// ===== Hook =====

export function useTimeline(
  project: LongformProject,
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void
) {
  const [state, setState] = useState<TimelineState>({
    currentTime: 0,
    isPlaying: false,
    selectedClipId: null,
    selectedTrack: null,
  });
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PPS);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  // Compute total duration from scenes (using effective duration)
  const totalDuration = useMemo(
    () => project.scenes.reduce((sum, s) => sum + getEffectiveDuration(s), 0),
    [project.scenes]
  );

  const play = useCallback(() => {
    isPlayingRef.current = true;
    setState((prev) => ({ ...prev, isPlaying: true }));
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (!isPlayingRef.current) {
        animationRef.current = null;
        return;
      }

      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setState((prev) => {
        const next = prev.currentTime + dt;
        if (next >= totalDuration) {
          isPlayingRef.current = false;
          return { ...prev, currentTime: totalDuration, isPlaying: false };
        }
        return { ...prev, currentTime: next };
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  }, [totalDuration]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
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

  // ----- Scene trim (Phase 1) -----
  const updateSceneTrim = useCallback(
    (sceneId: string, trimStart: number, trimEnd: number) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        const ts = Math.max(0, trimStart);
        const te = Math.max(0, trimEnd);
        // Ensure effective duration stays >= MIN_CLIP_DURATION
        if (s.clipDuration - ts - te < MIN_CLIP_DURATION) return s;
        return { ...s, trimStart: ts, trimEnd: te };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // ----- Clip duration (Phase 2) -----
  const updateClipDuration = useCallback(
    (sceneId: string, newDuration: number) => {
      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId ? { ...s, clipDuration: Math.max(MIN_CLIP_DURATION, newDuration) } : s
      );
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // ----- SFX/TTS offset (Phase 3) -----
  const updateSfxOffset = useCallback(
    (sceneId: string, offset: number) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        const maxOffset = getEffectiveDuration(s);
        return { ...s, sfxOffset: Math.max(0, Math.min(offset, maxOffset)) };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const updateTtsOffset = useCallback(
    (sceneId: string, offset: number) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        const maxOffset = getEffectiveDuration(s);
        return { ...s, ttsOffset: Math.max(0, Math.min(offset, maxOffset)) };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // ----- Subtitle timing/text -----
  const updateSubtitleTiming = useCallback(
    (subtitleId: string, startTime: number, endTime: number) => {
      const updatedScenes = project.scenes.map((scene) => {
        const hasSubtitle = scene.subtitles.some((s: LongformSubtitleEntry) => s.id === subtitleId);
        if (!hasSubtitle) return scene;
        // Clamp within scene bounds
        const sceneDur = getEffectiveDuration(scene);
        const clampedStart = Math.max(0, Math.min(startTime, sceneDur));
        const clampedEnd = Math.max(clampedStart + 0.1, Math.min(endTime, sceneDur));
        return {
          ...scene,
          subtitles: scene.subtitles.map((sub: LongformSubtitleEntry) =>
            sub.id === subtitleId ? { ...sub, startTime: clampedStart, endTime: clampedEnd } : sub
          ),
        };
      });
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

  // Add new subtitle to a scene
  const addSubtitle = useCallback(
    (sceneId: string, startTime: number, endTime: number, text = '') => {
      const newSub: LongformSubtitleEntry = {
        id: crypto.randomUUID(),
        text,
        startTime,
        endTime,
      };
      const updatedScenes = project.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              subtitles: [...scene.subtitles, newSub].sort((a, b) => a.startTime - b.startTime),
            }
          : scene
      );
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // Delete a subtitle
  const deleteSubtitle = useCallback(
    (subtitleId: string) => {
      const updatedScenes = project.scenes.map((scene) => ({
        ...scene,
        subtitles: scene.subtitles.filter((sub: LongformSubtitleEntry) => sub.id !== subtitleId),
      }));
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // Merge two adjacent subtitles (combine text, extend time range)
  const mergeSubtitles = useCallback(
    (subtitleIdA: string, subtitleIdB: string) => {
      const updatedScenes = project.scenes.map((scene) => {
        const a = scene.subtitles.find((s: LongformSubtitleEntry) => s.id === subtitleIdA);
        const b = scene.subtitles.find((s: LongformSubtitleEntry) => s.id === subtitleIdB);
        if (!a || !b) return scene;

        const merged: LongformSubtitleEntry = {
          id: a.id,
          text: `${a.text} ${b.text}`.trim(),
          startTime: Math.min(a.startTime, b.startTime),
          endTime: Math.max(a.endTime, b.endTime),
        };
        return {
          ...scene,
          subtitles: scene.subtitles
            .filter((s: LongformSubtitleEntry) => s.id !== subtitleIdB)
            .map((s: LongformSubtitleEntry) => (s.id === subtitleIdA ? merged : s)),
        };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // Split a subtitle at a given local time
  const splitSubtitle = useCallback(
    (subtitleId: string, splitTime: number) => {
      const updatedScenes = project.scenes.map((scene) => {
        const sub = scene.subtitles.find((s: LongformSubtitleEntry) => s.id === subtitleId);
        if (!sub || splitTime <= sub.startTime || splitTime >= sub.endTime) return scene;

        const subA: LongformSubtitleEntry = {
          id: sub.id,
          text: sub.text,
          startTime: sub.startTime,
          endTime: splitTime,
        };
        const subB: LongformSubtitleEntry = {
          id: crypto.randomUUID(),
          text: '',
          startTime: splitTime,
          endTime: sub.endTime,
        };
        return {
          ...scene,
          subtitles: scene.subtitles
            .map((s: LongformSubtitleEntry) => (s.id === subtitleId ? subA : s))
            .concat(subB)
            .sort(
              (a: LongformSubtitleEntry, b: LongformSubtitleEntry) => a.startTime - b.startTime
            ),
        };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  // ----- Scene reorder (Phase 4) -----
  const reorderScenes = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newScenes = [...project.scenes];
      const [moved] = newScenes.splice(fromIndex, 1);
      newScenes.splice(toIndex, 0, moved);
      const reordered = newScenes.map((s, i) => ({ ...s, order: i }));
      onUpdate({ scenes: reordered });
    },
    [project.scenes, onUpdate]
  );

  // ----- Scene split (Phase 5) -----
  const splitScene = useCallback(
    (sceneId: string, splitTimeGlobal: number) => {
      const sceneIndex = project.scenes.findIndex((s) => s.id === sceneId);
      if (sceneIndex < 0) return;
      const scene = project.scenes[sceneIndex];

      // Calculate local split time within the scene
      let sceneStart = 0;
      for (let i = 0; i < sceneIndex; i++) {
        sceneStart += getEffectiveDuration(project.scenes[i]);
      }
      const localSplit = splitTimeGlobal - sceneStart;
      const effDuration = getEffectiveDuration(scene);
      if (localSplit <= 0.5 || localSplit >= effDuration - 0.5) return; // too close to edges

      const trimS = scene.trimStart ?? 0;

      const sceneA: LongformScene = {
        ...scene,
        id: crypto.randomUUID(),
        trimEnd: scene.clipDuration - trimS - localSplit,
        subtitles: scene.subtitles
          .filter((sub) => sub.startTime < localSplit)
          .map((sub) => ({ ...sub, endTime: Math.min(sub.endTime, localSplit) })),
      };

      const sceneB: LongformScene = {
        ...scene,
        id: crypto.randomUUID(),
        trimStart: trimS + localSplit,
        subtitles: scene.subtitles
          .filter((sub) => sub.endTime > localSplit)
          .map((sub) => ({
            ...sub,
            id: crypto.randomUUID(),
            startTime: Math.max(0, sub.startTime - localSplit),
            endTime: sub.endTime - localSplit,
          })),
      };

      const newScenes = [...project.scenes];
      newScenes.splice(sceneIndex, 1, sceneA, sceneB);
      const reordered = newScenes.map((s, i) => ({ ...s, order: i }));
      onUpdate({ scenes: reordered });
    },
    [project.scenes, onUpdate]
  );

  // ----- Queries -----
  const getSceneAtTime = useCallback(
    (time: number): LongformScene | null => {
      let accumulated = 0;
      for (const scene of project.scenes) {
        const eff = getEffectiveDuration(scene);
        if (time >= accumulated && time < accumulated + eff) {
          return scene;
        }
        accumulated += eff;
      }
      return project.scenes[project.scenes.length - 1] ?? null;
    },
    [project.scenes]
  );

  // ----- Reset timeline edits -----
  // Accepts optional rebuilt scenes from the caller (for full reset with subtitle regeneration)
  const resetTimeline = useCallback(
    (rebuiltScenes?: LongformScene[]) => {
      const scenesToUse = rebuiltScenes ?? project.scenes;
      const updatedScenes = scenesToUse.map((s) => {
        const cleaned = { ...s };
        delete cleaned.trimStart;
        delete cleaned.trimEnd;
        delete cleaned.sfxOffset;
        delete cleaned.ttsOffset;
        return cleaned;
      });
      onUpdate({ scenes: updatedScenes });
      setState((prev) => ({ ...prev, currentTime: 0, selectedClipId: null, selectedTrack: null }));
    },
    [project.scenes, onUpdate]
  );

  const timeToPixel = useCallback((time: number) => time * pixelsPerSecond, [pixelsPerSecond]);
  const pixelToTime = useCallback((px: number) => px / pixelsPerSecond, [pixelsPerSecond]);

  // Stop animation when isPlaying goes false (safeguard)
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
    updateSceneTrim,
    updateClipDuration,
    updateSfxOffset,
    updateTtsOffset,
    updateSubtitleTiming,
    updateSubtitleText,
    addSubtitle,
    deleteSubtitle,
    mergeSubtitles,
    splitSubtitle,
    reorderScenes,
    splitScene,
    resetTimeline,
    getSceneAtTime,
    timeToPixel,
    pixelToTime,
  };
}
