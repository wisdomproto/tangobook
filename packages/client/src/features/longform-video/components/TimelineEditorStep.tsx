import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import type { Storybook, LongformProject } from '@tangobook/shared';
import { useTimeline, type TrackType } from '../hooks/useTimeline';
import { TimelinePreview } from './TimelinePreview';
import { TimelineControls } from './TimelineControls';
import { TimelineTrack } from './TimelineTrack';
import { SubtitleStyleModal } from './SubtitleStyleModal';
import { longformApi } from '../api/longform.api';
import { settingsApi, type BgmItem } from '@/features/settings/api/settings.api';

interface TimelineEditorStepProps {
  storybook: Storybook;
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
}

const TRACK_ORDER: TrackType[] = ['video', 'sfx', 'subtitle', 'tts', 'bgm'];

export function TimelineEditorStep({ storybook, project, onUpdate }: TimelineEditorStepProps) {
  const timeline = useTimeline(project, onUpdate);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [isUploadingBgm, setIsUploadingBgm] = useState(false);
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const [showBgmPicker, setShowBgmPicker] = useState(false);
  const [bgmLibrary, setBgmLibrary] = useState<BgmItem[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    settingsApi
      .getBgmList()
      .then(setBgmLibrary)
      .catch(() => {});
  }, []);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewingId(null);
  }, []);

  const togglePreview = useCallback(
    (item: BgmItem) => {
      if (previewingId === item.id) {
        stopPreview();
        return;
      }
      stopPreview();
      const audio = new Audio(item.url);
      audio.loop = true;
      audio.play().catch(() => {});
      previewAudioRef.current = audio;
      setPreviewingId(item.id);
    },
    [previewingId, stopPreview]
  );

  const handleBgmSelect = useCallback(
    (item: BgmItem) => {
      onUpdate({ bgmUrl: item.url });
      stopPreview();
      setShowBgmPicker(false);
    },
    [onUpdate, stopPreview]
  );

  const handleSubtitleTimingChange = useCallback(
    (subtitleId: string, startTime: number, endTime: number) => {
      timeline.updateSubtitleTiming(subtitleId, startTime, endTime);
    },
    [timeline]
  );

  const handleTrimChange = useCallback(
    (sceneId: string, trimStart: number, trimEnd: number) => {
      timeline.updateSceneTrim(sceneId, trimStart, trimEnd);
    },
    [timeline]
  );

  const handleMoveOffset = useCallback(
    (sceneId: string, offset: number) => {
      // Determine if SFX or TTS based on selected track
      if (timeline.selectedTrack === 'tts') {
        timeline.updateTtsOffset(sceneId, offset);
      } else {
        timeline.updateSfxOffset(sceneId, offset);
      }
    },
    [timeline]
  );

  const handleBgmUpload = async (file: File) => {
    setIsUploadingBgm(true);
    try {
      const formData = new FormData();
      formData.append('bgm', file);
      formData.append('storybookId', storybook.id);
      formData.append('projectId', project.id);
      const result = await longformApi.uploadBgm(formData);
      onUpdate({ bgmUrl: result.bgmUrl });
    } catch {
      // silently fail — user can retry
    } finally {
      setIsUploadingBgm(false);
    }
  };

  const handleBgmFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleBgmUpload(file);
    e.target.value = '';
  };

  const hasScenes = project.scenes.length > 0;

  if (!hasScenes) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500">
        <svg
          className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          />
        </svg>
        <p className="text-sm">분석된 씬이 없습니다.</p>
        <p className="text-xs mt-1">Step 1에서 시작하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <TimelinePreview
        project={project}
        currentTime={timeline.currentTime}
        isPlaying={timeline.isPlaying}
        getSceneAtTime={timeline.getSceneAtTime}
      />

      {/* Controls */}
      <TimelineControls
        isPlaying={timeline.isPlaying}
        currentTime={timeline.currentTime}
        totalDuration={timeline.totalDuration}
        onPlay={timeline.play}
        onPause={timeline.pause}
        onSeek={timeline.seek}
        onOpenSubtitleStyle={() => setShowSubtitleModal(true)}
        canSplit={!!timeline.getSceneAtTime(timeline.currentTime)}
        onSplit={() => {
          const scene = timeline.getSceneAtTime(timeline.currentTime);
          if (scene) timeline.splitScene(scene.id, timeline.currentTime);
        }}
      />

      {/* Timeline tracks */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="relative overflow-x-auto">
          {TRACK_ORDER.map((trackType) => (
            <TimelineTrack
              key={trackType}
              trackType={trackType}
              project={project}
              totalDuration={timeline.totalDuration}
              timeToPixel={timeline.timeToPixel}
              pixelToTime={timeline.pixelToTime}
              selectedClipId={timeline.selectedClipId}
              selectedTrack={timeline.selectedTrack}
              onSelectClip={timeline.selectClip}
              onSubtitleTimingChange={
                trackType === 'subtitle' ? handleSubtitleTimingChange : undefined
              }
              onTrimChange={
                trackType === 'video' || trackType === 'sfx' ? handleTrimChange : undefined
              }
              onMoveOffset={
                trackType === 'sfx' || trackType === 'tts' ? handleMoveOffset : undefined
              }
              onReorder={trackType === 'video' ? timeline.reorderScenes : undefined}
            />
          ))}

          {/* Playhead — stays within tracks area only */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
            style={{ left: `calc(${timeline.timeToPixel(timeline.currentTime)}px + 4rem)` }}
          />
        </div>
      </div>

      {/* Bottom panel: selected clip editing + BGM controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Selected subtitle editing */}
        {timeline.selectedTrack === 'subtitle' && timeline.selectedClipId && (
          <SelectedSubtitleEditor
            project={project}
            subtitleId={timeline.selectedClipId}
            onUpdateText={timeline.updateSubtitleText}
          />
        )}

        {/* BGM controls */}
        <div className="flex items-center gap-2 ml-auto relative">
          {project.bgmUrl ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400">BGM</span>
              <input
                type="range"
                min={0}
                max={100}
                value={project.bgmVolume}
                onChange={(e) => onUpdate({ bgmVolume: parseInt(e.target.value) })}
                className="w-20 h-1 accent-rose-500"
              />
              <span className="text-xs text-slate-500 w-8">{project.bgmVolume}%</span>
              <button
                onClick={() => {
                  onUpdate({ bgmUrl: undefined, bgmVolume: 30 });
                  stopPreview();
                }}
                className="text-xs text-red-500 hover:text-red-600"
              >
                삭제
              </button>
              <button
                onClick={() => setShowBgmPicker((v) => !v)}
                className="text-xs text-slate-500 hover:text-violet-600"
              >
                변경
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBgmPicker((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-rose-400 hover:text-rose-600 transition-colors"
              >
                BGM 선택
              </button>
              <button
                onClick={() => bgmInputRef.current?.click()}
                disabled={isUploadingBgm}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                {isUploadingBgm ? '업로드 중...' : '파일 업로드'}
              </button>
            </div>
          )}
          <input
            ref={bgmInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleBgmFileChange}
          />

          {/* BGM Library Picker */}
          {showBgmPicker && bgmLibrary.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  배경음악 라이브러리
                </span>
                <button
                  onClick={() => {
                    setShowBgmPicker(false);
                    stopPreview();
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-1.5 space-y-1">
                {bgmLibrary.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors ${
                      project.bgmUrl === item.url
                        ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <button
                      onClick={() => togglePreview(item)}
                      className="p-0.5 text-slate-400 hover:text-violet-600 shrink-0"
                    >
                      {previewingId === item.id ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </button>
                    <span className="flex-1 text-xs text-slate-700 dark:text-slate-200 truncate">
                      {item.title}
                    </span>
                    {project.bgmUrl === item.url ? (
                      <span className="text-[10px] text-violet-600 font-medium shrink-0">
                        사용 중
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBgmSelect(item)}
                        className="px-2 py-0.5 text-[10px] bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors shrink-0"
                      >
                        선택
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtitle style modal */}
      {showSubtitleModal && (
        <SubtitleStyleModal
          style={project.subtitleStyle}
          onSave={(style) => onUpdate({ subtitleStyle: style })}
          onClose={() => setShowSubtitleModal(false)}
        />
      )}
    </div>
  );
}

// ===== Selected subtitle editor =====

function SelectedSubtitleEditor({
  project,
  subtitleId,
  onUpdateText,
}: {
  project: LongformProject;
  subtitleId: string;
  onUpdateText: (id: string, text: string) => void;
}) {
  // Find the subtitle across all scenes
  let subtitleText = '';
  for (const scene of project.scenes) {
    const sub = scene.subtitles.find((s) => s.id === subtitleId);
    if (sub) {
      subtitleText = sub.text;
      break;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">자막:</label>
      <input
        type="text"
        value={subtitleText}
        onChange={(e) => onUpdateText(subtitleId, e.target.value)}
        className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 min-w-[200px]"
      />
    </div>
  );
}
