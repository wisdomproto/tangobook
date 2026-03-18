import { useRef, useEffect, useMemo } from 'react';
import type { LongformProject, LongformScene, LongformSubtitleStyle } from '@tangobook/shared';

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
    accumulated += s.clipDuration;
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

function subtitleFontSizeClass(size: LongformSubtitleStyle['fontSize']): string {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'lg':
      return 'text-xl';
    case 'md':
    default:
      return 'text-base';
  }
}

export function TimelinePreview({
  project,
  currentTime,
  isPlaying,
  getSceneAtTime,
}: TimelinePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentScene = getSceneAtTime(currentTime);
  const currentClipUrl = currentScene?.clipUrl ?? null;

  // Calculate local time within current scene
  const localTime = useMemo(() => {
    if (!currentScene) return 0;
    const sceneStart = getSceneLocalTime(project.scenes, currentScene);
    return currentTime - sceneStart;
  }, [currentTime, currentScene, project.scenes]);

  const activeSubtitle = currentScene ? getActiveSubtitle(currentScene, localTime) : null;
  const { subtitleStyle } = project;

  // Sync video element with playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClipUrl) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, currentClipUrl]);

  // Seek video to local time when not playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClipUrl || isPlaying) return;
    video.currentTime = localTime;
  }, [localTime, currentClipUrl, isPlaying]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {currentClipUrl ? (
        <video ref={videoRef} src={currentClipUrl} className="w-full h-full object-contain" muted />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
          클립이 없습니다
        </div>
      )}

      {/* Subtitle overlay */}
      {activeSubtitle && (
        <div
          className={`absolute left-0 right-0 flex justify-center px-4 ${subtitlePositionClass(subtitleStyle.position)}`}
        >
          <span
            className={`inline-block px-3 py-1.5 rounded ${subtitleFontSizeClass(subtitleStyle.fontSize)} font-medium`}
            style={{
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
