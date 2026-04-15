import { useState, useRef, useCallback, useEffect, useMemo, type ChangeEvent } from 'react';
import type {
  Storybook,
  LongformProject,
  LongformScene,
  LongformSubtitleEntry,
} from '@tangobook/shared';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { useTimeline, type TrackType } from '../hooks/useTimeline';
import { getEffectiveDuration } from '../utils/timeline.utils';
import { TimelinePreview } from './TimelinePreview';
import { TimelineControls } from './TimelineControls';
import { TimelineTrack } from './TimelineTrack';
import { SubtitleStyleModal } from './SubtitleStyleModal';
import { longformApi } from '../api/longform.api';
import { settingsApi, type BgmItem } from '@/features/settings/api/settings.api';

interface TimelineEditorStepProps {
  storybook: Storybook;
  project: LongformProject;
  allProjects: LongformProject[];
  onUpdate: (
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onSelectProject: (projectId: string) => void;
  onAddVersion?: () => void;
  onDeleteVersion?: () => void;
}

const TRACK_ORDER: TrackType[] = ['video', 'sfx', 'subtitle', 'tts', 'bgm'];

export function TimelineEditorStep({
  storybook,
  project,
  allProjects,
  onUpdate,
  onSelectProject,
  onAddVersion,
  onDeleteVersion,
}: TimelineEditorStepProps) {
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

  // 버전 프로젝트 스냅샷: clipUrl이 비어있으면 마스터의 같은 pageNumber에서 복사
  useEffect(() => {
    if (!project.parentProjectId) return;
    const master = allProjects.find((p) => p.id === project.parentProjectId);
    if (!master) return;

    const missing = project.scenes.some((s) => !s.clipUrl);
    if (!missing) return;

    const byPage = new Map<number, LongformScene>();
    for (const ms of master.scenes) {
      if (typeof ms.pageNumber === 'number') byPage.set(ms.pageNumber, ms);
    }

    let changed = false;
    onUpdate((proj) => {
      for (const s of proj.scenes) {
        if (s.clipUrl) continue;
        const ms = typeof s.pageNumber === 'number' ? byPage.get(s.pageNumber) : undefined;
        if (ms?.clipUrl) {
          s.clipUrl = ms.clipUrl;
          if (ms.clipHistory && !s.clipHistory) s.clipHistory = [...ms.clipHistory];
          if (ms.sfxUrl && !s.sfxUrl) s.sfxUrl = ms.sfxUrl;
          changed = true;
        }
      }
    });
    // onUpdate는 항상 draft 통해 호출되므로 no-op이어도 side effect 없음
    void changed;
  }, [project.id, project.parentProjectId, allProjects, project.scenes, onUpdate]);

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

  const handleSfxMoveOffset = useCallback(
    (sceneId: string, offset: number) => {
      timeline.updateSfxOffset(sceneId, offset);
    },
    [timeline]
  );

  const handleTtsMoveOffset = useCallback(
    (sceneId: string, offset: number) => {
      timeline.updateTtsOffset(sceneId, offset);
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

  // Check if clips/TTS are still loading (scenes exist but media not ready)
  const loadingStatus = useMemo(() => {
    if (!hasScenes) return null;
    const total = project.scenes.length;
    const clipsReady = project.scenes.filter((s) => s.clipUrl).length;
    const ttsReady = project.scenes.filter((s) => s.ttsUrl).length;
    if (clipsReady < total || ttsReady < total) {
      return { total, clipsReady, ttsReady };
    }
    return null;
  }, [hasScenes, project.scenes]);

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

  // Available languages from storybook pages' translations
  const availableLanguages = useMemo(() => {
    const langSet = new Set<string>();
    langSet.add('ko');
    for (const page of storybook.pages ?? []) {
      if (page.translations) {
        for (const code of Object.keys(page.translations)) {
          if (page.translations[code]?.text) langSet.add(code);
        }
      }
    }
    const langs: { code: string; label: string }[] = [];
    for (const sl of SUPPORTED_LANGUAGES) {
      if (sl.code === 'ko' || langSet.has(sl.code)) langs.push({ ...sl });
    }
    for (const code of langSet) {
      if (!SUPPORTED_LANGUAGES.some((sl) => sl.code === code)) {
        langs.push({ code, label: code.toUpperCase() });
      }
    }
    return langs;
  }, [storybook.pages]);

  return (
    <div className="space-y-4">
      {/* Loading indicator */}
      {loadingStatus && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <svg
            className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <span className="font-medium">미디어 로딩 중...</span>
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              영상 {loadingStatus.clipsReady}/{loadingStatus.total} · TTS {loadingStatus.ttsReady}/
              {loadingStatus.total}
            </span>
          </div>
        </div>
      )}

      {/* Version tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {allProjects.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              p.id === project.id
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <span className="font-medium">{p.name}</span>
            <span className="ml-1.5 text-xs opacity-60">{p.language?.toUpperCase() ?? 'KO'}</span>
            {p.outputUrl && <span className="ml-1 text-green-500 text-xs">✓</span>}
          </button>
        ))}
        {onAddVersion && (
          <button
            onClick={onAddVersion}
            className="px-2.5 py-2 text-sm rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-violet-500 hover:border-violet-400 transition-colors"
            title="버전 추가"
          >
            + 버전
          </button>
        )}
        {onDeleteVersion && (
          <button
            onClick={onDeleteVersion}
            className="px-2 py-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
            title="현재 버전 삭제"
          >
            삭제
          </button>
        )}
      </div>

      {/* Project name + Language selector */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:border-violet-500 transition-colors min-w-0 max-w-[200px]"
          placeholder="프로젝트 이름"
        />
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          자막/TTS 언어
        </span>
        <select
          value={project.language}
          onChange={(e) => {
            const newLang = e.target.value;
            const pages = storybook.pages ?? [];

            // 언어 변경 시 자막 텍스트 + TTS URL 교체
            const updatedScenes = project.scenes.map((scene) => {
              const page = pages.find((p) => p.pageNumber === scene.pageNumber);
              if (!page) return { ...scene };

              const text =
                newLang !== 'ko' && page.translations?.[newLang]?.text
                  ? page.translations[newLang].text
                  : page.text;
              const ttsUrl =
                newLang !== 'ko' && page.translations?.[newLang]?.ttsUrl
                  ? page.translations[newLang].ttsUrl
                  : page.ttsUrl;

              // 문장 분리 → 자막 재생성
              const sentences = text
                .split(/(?<=[.!?。])\s*/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              const dur = scene.clipDuration - (scene.trimStart ?? 0) - (scene.trimEnd ?? 0);
              const perSentence = sentences.length > 0 ? dur / sentences.length : dur;
              const subtitles = sentences.map((t, i) => ({
                id: crypto.randomUUID(),
                text: t,
                startTime: +(i * perSentence).toFixed(2),
                endTime: +((i + 1) * perSentence).toFixed(2),
              }));

              return { ...scene, ttsUrl, subtitles };
            });

            onUpdate({ language: newLang, scenes: updatedScenes });
          }}
          className="px-2 py-1 rounded text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

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
        onReset={() => {
          if (
            !confirm(
              '타임라인을 초기화하시겠습니까?\n트리밍, 오프셋, 분할, 자막 편집이 모두 원래대로 돌아갑니다.'
            )
          )
            return;

          // 1. Merge split scenes back (same pageNumber → keep the one with clipUrl)
          const pageMap = new Map<number, LongformScene>();
          for (const scene of project.scenes) {
            const existing = pageMap.get(scene.pageNumber);
            if (!existing) {
              pageMap.set(scene.pageNumber, scene);
            } else {
              // Keep whichever has a clipUrl, prefer existing
              if (!existing.clipUrl && scene.clipUrl) {
                pageMap.set(scene.pageNumber, scene);
              }
            }
          }
          const mergedScenes = Array.from(pageMap.values())
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map((s, i) => ({ ...s, order: i }));

          // 2. Regenerate subtitles from storybook page text (language-aware)
          const lang = project.language ?? 'ko';
          const rebuilt = mergedScenes.map((scene) => {
            const page = storybook.pages.find((p) => p.pageNumber === scene.pageNumber);
            const text =
              lang !== 'ko' && page?.translations?.[lang]?.text
                ? page.translations[lang].text
                : page?.text || '';
            const ttsUrl =
              lang !== 'ko' && page?.translations?.[lang]?.ttsUrl
                ? page.translations[lang].ttsUrl
                : page?.ttsUrl;
            if (!text.trim()) {
              return { ...scene, ttsUrl, subtitles: [] };
            }
            // Split text into sentences
            const sentences = text
              .split(/(?<=[.!?。！？])\s*/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (sentences.length === 0) {
              return {
                ...scene,
                ttsUrl,
                subtitles: [
                  { id: crypto.randomUUID(), text, startTime: 0, endTime: scene.clipDuration },
                ],
              };
            }
            const dur = scene.clipDuration;
            const sliceDur = dur / sentences.length;
            const subtitles: LongformSubtitleEntry[] = sentences.map((sent, i) => ({
              id: crypto.randomUUID(),
              text: sent,
              startTime: Math.round(i * sliceDur * 100) / 100,
              endTime: Math.round((i + 1) * sliceDur * 100) / 100,
            }));
            return { ...scene, ttsUrl, subtitles };
          });

          timeline.resetTimeline(rebuilt);
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
              onTrimChange={trackType === 'video' ? handleTrimChange : undefined}
              onMoveOffset={
                trackType === 'sfx'
                  ? handleSfxMoveOffset
                  : trackType === 'tts'
                    ? handleTtsMoveOffset
                    : undefined
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
            onDelete={timeline.deleteSubtitle}
            onSplit={timeline.splitSubtitle}
            onMergeNext={timeline.mergeSubtitles}
            onAdd={timeline.addSubtitle}
            currentTime={timeline.currentTime}
          />
        )}

        {/* SFX volume control */}
        {project.scenes.some((s) => s.sfxUrl) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">효과음</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(
                project.scenes.filter((s) => s.sfxUrl).reduce((sum, s) => sum + s.sfxVolume, 0) /
                  Math.max(1, project.scenes.filter((s) => s.sfxUrl).length)
              )}
              onChange={(e) => {
                const vol = parseInt(e.target.value);
                onUpdate((proj) => {
                  proj.scenes = proj.scenes.map((s) => (s.sfxUrl ? { ...s, sfxVolume: vol } : s));
                });
              }}
              className="w-20 h-1 accent-amber-500"
            />
            <span className="text-xs text-slate-500 w-8">
              {Math.round(
                project.scenes.filter((s) => s.sfxUrl).reduce((sum, s) => sum + s.sfxVolume, 0) /
                  Math.max(1, project.scenes.filter((s) => s.sfxUrl).length)
              )}
              %
            </span>
          </div>
        )}

        {/* TTS volume control */}
        {project.scenes.some((s) => s.ttsUrl) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">나레이션</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(
                project.scenes
                  .filter((s) => s.ttsUrl)
                  .reduce((sum, s) => sum + (s.ttsVolume ?? 70), 0) /
                  Math.max(1, project.scenes.filter((s) => s.ttsUrl).length)
              )}
              onChange={(e) => {
                const vol = parseInt(e.target.value);
                onUpdate((proj) => {
                  proj.scenes = proj.scenes.map((s) => (s.ttsUrl ? { ...s, ttsVolume: vol } : s));
                });
              }}
              className="w-20 h-1 accent-sky-500"
            />
            <span className="text-xs text-slate-500 w-8">
              {Math.round(
                project.scenes
                  .filter((s) => s.ttsUrl)
                  .reduce((sum, s) => sum + (s.ttsVolume ?? 70), 0) /
                  Math.max(1, project.scenes.filter((s) => s.ttsUrl).length)
              )}
              %
            </span>
          </div>
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
                    <button
                      onClick={async () => {
                        if (!confirm(`"${item.title}" 배경음악을 라이브러리에서 삭제할까요?`))
                          return;
                        try {
                          await settingsApi.deleteBgm(item.id);
                          setBgmLibrary((prev) => prev.filter((b) => b.id !== item.id));
                          if (project.bgmUrl === item.url) onUpdate({ bgmUrl: undefined });
                          if (previewingId === item.id) stopPreview();
                        } catch {
                          /* silently */
                        }
                      }}
                      className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors shrink-0"
                      title="라이브러리에서 삭제"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
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
  onDelete,
  onSplit,
  onMergeNext,
  onAdd,
  currentTime,
}: {
  project: LongformProject;
  subtitleId: string;
  onUpdateText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onSplit: (id: string, time: number) => void;
  onMergeNext: (idA: string, idB: string) => void;
  onAdd: (sceneId: string, startTime: number, endTime: number, text: string) => void;
  currentTime: number;
}) {
  // Find the subtitle and its scene across all scenes
  let subtitle: LongformSubtitleEntry | null = null;
  let parentScene: LongformScene | null = null;
  let nextSubtitle: LongformSubtitleEntry | null = null;

  for (const scene of project.scenes) {
    const idx = scene.subtitles.findIndex((s) => s.id === subtitleId);
    if (idx >= 0) {
      subtitle = scene.subtitles[idx];
      parentScene = scene;
      nextSubtitle = scene.subtitles[idx + 1] ?? null;
      break;
    }
  }

  if (!subtitle || !parentScene) return null;

  // Calculate local time within the subtitle for split
  let sceneStart = 0;
  for (const s of project.scenes) {
    if (s.id === parentScene.id) break;
    sceneStart += getEffectiveDuration(s);
  }
  const localTime = currentTime - sceneStart;
  const canSplit = localTime > subtitle.startTime + 0.3 && localTime < subtitle.endTime - 0.3;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">자막:</label>
      <input
        type="text"
        value={subtitle.text}
        onChange={(e) => onUpdateText(subtitleId, e.target.value)}
        className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500 min-w-[200px]"
      />
      <span className="text-[10px] text-slate-400">
        {subtitle.startTime.toFixed(1)}s ~ {subtitle.endTime.toFixed(1)}s
      </span>

      {/* Split subtitle at playhead */}
      {canSplit && (
        <button
          onClick={() => onSplit(subtitleId, localTime)}
          className="px-2 py-0.5 text-[11px] rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 transition-colors"
          title="플레이헤드 위치에서 자막 분할"
        >
          분할
        </button>
      )}

      {/* Merge with next subtitle */}
      {nextSubtitle && (
        <button
          onClick={() => onMergeNext(subtitleId, nextSubtitle!.id)}
          className="px-2 py-0.5 text-[11px] rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
          title="다음 자막과 합치기"
        >
          합치기
        </button>
      )}

      {/* Add new subtitle after this one */}
      <button
        onClick={() => {
          const gap = 0.5;
          const sceneEnd = getEffectiveDuration(parentScene!);
          const newStart = Math.min(subtitle!.endTime + gap, sceneEnd - 1);
          const newEnd = Math.min(newStart + 2, sceneEnd);
          if (newEnd > newStart + 0.2) {
            onAdd(parentScene!.id, newStart, newEnd, '');
          }
        }}
        className="px-2 py-0.5 text-[11px] rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-green-400 hover:text-green-600 transition-colors"
        title="이 뒤에 새 자막 추가"
      >
        +추가
      </button>

      {/* Delete subtitle */}
      <button
        onClick={() => onDelete(subtitleId)}
        className="px-2 py-0.5 text-[11px] rounded border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        title="자막 삭제"
      >
        삭제
      </button>
    </div>
  );
}
