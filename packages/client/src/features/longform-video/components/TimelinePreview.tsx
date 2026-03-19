import { useRef, useEffect, useMemo } from 'react';
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
  // Legacy fallback for old string values
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
  const bgmRef = useRef<HTMLAudioElement>(null);
  const currentScene = getSceneAtTime(currentTime);
  const currentClipUrl = currentScene?.clipUrl ?? null;
  const currentSfxUrl = currentScene?.sfxUrl ?? null;

  // Calculate local time within current scene
  const localTime = useMemo(() => {
    if (!currentScene) return 0;
    const sceneStart = getSceneLocalTime(project.scenes, currentScene);
    return currentTime - sceneStart;
  }, [currentTime, currentScene, project.scenes]);

  const activeSubtitle = currentScene ? getActiveSubtitle(currentScene, localTime) : null;
  const { subtitleStyle } = project;

  // Sync video + SFX with playback state and keep in sync during playback
  useEffect(() => {
    const video = videoRef.current;
    const sfx = sfxRef.current;
    if (!video || !currentClipUrl) return;

    if (isPlaying) {
      // Correct drift: if video is off by more than 0.3s, re-sync
      if (Math.abs(video.currentTime - localTime) > 0.3) {
        video.currentTime = localTime;
      }
      if (sfx && Math.abs(sfx.currentTime - localTime) > 0.3) {
        sfx.currentTime = localTime;
      }
      video.play().catch(() => {});
      sfx?.play().catch(() => {});
    } else {
      video.pause();
      sfx?.pause();
      video.currentTime = localTime;
      if (sfx) sfx.currentTime = localTime;
    }
  }, [isPlaying, currentClipUrl, localTime]);

  // Sync BGM playback
  useEffect(() => {
    const bgm = bgmRef.current;
    if (!bgm) return;

    bgm.volume = (project.bgmVolume ?? 30) / 100;

    if (isPlaying) {
      // Only seek BGM if drifted
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

      {/* SFX audio (separate from video) */}
      {currentSfxUrl && <audio ref={sfxRef} src={currentSfxUrl} preload="auto" />}

      {/* BGM audio */}
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
