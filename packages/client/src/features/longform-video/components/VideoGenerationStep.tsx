import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
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
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          페이지 {scene.pageNumber}
        </span>
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
    (sceneId: string, file: File) => {
      // Create a local object URL for preview — in production this would upload to server/R2
      const localUrl = URL.createObjectURL(file);
      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId ? { ...s, clipUrl: localUrl } : s
      );
      onUpdate({ scenes: updatedScenes });
    },
    [project.scenes, onUpdate]
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
          <p className="text-xs mt-1">Step 1에서 프롬프트 분석을 먼저 완료하세요.</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
