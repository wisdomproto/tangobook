import type { LongformProject, LongformScene } from '@tangobook/shared';
import type { TrackType } from '../hooks/useTimeline';
import { TimelineClip } from './TimelineClip';

interface TimelineTrackProps {
  trackType: TrackType;
  project: LongformProject;
  totalDuration: number;
  timeToPixel: (time: number) => number;
  pixelToTime: (px: number) => number;
  selectedClipId: string | null;
  selectedTrack: TrackType | null;
  onSelectClip: (trackType: TrackType | null, clipId: string | null) => void;
  onSubtitleTimingChange?: (subtitleId: string, startTime: number, endTime: number) => void;
}

const TRACK_LABELS: Record<TrackType, string> = {
  video: '영상',
  sfx: '효과음',
  subtitle: '자막',
  tts: 'TTS',
  bgm: 'BGM',
};

function getSceneStartTime(scenes: LongformScene[], index: number): number {
  let t = 0;
  for (let i = 0; i < index; i++) {
    t += scenes[i].clipDuration;
  }
  return t;
}

export function TimelineTrack({
  trackType,
  project,
  totalDuration,
  timeToPixel,
  pixelToTime,
  selectedClipId,
  selectedTrack,
  onSelectClip,
  onSubtitleTimingChange,
}: TimelineTrackProps) {
  const totalWidth = timeToPixel(totalDuration);
  const clips = buildClips(trackType, project);

  return (
    <div className="flex items-stretch border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      {/* Track label */}
      <div className="w-16 flex-shrink-0 flex items-center justify-center text-[11px] font-medium text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {TRACK_LABELS[trackType]}
      </div>

      {/* Track content */}
      <div
        className="relative h-8 flex-1"
        style={{ minWidth: `${totalWidth}px` }}
        onClick={() => onSelectClip(null, null)}
      >
        {clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            id={clip.id}
            trackType={trackType}
            label={clip.label}
            startTime={clip.startTime}
            duration={clip.duration}
            timeToPixel={timeToPixel}
            pixelToTime={pixelToTime}
            isSelected={selectedTrack === trackType && selectedClipId === clip.id}
            onSelect={onSelectClip}
            onTimingChange={
              trackType === 'subtitle' && onSubtitleTimingChange
                ? (start, end) => onSubtitleTimingChange(clip.id, start, end)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

// ===== Clip data builders =====

interface ClipData {
  id: string;
  label: string;
  startTime: number;
  duration: number;
}

function buildClips(trackType: TrackType, project: LongformProject): ClipData[] {
  const { scenes } = project;

  switch (trackType) {
    case 'video':
      return scenes.map((scene, i) => ({
        id: scene.id,
        label: `장면 ${i + 1}`,
        startTime: getSceneStartTime(scenes, i),
        duration: scene.clipDuration,
      }));

    case 'sfx':
      return scenes
        .filter((s) => s.sfxUrl)
        .map((scene, _i) => {
          const idx = scenes.indexOf(scene);
          return {
            id: `sfx-${scene.id}`,
            label: `SFX ${idx + 1}`,
            startTime: getSceneStartTime(scenes, idx),
            duration: scene.clipDuration,
          };
        });

    case 'subtitle':
      return scenes.flatMap((scene) => {
        const sceneStart = getSceneStartTime(scenes, scenes.indexOf(scene));
        return scene.subtitles.map((sub) => ({
          id: sub.id,
          label: sub.text.slice(0, 20),
          startTime: sceneStart + sub.startTime,
          duration: sub.endTime - sub.startTime,
        }));
      });

    case 'tts':
      return scenes
        .filter((s) => s.ttsUrl)
        .map((scene) => {
          const idx = scenes.indexOf(scene);
          return {
            id: `tts-${scene.id}`,
            label: `TTS ${idx + 1}`,
            startTime: getSceneStartTime(scenes, idx),
            duration: scene.ttsDuration ?? scene.clipDuration,
          };
        });

    case 'bgm':
      if (!project.bgmUrl) return [];
      return [
        {
          id: 'bgm',
          label: 'BGM',
          startTime: 0,
          duration: scenes.reduce((sum, s) => sum + s.clipDuration, 0),
        },
      ];

    default:
      return [];
  }
}
