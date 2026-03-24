import { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react';
import type { Storybook, LongformProject, LongformScene } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { storybookApi } from '@/features/storybook';
import { longformApi } from '../api/longform.api';

// ===== Types =====

interface VideoGenerationStepProps {
  storybook: Storybook;
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
}

type ClipStatus = 'waiting' | 'generating' | 'done' | 'error';

interface SceneGeneratingState {
  [sceneId: string]: boolean;
}

interface SceneErrorState {
  [sceneId: string]: string;
}

// ===== Constants =====

const VIDEO_MODELS = [{ value: 'grok', label: 'Grok' }] as const;

const STATUS_LABELS: Record<ClipStatus, string> = {
  waiting: '대기중',
  generating: '생성중',
  done: '완료',
  error: '에러',
};

const STATUS_COLORS: Record<ClipStatus, string> = {
  waiting: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  generating: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
};

// ===== Helper =====

function getSceneStatus(
  scene: LongformScene,
  isGenerating: boolean,
  hasError: boolean
): ClipStatus {
  if (isGenerating) return 'generating';
  if (hasError) return 'error';
  if (scene.clipUrl) return 'done';
  return 'waiting';
}

// ===== SceneCard component =====

interface SceneCardProps {
  scene: LongformScene;
  illustrationUrl?: string;
  storybookId: string;
  projectId: string;
  isGenerating: boolean;
  error: string | null;
  isBatchRunning: boolean;
  onClipGenerated: (sceneId: string, clipUrl: string, sfxUrl: string) => void;
  onGeneratingChange: (sceneId: string, value: boolean) => void;
  onErrorChange: (sceneId: string, error: string | null) => void;
  onUpload: (sceneId: string, file: File) => void;
  onPromptChange: (sceneId: string, prompt: string) => void;
  onDeleteClip: (sceneId: string) => void;
  onRestoreClip: (sceneId: string, clipUrl: string) => void;
  onDeleteScene: (sceneId: string) => void;
}

function SceneCard({
  scene,
  illustrationUrl,
  storybookId,
  projectId,
  isGenerating,
  error,
  isBatchRunning,
  onClipGenerated,
  onGeneratingChange,
  onErrorChange,
  onPromptChange,
  onDeleteClip,
  onRestoreClip,
  onUpload,
  onDeleteScene,
}: SceneCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(scene.videoPrompt ?? '');
  const status = getSceneStatus(scene, isGenerating, !!error);

  const handleGenerate = async () => {
    onErrorChange(scene.id, null);
    onGeneratingChange(scene.id, true);
    try {
      const result = await longformApi.generateClip({
        storybookId,
        projectId,
        sceneId: scene.id,
      });
      onClipGenerated(scene.id, result.clipUrl, result.sfxUrl);
    } catch (e) {
      onErrorChange(scene.id, e instanceof Error ? e.message : '클립 생성 중 오류가 발생했습니다.');
    } finally {
      onGeneratingChange(scene.id, false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(scene.id, file);
    }
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const isDisabled = isGenerating || isBatchRunning;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            페이지 {scene.pageNumber}
          </span>
          <span className="text-base font-mono font-semibold text-slate-600 dark:text-slate-300">
            {scene.ttsDuration != null && (
              <span title="TTS 길이">TTS {scene.ttsDuration.toFixed(1)}s</span>
            )}
            {scene.ttsDuration != null && <span className="mx-1">→</span>}
            <span title="영상 길이">{scene.clipDuration}s</span>
          </span>
          <button
            onClick={() => {
              if (confirm(`페이지 ${scene.pageNumber} 장면을 삭제하시겠습니까?`)) {
                onDeleteScene(scene.id);
              }
            }}
            className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
            title="장면 삭제"
          >
            ✕
          </button>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}
        >
          {status === 'generating' && (
            <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
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
          )}
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Body */}
      <div className="flex gap-4 p-4">
        {/* Reference image */}
        {illustrationUrl && (
          <div className="flex-shrink-0 w-32">
            <img
              src={illustrationUrl}
              alt={`페이지 ${scene.pageNumber}`}
              className="rounded-lg w-full h-auto border border-slate-200 dark:border-slate-700"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
              레퍼런스
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Editable prompt */}
          {scene.videoPrompt != null ? (
            isEditingPrompt ? (
              <div className="space-y-2">
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onPromptChange(scene.id, editedPrompt);
                      setIsEditingPrompt(false);
                    }}
                    className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditedPrompt(scene.videoPrompt ?? '');
                      setIsEditingPrompt(false);
                    }}
                    className="px-2.5 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingPrompt(true)}
                className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-2 py-1.5 -mx-2 transition-colors"
                title="클릭하여 프롬프트 수정"
              >
                {scene.videoPrompt}
              </p>
            )
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              영상 프롬프트가 없습니다. Step 1에서 분석을 먼저 완료하세요.
            </p>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Progress bar during generation */}
          {isGenerating && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full animate-pulse w-full" />
            </div>
          )}

          {/* Video preview */}
          {scene.clipUrl && (
            <div className="space-y-1">
              <video src={scene.clipUrl} controls className="rounded-lg w-full max-h-48 bg-black" />
              <button
                onClick={() => onDeleteClip(scene.id)}
                disabled={isGenerating}
                className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                영상 삭제
              </button>
            </div>
          )}

          {/* Clip history */}
          {scene.clipHistory && scene.clipHistory.length > 0 && (
            <details className="text-xs">
              <summary className="text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                이전 영상 ({scene.clipHistory.length}개)
              </summary>
              <div className="mt-2 space-y-2">
                {scene.clipHistory.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <video src={url} controls className="rounded w-48 h-auto bg-black" />
                    <button
                      onClick={() => onRestoreClip(scene.id, url)}
                      className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    >
                      복원
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate / Regenerate */}
            {!scene.clipUrl ? (
              <button
                onClick={handleGenerate}
                disabled={isDisabled || !scene.videoPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
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
                    생성중...
                  </>
                ) : (
                  '생성'
                )}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isDisabled}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 text-xs rounded-lg transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                재생성
              </button>
            )}

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400 text-xs rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              업로드
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main component =====

