import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useLongformList,
  useDeleteLongform,
  useStartLongformAnalyze,
  useStartGenerateClip,
  useStartLongformRender,
} from '../hooks/useLongform';
import { bookV2Api } from '../api/book-v2.api';
import { CreateLongformModal } from './CreateLongformModal';
import { SceneEditor } from './SceneEditor';
import { YouTubeUploadModal } from './YouTubeUploadModal';
import { CaptionsModal } from './CaptionsModal';
import type { BookManifest, LongformProjectV2 } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface AnalyzeProgress {
  progress: number;
  step: string;
  error?: string;
}

interface ClipProgress {
  progress: number;
  step: string;
  error?: string;
}

interface RenderProgress {
  progress: number;
  step: string;
  error?: string;
}

interface LongformTabProps {
  manifest: BookManifest;
}

export function LongformTab({ manifest }: LongformTabProps) {
  const { data: projects, isLoading } = useLongformList(manifest.id);
  const remove = useDeleteLongform(manifest.id);
  const analyze = useStartLongformAnalyze(manifest.id);
  const generateClip = useStartGenerateClip(manifest.id);
  const renderProj = useStartLongformRender(manifest.id);
  const qc = useQueryClient();
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, AnalyzeProgress>>({});
  // sceneId → progress (씬 단위 클립 생성)
  const [clipProgressMap, setClipProgressMap] = useState<Record<string, ClipProgress>>({});
  // projectId → render progress
  const [renderProgressMap, setRenderProgressMap] = useState<Record<string, RenderProgress>>({});
  const pollersRef = useRef<Map<string, number>>(new Map());
  const clipPollersRef = useRef<Map<string, number>>(new Map());
  const renderPollersRef = useRef<Map<string, number>>(new Map());

  const handleDelete = (id: string) => {
    if (!window.confirm('이 동영상 프로젝트를 삭제할까요?')) return;
    remove.mutate(id);
  };

  const startPolling = (projectId: string) => {
    const tick = async () => {
      try {
        const p = await bookV2Api.getLongformAnalyzeProgress(manifest.id, projectId);
        if (p) {
          setProgressMap((m) => ({ ...m, [projectId]: p }));
          if (p.progress >= 100) {
            qc.invalidateQueries({ queryKey: ['book-v2', 'longform', manifest.id] });
            pollersRef.current.delete(projectId);
            // 완료 표시 후 잠시 뒤 progress 제거
            setTimeout(() => {
              setProgressMap((m) => {
                const { [projectId]: _, ...rest } = m;
                void _;
                return rest;
              });
            }, 3000);
            return;
          }
          if (p.progress < 0) {
            pollersRef.current.delete(projectId);
            return; // 실패는 progressMap에 유지 (에러 표시)
          }
        }
        const id = window.setTimeout(tick, 1500);
        pollersRef.current.set(projectId, id);
      } catch {
        const id = window.setTimeout(tick, 3000);
        pollersRef.current.set(projectId, id);
      }
    };
    tick();
  };

  useEffect(() => {
    return () => {
      pollersRef.current.forEach((id) => window.clearTimeout(id));
      pollersRef.current.clear();
      clipPollersRef.current.forEach((id) => window.clearTimeout(id));
      clipPollersRef.current.clear();
      renderPollersRef.current.forEach((id) => window.clearTimeout(id));
      renderPollersRef.current.clear();
    };
  }, []);

  const startRenderPolling = (projectId: string) => {
    const tick = async () => {
      try {
        const p = await bookV2Api.getLongformRenderProgress(manifest.id, projectId);
        if (p) {
          setRenderProgressMap((m) => ({ ...m, [projectId]: p }));
          if (p.progress >= 100) {
            qc.invalidateQueries({ queryKey: ['book-v2', 'longform', manifest.id] });
            renderPollersRef.current.delete(projectId);
            setTimeout(() => {
              setRenderProgressMap((m) => {
                const { [projectId]: _, ...rest } = m;
                void _;
                return rest;
              });
            }, 5000);
            return;
          }
          if (p.progress < 0) {
            renderPollersRef.current.delete(projectId);
            return;
          }
        }
        const id = window.setTimeout(tick, 2500);
        renderPollersRef.current.set(projectId, id);
      } catch {
        const id = window.setTimeout(tick, 5000);
        renderPollersRef.current.set(projectId, id);
      }
    };
    tick();
  };

  const handleRender = (projectId: string) => {
    renderProj.mutate(projectId, {
      onSuccess: () => {
        setRenderProgressMap((m) => ({ ...m, [projectId]: { progress: 0, step: '시작' } }));
        startRenderPolling(projectId);
      },
    });
  };

  const handleAnalyze = (projectId: string) => {
    analyze.mutate(
      { projectId },
      {
        onSuccess: () => {
          setProgressMap((m) => ({ ...m, [projectId]: { progress: 0, step: '시작' } }));
          startPolling(projectId);
        },
      }
    );
  };

  const startClipPolling = (projectId: string, sceneId: string) => {
    const tick = async () => {
      try {
        const p = await bookV2Api.getGenerateClipProgress(manifest.id, projectId, sceneId);
        if (p) {
          setClipProgressMap((m) => ({ ...m, [sceneId]: p }));
          if (p.progress >= 100) {
            qc.invalidateQueries({ queryKey: ['book-v2', 'longform', manifest.id] });
            clipPollersRef.current.delete(sceneId);
            setTimeout(() => {
              setClipProgressMap((m) => {
                const { [sceneId]: _, ...rest } = m;
                void _;
                return rest;
              });
            }, 3000);
            return;
          }
          if (p.progress < 0) {
            clipPollersRef.current.delete(sceneId);
            return;
          }
        }
        const id = window.setTimeout(tick, 2000);
        clipPollersRef.current.set(sceneId, id);
      } catch {
        const id = window.setTimeout(tick, 4000);
        clipPollersRef.current.set(sceneId, id);
      }
    };
    tick();
  };

  const handleGenerateClip = (projectId: string, sceneId: string) => {
    generateClip.mutate(
      { projectId, sceneId },
      {
        onSuccess: () => {
          setClipProgressMap((m) => ({ ...m, [sceneId]: { progress: 0, step: '시작' } }));
          startClipPolling(projectId, sceneId);
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-md p-4 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-ink-900 font-display">🎬 동영상 프로젝트</h2>
          <p className="text-xs text-ink-500 font-bold mt-0.5">
            {isLoading ? '로딩...' : `총 ${projects?.length ?? 0}개`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-md font-black text-sm bg-coral-500 text-white shadow-pop hover:brightness-110"
        >
          + 새 동영상 만들기
        </button>
      </div>

      <CreateLongformModal
        manifest={manifest}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && projects && projects.length === 0 && (
        <div className="bg-peach-50 rounded-md p-6 text-center text-sm text-ink-700 font-bold">
          아직 프로젝트가 없습니다. "+ 새 동영상 만들기"로 시작하세요.
          <br />
          <span className="text-xs text-ink-500 font-bold">
            텍스트 슬라이스의 페이지 수만큼 빈 scene이 자동 생성됩니다.
          </span>
        </div>
      )}

      {projects?.map((p) => (
        <ProjectCard
          key={p.id}
          bid={manifest.id}
          project={p}
          open={openProjectId === p.id}
          onToggle={() => setOpenProjectId(openProjectId === p.id ? null : p.id)}
          onDelete={() => handleDelete(p.id)}
          onAnalyze={() => handleAnalyze(p.id)}
          analyzeProgress={progressMap[p.id]}
          onGenerateClip={(sceneId) => handleGenerateClip(p.id, sceneId)}
          clipProgressBySceneId={clipProgressMap}
          onRender={() => handleRender(p.id)}
          renderProgress={renderProgressMap[p.id]}
        />
      ))}

      <div className="bg-peach-50 rounded-md p-4 text-xs text-ink-700 font-bold leading-relaxed">
        💡 <strong>End-to-end 동영상 흐름 완성</strong>:
        <br />
        🤖 AI 분석 (Gemini) → 🎬 클립 생성 (Grok i2v) → ✏️ 씬 편집 (트림/볼륨/자막) → 🎞️ 최종 렌더
        (ffmpeg)
        <p className="mt-2 font-normal">YouTube 업로드는 후속 sprint 예정</p>
      </div>
    </div>
  );
}

function ProjectCard({
  bid,
  project,
  open,
  onToggle,
  onDelete,
  onAnalyze,
  analyzeProgress,
  onGenerateClip,
  clipProgressBySceneId,
  onRender,
  renderProgress,
}: {
  bid: string;
  project: LongformProjectV2;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAnalyze: () => void;
  analyzeProgress?: AnalyzeProgress;
  onGenerateClip: (sceneId: string) => void;
  clipProgressBySceneId: Record<string, ClipProgress>;
  onRender: () => void;
  renderProgress?: RenderProgress;
}) {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [ytOpen, setYtOpen] = useState(false);
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const inProgress =
    analyzeProgress && analyzeProgress.progress >= 0 && analyzeProgress.progress < 100;
  const totalScenes = project.scenes.length;
  const withClip = project.scenes.filter((s) => s.clipUrl).length;
  const withTts = project.scenes.filter((s) => s.ttsUrl).length;
  const withPrompt = project.scenes.filter((s) => s.videoPrompt && s.videoPrompt.length > 0).length;

  return (
    <div className="bg-white rounded-md shadow-soft overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-cream-50 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-coral-100 text-coral-700 font-mono font-black text-[11px]">
              {project.level}
            </span>
            <span className="px-2 py-0.5 rounded bg-peach-100 text-coral-600 font-mono font-bold text-[11px]">
              {project.language}
            </span>
            <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-700 font-mono font-bold text-[11px]">
              🎨 {project.style}
            </span>
            {project.parentProjectId && (
              <span className="px-1.5 py-0.5 bg-peach-100 rounded text-coral-600 text-[10px] font-bold">
                ↳ master {project.parentProjectId.slice(-6)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-500 font-bold mt-1.5 truncate">
            {project.id} · {new Date(project.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
          <Badge label={`${withPrompt}/${totalScenes}`} hint="프롬프트" />
          <Badge label={`${withClip}/${totalScenes}`} hint="클립" />
          <Badge label={`${withTts}/${totalScenes}`} hint="TTS" />
          {project.videoUrl && <span className="text-success">✓ 렌더</span>}
          {project.youtubeVideoId && <span className="text-coral-600">📺 YT</span>}
          <span className="text-ink-300">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-ink-100 p-4 space-y-3 bg-cream-50">
          {/* 분석 진행률 */}
          {analyzeProgress && (
            <div className="bg-white rounded-md p-3 space-y-2 border border-coral-200">
              <div className="text-xs font-bold text-ink-700">
                {analyzeProgress.progress < 0
                  ? '❌ 분석 실패'
                  : analyzeProgress.progress >= 100
                    ? '✓ 분석 완료'
                    : `🤖 ${analyzeProgress.step} (${analyzeProgress.progress}%)`}
              </div>
              <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    analyzeProgress.progress < 0
                      ? 'bg-danger'
                      : analyzeProgress.progress >= 100
                        ? 'bg-success'
                        : 'bg-coral-500'
                  )}
                  style={{
                    width:
                      analyzeProgress.progress < 0
                        ? '100%'
                        : `${Math.max(0, Math.min(100, analyzeProgress.progress))}%`,
                  }}
                />
              </div>
              {analyzeProgress.error && (
                <div className="text-xs text-danger font-bold whitespace-pre-line">
                  {analyzeProgress.error}
                </div>
              )}
            </div>
          )}

          {/* 렌더 진행률 */}
          {renderProgress && (
            <div className="bg-white rounded-md p-3 space-y-2 border border-coral-300">
              <div className="text-xs font-bold text-ink-700">
                {renderProgress.progress < 0
                  ? '❌ 렌더 실패'
                  : renderProgress.progress >= 100
                    ? '✓ 렌더 완료'
                    : `🎞️ ${renderProgress.step} (${renderProgress.progress}%)`}
              </div>
              <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    renderProgress.progress < 0
                      ? 'bg-danger'
                      : renderProgress.progress >= 100
                        ? 'bg-success'
                        : 'bg-coral-500'
                  )}
                  style={{
                    width:
                      renderProgress.progress < 0
                        ? '100%'
                        : `${Math.max(0, Math.min(100, renderProgress.progress))}%`,
                  }}
                />
              </div>
              {renderProgress.error && (
                <div className="text-xs text-danger font-bold whitespace-pre-line">
                  {renderProgress.error}
                </div>
              )}
            </div>
          )}

          <div className="text-xs font-bold text-ink-700">씬 (총 {totalScenes})</div>
          <div className="grid grid-cols-1 gap-1.5">
            {project.scenes.map((s) => {
              const cp = clipProgressBySceneId[s.id];
              const generating = cp && cp.progress >= 0 && cp.progress < 100;
              const canGenerate = !!s.videoPrompt && !generating;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-xs bg-white rounded px-3 py-2"
                >
                  <span className="font-mono w-12 text-ink-500">p{s.pageNumber}</span>
                  <span className="flex-1 truncate text-ink-700">
                    {s.videoPrompt || <span className="text-ink-300 italic">(프롬프트 없음)</span>}
                  </span>
                  {cp ? (
                    <span
                      className={cn(
                        'font-mono text-[10px] px-1.5 py-0.5 rounded',
                        cp.progress < 0
                          ? 'bg-danger/10 text-danger'
                          : cp.progress >= 100
                            ? 'bg-success/10 text-success'
                            : 'bg-coral-100 text-coral-700'
                      )}
                      title={cp.error || cp.step}
                    >
                      {cp.progress < 0 ? '❌' : cp.progress >= 100 ? '✓ 완료' : `${cp.progress}%`}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-ink-500">
                      {s.clipUrl ? '🎬' : '⬜'} {s.ttsUrl ? '🔊' : '⬜'} {s.sfxUrl ? '🎵' : '⬜'}
                    </span>
                  )}
                  <button
                    onClick={() => onGenerateClip(s.id)}
                    disabled={!canGenerate}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold',
                      canGenerate
                        ? 'bg-coral-500 text-white hover:brightness-110'
                        : 'bg-ink-100 text-ink-300 cursor-not-allowed'
                    )}
                    title={
                      !s.videoPrompt
                        ? '먼저 AI 분석으로 프롬프트 생성'
                        : generating
                          ? '생성 중...'
                          : 'Grok image-to-video 클립 생성'
                    }
                  >
                    🎬
                  </button>
                  <button
                    onClick={() => setEditingSceneId(editingSceneId === s.id ? null : s.id)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold',
                      editingSceneId === s.id
                        ? 'bg-coral-100 text-coral-700'
                        : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                    )}
                    title="trim/자막/볼륨 편집"
                  >
                    ✏️
                  </button>
                </div>
              );
            })}
          </div>

          {/* 씬 편집기 (선택된 씬) */}
          {editingSceneId &&
            (() => {
              const s = project.scenes.find((x) => x.id === editingSceneId);
              if (!s) return null;
              return (
                <SceneEditor
                  bid={bid}
                  projectId={project.id}
                  scene={s}
                  allScenes={project.scenes}
                  onClose={() => setEditingSceneId(null)}
                />
              );
            })()}
          {/* 영상 결과 (있으면) */}
          {project.videoUrl && (
            <div className="bg-white rounded-md p-3 space-y-2 border border-success/30">
              <div className="text-xs font-bold text-success">✓ 렌더된 영상</div>
              <video
                src={project.videoUrl}
                controls
                preload="metadata"
                className="w-full rounded-md bg-black"
              />
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-coral-600 font-bold hover:underline"
              >
                ▶ 새 탭에서 열기
              </a>
            </div>
          )}

          {/* YouTube 결과 (있으면) */}
          {project.youtubeVideoId && (
            <div className="bg-white rounded-md p-3 space-y-1 border border-coral-300">
              <div className="text-xs font-bold text-coral-600">📺 YouTube 업로드됨</div>
              <a
                href={`https://youtu.be/${project.youtubeVideoId}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-coral-600 font-mono hover:underline break-all"
              >
                youtu.be/{project.youtubeVideoId}
              </a>
            </div>
          )}

          <YouTubeUploadModal
            bid={bid}
            projectId={project.id}
            defaultTitle={`동영상 ${project.id}`}
            hasVideo={!!project.videoUrl}
            open={ytOpen}
            onClose={() => setYtOpen(false)}
          />

          <CaptionsModal
            bid={bid}
            projectId={project.id}
            hasYouTubeVideo={!!project.youtubeVideoId}
            generatedLanguages={Object.keys(
              (project as { generatedCaptions?: Record<string, unknown> }).generatedCaptions ?? {}
            )}
            uploadedLanguages={
              ((project as { captionsUploaded?: string[] }).captionsUploaded ?? []) as string[]
            }
            baseLang={project.language}
            open={captionsOpen}
            onClose={() => setCaptionsOpen(false)}
          />

          <div className="flex justify-end gap-2 pt-2 flex-wrap">
            <button
              onClick={() => setYtOpen(true)}
              disabled={inProgress}
              className={cn(
                'px-3 py-1.5 rounded-md font-bold text-xs',
                inProgress
                  ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                  : project.youtubeVideoId
                    ? 'bg-success/10 text-success hover:bg-success/20'
                    : 'bg-coral-100 text-coral-700 hover:bg-coral-200'
              )}
              title={
                project.youtubeVideoId
                  ? `이미 업로드됨 (${project.youtubeVideoId}). 다시 업로드 또는 수동 연결.`
                  : 'YouTube 업로드 또는 수동 연결'
              }
            >
              📺 {project.youtubeVideoId ? 'YT 업로드됨' : 'YouTube'}
            </button>
            <button
              onClick={() => setCaptionsOpen(true)}
              disabled={inProgress}
              className={cn(
                'px-3 py-1.5 rounded-md font-bold text-xs',
                inProgress
                  ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                  : 'bg-peach-100 text-coral-700 hover:bg-peach-200'
              )}
              title="SRT 생성 + YouTube 자막 업로드"
            >
              📝 자막
            </button>
            {(() => {
              const readyClips = project.scenes.filter((s) => s.clipUrl).length;
              const renderInProgress =
                renderProgress && renderProgress.progress >= 0 && renderProgress.progress < 100;
              const canRender = readyClips > 0 && !inProgress && !renderInProgress;
              return (
                <button
                  onClick={onRender}
                  disabled={!canRender}
                  className={cn(
                    'px-3 py-1.5 rounded-md font-black text-xs',
                    canRender
                      ? 'bg-success text-white hover:brightness-110'
                      : 'bg-ink-100 text-ink-300 cursor-not-allowed'
                  )}
                  title={
                    readyClips === 0
                      ? '먼저 클립 생성'
                      : renderInProgress
                        ? '렌더 중...'
                        : `최종 영상 렌더 (${readyClips}개 씬)`
                  }
                >
                  {renderInProgress ? '🎞️ 렌더 중...' : '🎞️ 최종 렌더'}
                </button>
              );
            })()}
            <button
              onClick={onAnalyze}
              disabled={inProgress}
              className={cn(
                'px-3 py-1.5 rounded-md font-bold text-xs',
                inProgress
                  ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
                  : 'bg-coral-500 text-white hover:brightness-110'
              )}
              title="Gemini로 페이지별 영상 프롬프트 자동 생성"
            >
              {inProgress ? '분석 중...' : '🤖 AI 분석'}
            </button>
            <button
              onClick={onDelete}
              disabled={inProgress}
              className={cn(
                'px-3 py-1.5 rounded-md bg-danger/10 text-danger font-bold text-xs',
                inProgress ? 'cursor-not-allowed opacity-50' : 'hover:bg-danger/20'
              )}
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="font-mono text-[11px] text-ink-700">{label}</span>
      <span className="text-[9px] text-ink-500 uppercase tracking-wider">{hint}</span>
    </span>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
