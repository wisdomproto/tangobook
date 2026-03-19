import { useState, useRef, useEffect, useCallback } from 'react';
import type { LongformProject } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { DownloadButton } from '@/components/DownloadButton';
import { storybookApi } from '@/features/storybook';
import { longformApi } from '../api/longform.api';

interface RenderStepProps {
  storybookId: string;
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
}

const ASPECT_LABELS: Record<string, string> = {
  '16:9': '1920 × 1080 (16:9)',
  '9:16': '1080 × 1920 (9:16)',
  '1:1': '1080 × 1080 (1:1)',
};

export function RenderStep({ storybookId, project, onUpdate }: RenderStepProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<{ progress: number; step: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const handleRender = async () => {
    setError(null);
    setIsRendering(true);
    setProgress({ progress: 0, step: '렌더링 시작 중...' });

    try {
      await longformApi.render({ storybookId, projectId: project.id });

      pollingRef.current = setInterval(async () => {
        try {
          const data = await longformApi.getRenderProgress(project.id);
          if (!data) {
            // Progress cleaned up — render finished, reload to get outputUrl
            stopPolling();
            setIsRendering(false);
            setProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.outputUrl) {
                onUpdate({ outputUrl: updatedProject.outputUrl });
              }
            } catch {
              /* ignore */
            }
            return;
          }

          setProgress({ progress: data.progress, step: data.step });

          if (data.progress >= 100) {
            stopPolling();
            setIsRendering(false);
            setProgress(null);
            // Reload storybook to get outputUrl
            try {
              const updated = await storybookApi.getById(storybookId);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.outputUrl) {
                onUpdate({ outputUrl: updatedProject.outputUrl });
              }
            } catch {
              /* ignore */
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '렌더링 중 오류가 발생했습니다.');
      setIsRendering(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    stopPolling();
    setIsRendering(false);
    setProgress(null);
  };

  const clipCount = project.scenes.filter((s) => s.clipUrl).length;
  const totalScenes = project.scenes.length;
  const canRender = totalScenes > 0 && clipCount === totalScenes && !isRendering;

  return (
    <div className="space-y-5">
      {/* Resolution info */}
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3">
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            출력 해상도: {ASPECT_LABELS[project.aspectRatio] ?? project.aspectRatio}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {clipCount} / {totalScenes}개 클립 준비됨
          </p>
        </div>
      </div>

      {/* Render button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleRender} disabled={!canRender} loading={isRendering} size="md">
          {isRendering ? '렌더링 중...' : '렌더링 시작'}
        </Button>

        {isRendering && (
          <button
            onClick={handleCancel}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            취소
          </button>
        )}

        {!canRender && !isRendering && totalScenes > 0 && clipCount < totalScenes && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            모든 클립이 생성되어야 렌더링할 수 있습니다.
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Progress bar */}
      {isRendering && progress && (
        <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-800 dark:text-violet-200">
              {progress.step}
            </span>
            <span className="text-sm text-violet-600 dark:text-violet-400">
              {Math.round(progress.progress)}%
            </span>
          </div>
          <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-2">
            <div
              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Output preview */}
      {project.outputUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              렌더링 완료
            </span>
            <DownloadButton href={project.outputUrl} filename={`${project.name}.mp4`} size="sm" />
          </div>
          <video
            src={project.outputUrl}
            controls
            className="rounded-lg w-full max-h-[480px] bg-black border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}

      {/* Empty state */}
      {!project.outputUrl && !isRendering && totalScenes === 0 && (
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
          <p className="text-xs mt-1">Step 1에서 시작하세요.</p>
        </div>
      )}
    </div>
  );
}