export function VideoGenerationStep({ storybook, project, onUpdate }: VideoGenerationStepProps) {
  const [selectedModel, setSelectedModel] = useState<string>('grok');
  const [generatingScenes, setGeneratingScenes] = useState<SceneGeneratingState>({});
  const [sceneErrors, setSceneErrors] = useState<SceneErrorState>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    progress: number;
    currentScene?: number;
    step: string;
  } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [startPage, setStartPage] = useState<string>('');
  const [endPage, setEndPage] = useState<string>('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [showPromptUpload, setShowPromptUpload] = useState(false);
  const [promptText, setPromptText] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const handleClipGenerated = useCallback(
    (sceneId: string, clipUrl: string, sfxUrl: string) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        // Move current clip to history
        const clipHistory = [...(s.clipHistory ?? [])];
        if (s.clipUrl) clipHistory.push(s.clipUrl);
        return { ...s, clipUrl, sfxUrl, clipHistory };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const handleDeleteClip = useCallback(
    (sceneId: string) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        return { ...s, clipUrl: undefined, sfxUrl: undefined };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const handleRestoreClip = useCallback(
    (sceneId: string, clipUrl: string) => {
      const updatedScenes = project.scenes.map((s) => {
        if (s.id !== sceneId) return s;
        // Remove restored URL from history, move current to history
        const clipHistory = (s.clipHistory ?? []).filter((u) => u !== clipUrl);
        if (s.clipUrl) clipHistory.push(s.clipUrl);
        return { ...s, clipUrl, clipHistory };
      });
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const handleGeneratingChange = useCallback((sceneId: string, value: boolean) => {
    setGeneratingScenes((prev) => ({ ...prev, [sceneId]: value }));
  }, []);

  const handleErrorChange = useCallback((sceneId: string, error: string | null) => {
    setSceneErrors((prev) => {
      if (error === null) {
        const next = { ...prev };
        delete next[sceneId];
        return next;
      }
      return { ...prev, [sceneId]: error };
    });
  }, []);

  const handlePromptChange = useCallback(
    (sceneId: string, prompt: string) => {
      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId ? { ...s, videoPrompt: prompt } : s
      );
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
  );

  const handleUpload = useCallback(
    async (sceneId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('storybookId', storybook.id);
      formData.append('projectId', project.id);
      formData.append('sceneId', sceneId);
      try {
        const result = await longformApi.uploadClip(formData);
        const updatedScenes = project.scenes.map((s) => {
          if (s.id !== sceneId) return s;
          const clipHistory = [...(s.clipHistory ?? [])];
          if (s.clipUrl) clipHistory.push(s.clipUrl);
          return { ...s, clipUrl: result.clipUrl, sfxUrl: result.sfxUrl, clipHistory };
        });
        onUpdate({ scenes: updatedScenes });
      } catch (e) {
        setSceneErrors((prev) => ({
          ...prev,
          [sceneId]: e instanceof Error ? e.message : '업로드 실패',
        }));
      }
    },
    [storybook.id, project.id, project.scenes, onUpdate]
  );

  const handleGenerateAll = async () => {
    setGlobalError(null);
    setIsBatchRunning(true);
    setBatchProgress({ progress: 0, step: '시작 중...' });

    try {
      const req: { storybookId: string; projectId: string; startPage?: number; endPage?: number } =
        {
          storybookId: storybook.id,
          projectId: project.id,
        };
      if (startPage) req.startPage = parseInt(startPage);
      if (endPage) req.endPage = parseInt(endPage);
      await longformApi.generateAll(req);

      // Start polling for progress
      pollingRef.current = setInterval(async () => {
        try {
          const progressData = await longformApi.getProgress(project.id);
          if (!progressData) {
            // No progress data means generation finished or not started
            stopPolling();
            setIsBatchRunning(false);
            setBatchProgress(null);
            // Reload storybook to get updated clipUrls
            try {
              const updated = await storybookApi.getById(storybook.id);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject) {
                onUpdate({ scenes: updatedProject.scenes });
              }
            } catch {
              // ignore
            }
            return;
          }

          setBatchProgress({
            progress: progressData.progress,
            step: progressData.step,
            currentScene: progressData.currentScene,
          });

          if (progressData.progress >= 100) {
            stopPolling();
            setIsBatchRunning(false);
            setBatchProgress(null);
            // Reload storybook to get updated clipUrls
            try {
              const updated = await storybookApi.getById(storybook.id);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject) {
                onUpdate({ scenes: updatedProject.scenes });
              }
            } catch {
              // ignore reload error
            }
          }
        } catch {
          // Ignore polling errors silently
        }
      }, 2000);
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : '전체 생성 중 오류가 발생했습니다.');
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  const handleCancelBatch = () => {
    stopPolling();
    setIsBatchRunning(false);
    setBatchProgress(null);
  };

  // ----- Prompt bulk upload -----
  const handlePromptUpload = useCallback(() => {
    if (!promptText.trim() || project.scenes.length === 0) return;

    // Split by empty lines → one prompt per scene
    const prompts = promptText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
    const updatedScenes = project.scenes.map((s) => {
      const idx = sortedScenes.findIndex((ss) => ss.id === s.id);
      if (idx >= 0 && idx < prompts.length) {
        return { ...s, videoPrompt: prompts[idx] };
      }
      return s;
    });

    onUpdate({ scenes: updatedScenes });
    setPromptText('');
    setShowPromptUpload(false);
  }, [promptText, project.scenes, onUpdate]);

  // ----- Bulk upload (drag & drop) -----
  const handleBulkFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || project.scenes.length === 0) return;

      // Sort files by name
      const sorted = [...files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );
      const sortedScenes = [...project.scenes].sort((a, b) => a.order - b.order);
      const count = Math.min(sorted.length, sortedScenes.length);

      setBulkUploading(true);
      setBulkProgress({ current: 0, total: count });
      setGlobalError(null);

      // Collect results then apply all at once to avoid stale closure
      const results = new Map<string, { clipUrl: string; sfxUrl: string }>();

      for (let i = 0; i < count; i++) {
        setBulkProgress({ current: i + 1, total: count });
        const scene = sortedScenes[i];
        const file = sorted[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('storybookId', storybook.id);
        formData.append('projectId', project.id);
        formData.append('sceneId', scene.id);
        try {
          const result = await longformApi.uploadClip(formData);
          results.set(scene.id, result);
        } catch (e) {
          setGlobalError(
            `페이지 ${scene.pageNumber} 업로드 실패: ${e instanceof Error ? e.message : '알 수 없는 오류'}`
          );
          break;
        }
      }

      // Apply all results at once
      if (results.size > 0) {
        onUpdate({
          scenes: project.scenes.map((s) => {
            const result = results.get(s.id);
            if (!result) return s;
            const clipHistory = [...(s.clipHistory ?? [])];
            if (s.clipUrl) clipHistory.push(s.clipUrl);
            return { ...s, clipUrl: result.clipUrl, sfxUrl: result.sfxUrl, clipHistory };
          }),
        });
      }

      setBulkUploading(false);
      setBulkProgress(null);
      setShowBulkUpload(false);
    },
    [storybook.id, project.id, project.scenes, onUpdate]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'));
      handleBulkFiles(files);
    },
    [handleBulkFiles]
  );

  const handleBulkFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      handleBulkFiles(files);
      e.target.value = '';
    },
    [handleBulkFiles]
  );

  const doneCount = project.scenes.filter((s) => s.clipUrl).length;
  const totalCount = project.scenes.length;
  const hasScenes = totalCount > 0;
  const hasPrompts = project.scenes.some((s) => s.videoPrompt);

  return (
    <div className="space-y-5">
      {/* Top controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Model selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
            영상 모델
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {VIDEO_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Page range */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-500 dark:text-slate-400">범위:</span>
          <input
            type="number"
            min={1}
            max={totalCount}
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            placeholder="시작"
            className="w-16 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 text-center"
          />
          <span className="text-slate-400">~</span>
          <input
            type="number"
            min={1}
            max={totalCount}
            value={endPage}
            onChange={(e) => setEndPage(e.target.value)}
            placeholder="끝"
            className="w-16 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 text-center"
          />
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerateAll}
          disabled={isBatchRunning || !hasScenes || !hasPrompts}
          loading={isBatchRunning}
          size="md"
        >
          {isBatchRunning ? '생성 중...' : startPage || endPage ? '범위 생성' : '전체 생성'}
        </Button>

        {/* Bulk upload toggle */}
        <button
          onClick={() => setShowBulkUpload((v) => !v)}
          disabled={isBatchRunning || bulkUploading || !hasScenes}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 text-slate-600 dark:text-slate-400 text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          전체 업로드
        </button>

        {/* Prompt bulk upload toggle */}
        <button
          onClick={() => setShowPromptUpload((v) => !v)}
          disabled={!hasScenes}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50 text-slate-600 dark:text-slate-400 text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          프롬프트 업로드
        </button>

        {/* Progress summary */}
        {hasScenes && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {doneCount} / {totalCount}개 클립 완료
          </span>
        )}
      </div>

      {/* Global error */}
      {globalError && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {globalError}
        </div>
      )}

      {/* Batch progress bar */}
      {isBatchRunning && batchProgress && (
        <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
              {batchProgress.step}
              {batchProgress.currentScene !== undefined && (
                <span className="ml-1 text-xs font-normal">
                  (씬 {batchProgress.currentScene} / {totalCount})
                </span>
              )}
            </span>
            <button
              onClick={handleCancelBatch}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              취소
            </button>
          </div>
          <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${batchProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-1 text-right">
            {Math.round(batchProgress.progress)}%
          </p>
        </div>
      )}

      {/* Prompt bulk upload */}
      {showPromptUpload && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            페이지별 프롬프트를 빈 줄로 구분하여 입력하세요 ({totalCount}개 씬)
          </p>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={12}
            placeholder={`페이지 1 프롬프트...\n\n페이지 2 프롬프트...\n\n페이지 3 프롬프트...`}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-mono"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handlePromptUpload}
              disabled={!promptText.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              적용 (
              {promptText.trim() ? promptText.split(/\n\s*\n/).filter((p) => p.trim()).length : 0}
              개)
            </button>
            <button
              onClick={() => {
                setShowPromptUpload(false);
                setPromptText('');
              }}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Bulk upload drop zone */}
      {showBulkUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
          }`}
        >
          {bulkUploading && bulkProgress ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                업로드 중... ({bulkProgress.current} / {bulkProgress.total})
              </p>
              <div className="w-full max-w-xs mx-auto bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                영상 파일을 드래그 앤 드롭하세요
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                파일명 순서대로 {totalCount}개 씬에 하나씩 매칭됩니다
              </p>
              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition-colors">
                파일 선택
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={handleBulkFileSelect}
                />
              </label>
            </>
          )}
        </div>
      )}

      {/* Scene list */}
      {!hasScenes ? (
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
          <p className="text-sm">아직 분석된 씬이 없습니다.</p>
          <p className="text-xs mt-1">위에서 영상 프롬프트 생성을 먼저 완료하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              illustrationUrl={
                storybook.pages.find((p) => p.pageNumber === scene.pageNumber)?.illustrationUrl
              }
              storybookId={storybook.id}
              projectId={project.id}
              isGenerating={!!generatingScenes[scene.id]}
              error={sceneErrors[scene.id] ?? null}
              isBatchRunning={isBatchRunning}
              onClipGenerated={handleClipGenerated}
              onGeneratingChange={handleGeneratingChange}
              onErrorChange={handleErrorChange}
              onPromptChange={handlePromptChange}
              onDeleteClip={handleDeleteClip}
              onRestoreClip={handleRestoreClip}
              onUpload={handleUpload}
              onDeleteScene={(sceneId) => {
                const updated = project.scenes
                  .filter((s) => s.id !== sceneId)
                  .map((s, i) => ({ ...s, order: i }));
                onUpdate({ scenes: updated });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
