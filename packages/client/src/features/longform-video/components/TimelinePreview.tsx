import { useRef, useEffect, useMemo, useCallback } from 'react';
import type { LongformProject, LongformScene, LongformSubtitleStyle } from '@tangobook/shared';
import { getEffectiveDuration } from '../utils/timeline.utils';

interface TimelinePreviewProps {
  project: LongformProject;
  currentTime: number;
  isPlaying: boolean;
  getSceneAtTime: (time: number) => LongformScene | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getSceneLocalTime(scenes: LongformScene[], scene: LongformScene): number {
  let accumulated = 0;
  for (const s of scenes) {
    if (s.id === scene.id) return accumulated;
    accumulated += getEffectiveDuration(s);
  }
  return 0;
}

function getActiveSubtitle(scene: LongformScene, localTime: number): string | null {
  for (const sub of scene.subtitles) {
    if (localTime >= sub.startTime && localTime < sub.endTime) {
      return sub.text;
    }
  }
  return null;
}

function subtitlePositionClass(position: LongformSubtitleStyle['position']): string {
  switch (position) {
    case 'top':
      return 'top-4';
    case 'center':
      return 'top-1/2 -translate-y-1/2';
    case 'bottom':
    default:
      return 'bottom-4';
  }
}

function subtitleFontSize(size: LongformSubtitleStyle['fontSize']): number {
  if (typeof size === 'number') return size;
  return size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
}

export function TimelinePreview({
  project,
  currentTime,
  isPlaying,
  getSceneAtTime,
}: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sfxRef = useRef<HTMLAudioElement>(null);
  const ttsRef = useRef<HTMLAudioElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);

  // Track current src to avoid unnecessary reloads
  const currentSfxSrc = useRef<string | null>(null);
  const currentTtsSrc = useRef<string | null>(null);

  // Preload cache for next scene audio
  const preloadCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const currentScene = getSceneAtTime(currentTime);
  const currentClipUrl = currentScene?.clipUrl ?? null;
  const currentSfxUrl = currentScene?.sfxUrl ?? null;
  const currentTtsUrl = currentScene?.ttsUrl ?? null;

  // Calculate local time within current scene
  const localTime = useMemo(() => {
    if (!currentScene) return 0;
    const sceneStart = getSceneLocalTime(project.scenes, currentScene);
    return currentTime - sceneStart;
  }, [currentTime, currentScene, project.scenes]);

  const activeSubtitle = currentScene ? getActiveSubtitle(currentScene, localTime) : null;
  const { subtitleStyle } = project;

  // Preload next scene's TTS and SFX
  const preloadNextScene = useCallback(() => {
    if (!currentScene) return;
    const idx = project.scenes.findIndex((s) => s.id === currentScene.id);
    const nextScene = project.scenes[idx + 1];
    if (!nextScene) return;

    for (const url of [nextScene.ttsUrl, nextScene.sfxUrl]) {
      if (url && !preloadCache.current.has(url)) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        preloadCache.current.set(url, audio);
      }
    }
  }, [currentScene, project.scenes]);

  useEffect(() => {
    preloadNextScene();
  }, [preloadNextScene]);

  // Update SFX src imperatively (avoid unmount/remount)
  useEffect(() => {
    const sfx = sfxRef.current;
    if (!sfx) return;
    if (currentSfxSrc.current !== currentSfxUrl) {
      currentSfxSrc.current = currentSfxUrl;
      if (currentSfxUrl) {
        sfx.src = currentSfxUrl;
        sfx.load();
      } else {
        sfx.removeAttribute('src');
        sfx.pause();
      }
    }
  }, [currentSfxUrl]);

  // Update TTS src imperatively (avoid unmount/remount)
  useEffect(() => {
    const tts = ttsRef.current;
    if (!tts) return;
    if (currentTtsSrc.current !== currentTtsUrl) {
      currentTtsSrc.current = currentTtsUrl;
      if (currentTtsUrl) {
        tts.src = currentTtsUrl;
        tts.load();
      } else {
        tts.removeAttribute('src');
        tts.pause();
      }
    }
  }, [currentTtsUrl]);

  // Sync video + SFX + TTS with playback
  // TTS starts 0.5s after scene transition for natural pacing
  const TTS_DELAY = 0.5;

  useEffect(() => {
    const video = videoRef.current;
    const sfx = sfxRef.current;
    const tts = ttsRef.current;
    if (!video || !currentClipUrl) return;

    if (isPlaying) {
      if (Math.abs(video.currentTime - localTime) > 0.3) {
        video.currentTime = localTime;
      }
      if (sfx?.src && Math.abs(sfx.currentTime - localTime) > 0.3) {
        sfx.currentTime = localTime;
      }
      video.play().catch(() => {});
      if (sfx?.src) sfx.play().catch(() => {});

      // TTS: delay by TTS_DELAY after scene start
      if (tts?.src) {
        const ttsTime = localTime - TTS_DELAY;
        if (ttsTime >= 0) {
          if (Math.abs(tts.currentTime - ttsTime) > 0.3) {
            tts.currentTime = ttsTime;
          }
          tts.play().catch(() => {});
        } else {
          tts.pause();
          tts.currentTime = 0;
        }
      }
    } else {
      video.pause();
      sfx?.pause();
      tts?.pause();
      video.currentTime = localTime;
      if (sfx?.src) sfx.currentTime = localTime;
      if (tts?.src) tts.currentTime = Math.max(0, localTime - TTS_DELAY);
    }
  }, [isPlaying, currentClipUrl, localTime]);

  // Sync BGM playback
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    bgm.volume = (project.bgmVolume ?? 30) / 100;

    if (isPlaying) {
      if (Math.abs(bgm.currentTime - currentTime) > 0.5) {
        bgm.currentTime = currentTime;
      }
      bgm.play().catch(() => {});
    } else {
      bgm.pause();
      bgm.currentTime = currentTime;
    }
  }, [isPlaying, project.bgmUrl, project.bgmVolume, currentTime]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {currentClipUrl ? (
        <video ref={videoRef} src={currentClipUrl} className="w-full h-full object-contain" muted />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
          클립이 없습니다
        </div>
      )}

      {/* Persistent audio elements (never unmount) */}
      <audio ref={sfxRef} preload="auto" />
      <audio ref={ttsRef} preload="auto" />
      {project.bgmUrl && <audio ref={bgmRef} src={project.bgmUrl} preload="auto" loop />}

      {/* Subtitle overlay */}
      {activeSubtitle && (
        <div
          className={`absolute left-0 right-0 flex justify-center px-4 ${subtitlePositionClass(subtitleStyle.position)}`}
        >
          <span
            className="inline-block px-3 py-1.5 rounded font-medium"
            style={{
              fontSize: `${subtitleFontSize(subtitleStyle.fontSize)}px`,
              color: subtitleStyle.textColor,
              backgroundColor: subtitleStyle.bgColor,
              WebkitTextStroke: `1px ${subtitleStyle.outlineColor}`,
              paintOrder: 'stroke fill',
            }}
          >
            {activeSubtitle}
          </span>
        </div>
      )}

      {/* Time overlay */}
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
        {formatTime(currentTime)}
      </div>
    </div>
  );
}
