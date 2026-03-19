import { useState, useRef, useEffect, useCallback } from 'react';
import type { LongformProject, YouTubeUploadMeta } from '@tangobook/shared';
import { YOUTUBE_CATEGORIES, YOUTUBE_PRIVACY_OPTIONS } from '@tangobook/shared';
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
  // ----- Render state -----
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<{ progress: number; step: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- YouTube state -----
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const [ytUploading, setYtUploading] = useState(false);
  const [ytProgress, setYtProgress] = useState<{ progress: number; step: string } | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // YouTube form state
  const [ytTitle, setYtTitle] = useState(project.name || '');
  const [ytDescription, setYtDescription] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted'>('unlisted');
  const [ytCategory, setYtCategory] = useState('27'); // Education
  const [ytTags, setYtTags] = useState('');
  const [ytLanguage, setYtLanguage] = useState(project.language || 'ko');

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (ytPollRef.current) clearInterval(ytPollRef.current);
    };
  }, []);

  // Check YouTube connection on mount
  useEffect(() => {
    longformApi
      .youtubeStatus()
      .then((data) => setYtConnected(data.connected))
      .catch(() => setYtConnected(false));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopYtPolling = useCallback(() => {
    if (ytPollRef.current) {
      clearInterval(ytPollRef.current);
      ytPollRef.current = null;
    }
  }, []);

  // ----- Render handlers -----
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
          /* Ignore polling errors */
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

  // ----- YouTube handlers -----
  const handleYoutubeConnect = async () => {
    try {
      const data = await longformApi.youtubeAuthUrl();
      window.location.href = data.url;
    } catch {
      setYtError('YouTube 연결 URL을 가져오지 못했습니다.');
    }
  };

  const handleYoutubeDisconnect = async () => {
    try {
      await longformApi.youtubeDisconnect();
      setYtConnected(false);
    } catch {
      setYtError('YouTube 연결 해제에 실패했습니다.');
    }
  };

  const handleYoutubeUpload = async () => {
    setYtError(null);
    setYtUploading(true);
    setYtProgress({ progress: 0, step: '업로드 준비 중...' });

    const meta: YouTubeUploadMeta = {
      title: ytTitle,
      description: ytDescription,
      privacy: ytPrivacy,
      categoryId: ytCategory,
      tags: ytTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      language: ytLanguage,
    };

    try {
      await longformApi.youtubeUpload({ storybookId, projectId: project.id, meta });

      ytPollRef.current = setInterval(async () => {
        try {
          const data = await longformApi.getYouTubeProgress(project.id);
          if (!data) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            // Reload to get youtubeUpload result
            try {
              const updated = await storybookApi.getById(storybookId);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.youtubeUpload) {
                onUpdate({ youtubeUpload: updatedProject.youtubeUpload });
              }
            } catch {
              /* ignore */
            }
            return;
          }

          setYtProgress({ progress: data.progress, step: data.step });

          if (data.progress >= 100) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.youtubeUpload) {
                onUpdate({ youtubeUpload: updatedProject.youtubeUpload });
              }
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore */
        }
      }, 2000);
    } catch (e) {
      setYtError(e instanceof Error ? e.message : 'YouTube 업로드 중 오류가 발생했습니다.');
      setYtUploading(false);
      setYtProgress(null);
    }
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

      {/* ===== YouTube Upload Section ===== */}
      {project.outputUrl && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            YouTube 업로드
          </h3>

          {/* Connection status */}
          {ytConnected === null ? (
            <p className="text-xs text-slate-400">연결 상태 확인 중...</p>
          ) : !ytConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 dark:text-slate-400">YouTube 미연결</span>
              <Button size="sm" onClick={handleYoutubeConnect}>
                YouTube 연결
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
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
                  YouTube 연결됨
                </span>
                <button
                  onClick={handleYoutubeDisconnect}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  연결 해제
                </button>
              </div>

              {/* Already uploaded */}
              {project.youtubeUpload && (
                <div className="px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    업로드 완료
                  </p>
                  <a
                    href={project.youtubeUpload.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    {project.youtubeUpload.videoUrl}
                  </a>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(project.youtubeUpload.uploadedAt).toLocaleString()} ·{' '}
                    {project.youtubeUpload.privacy}
                  </p>
                </div>
              )}

              {/* Upload form */}
              {!ytUploading && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      제목
                    </label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={(e) => setYtTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="영상 제목"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      설명
                    </label>
                    <textarea
                      value={ytDescription}
                      onChange={(e) => setYtDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                      placeholder="영상 설명"
                    />
                  </div>

                  {/* Privacy + Category row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        공개 설정
                      </label>
                      <select
                        value={ytPrivacy}
                        onChange={(e) => setYtPrivacy(e.target.value as typeof ytPrivacy)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        {YOUTUBE_PRIVACY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        카테고리
                      </label>
                      <select
                        value={ytCategory}
                        onChange={(e) => setYtCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        {YOUTUBE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      태그 (쉼표 구분)
                    </label>
                    <input
                      type="text"
                      value={ytTags}
                      onChange={(e) => setYtTags(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="동화, 어린이, 교육"
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      언어
                    </label>
                    <select
                      value={ytLanguage}
                      onChange={(e) => setYtLanguage(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                      <option value="zh">中文</option>
                    </select>
                  </div>

                  {/* Upload button */}
                  <Button
                    onClick={handleYoutubeUpload}
                    disabled={!ytTitle.trim() || ytUploading}
                    size="md"
                    className="!bg-red-600 hover:!bg-red-700"
                  >
                    YouTube에 업로드
                  </Button>
                </div>
              )}

              {/* YouTube upload progress */}
              {ytUploading && ytProgress && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      {ytProgress.step}
                    </span>
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {Math.round(ytProgress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${ytProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* YouTube error */}
              {ytError && (
                <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  {ytError}
                </div>
              )}
            </>
          )}
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
