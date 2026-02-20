import { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import type { AudiobookProject } from '@tangobook/shared';
import { useAudiobookGenerate } from '../hooks/useAudiobookGenerate';
import { audiobookApi } from '../api/audiobook.api';
import type { AudiobookProgress } from '../api/audiobook.api';
import { settingsApi } from '@/features/settings/api/settings.api';
import type { BgmItem } from '@/features/settings/api/settings.api';

interface AudiobookProjectCardProps {
  project: AudiobookProject;
  storybookId: string;
  totalPages: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<AudiobookProject>) => void;
  onDelete: () => void;
  storybookBgmUrl?: string;
}

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (유튜브)' },
  { value: '9:16', label: '9:16 (릴스/숏츠)' },
  { value: '3:4', label: '3:4 (인스타)' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1 (정사각형)' },
];

const SUBTITLE_COLORS = [
  { value: '#ffffff', label: '흰색' },
  { value: '#000000', label: '검정' },
  { value: '#ffff00', label: '노랑' },
  { value: '#00ffff', label: '하늘색' },
];

const SUBTITLE_BG_OPTIONS = [
  { value: '#00000080', label: '반투명 검정' },
  { value: '#000000cc', label: '진한 검정' },
  { value: '#00000000', label: '없음' },
  { value: '#ffffff40', label: '반투명 흰색' },
];

export function AudiobookProjectCard({
  project,
  storybookId,
  totalPages,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  storybookBgmUrl,
}: AudiobookProjectCardProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<AudiobookProgress | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generateMutation = useAudiobookGenerate();
  const [bgmLibrary, setBgmLibrary] = useState<BgmItem[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (expanded) {
      settingsApi
        .getBgmList()
        .then(setBgmLibrary)
        .catch(() => {});
    }
  }, [expanded]);

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewingId(null);
  };

  const togglePreview = (url: string, id: string) => {
    if (previewingId === id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(url);
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setPreviewingId(id);
  };

  const hasBgm = !!project.bgmUrl;

  const startProgressPolling = () => {
    setProgress({ progress: 0, step: '시작' });
    progressTimerRef.current = setInterval(async () => {
      try {
        const data = await audiobookApi.getProgress(project.id);
        if (data) setProgress(data);
      } catch {
        /* ignore */
      }
    }, 1500);
  };

  const stopProgressPolling = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    startProgressPolling();
    try {
      const result = await generateMutation.mutateAsync({
        storybookId,
        projectId: project.id,
      });
      onUpdate({ outputUrl: result.outputUrl, createdAt: new Date().toISOString() });
    } catch {
      // error handled by mutation
    } finally {
      stopProgressPolling();
      setGenerating(false);
    }
  };

  const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400';
  const selectClass =
    'text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100';
  const checkboxClass = 'w-3.5 h-3.5 accent-violet-600 cursor-pointer';

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
      {/* 헤더 (항상 보임) */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        onClick={onToggle}
      >
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-0 truncate"
        />

        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          {project.aspectRatio} | p.{project.startPage}-{project.endPage}
        </span>

        {project.outputUrl && <span className="text-xs text-emerald-500 shrink-0">생성완료</span>}

        {generating && progress ? (
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <span className="text-xs text-violet-600 whitespace-nowrap">{progress.progress}%</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGenerate();
            }}
            disabled={generating}
            className="px-3 py-1 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md transition-colors shrink-0"
          >
            생성
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors shrink-0"
          title="삭제"
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

      {/* 펼친 콘텐츠 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-5 border-t border-slate-100 dark:border-slate-700 pt-4">
          {/* 기본 설정 */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">기본 설정</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>비율</label>
                <select
                  value={project.aspectRatio}
                  onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                  className={`${selectClass} w-full mt-1`}
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>언어</label>
                <select
                  value={project.language}
                  onChange={(e) => onUpdate({ language: e.target.value })}
                  className={`${selectClass} w-full mt-1`}
                >
                  <option value="ko">한국어</option>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>표지 포함</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    checked={project.includeCover}
                    onChange={(e) => onUpdate({ includeCover: e.target.checked })}
                    className={checkboxClass}
                  />
                  {project.includeCover && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={project.coverDuration}
                        onChange={(e) => onUpdate({ coverDuration: Number(e.target.value) })}
                        min={1}
                        max={10}
                        className="w-12 text-sm border border-slate-200 rounded px-1.5 py-1 text-center dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                      />
                      <span className="text-xs text-slate-400 dark:text-slate-500">초</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>레이아웃</label>
                <select
                  value={project.layout}
                  onChange={(e) =>
                    onUpdate({ layout: e.target.value as AudiobookProject['layout'] })
                  }
                  className={`${selectClass} w-full mt-1`}
                >
                  <option value="fullscreen">전체화면 (이미지+자막 오버레이)</option>
                  <option value="split">분할 (텍스트/이미지/자막)</option>
                </select>
              </div>
            </div>
          </section>

          {/* 페이지 범위 */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              페이지 범위
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className={labelClass}>시작</label>
                <input
                  type="number"
                  value={project.startPage}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(project.endPage, Number(e.target.value)));
                    onUpdate({ startPage: v });
                  }}
                  min={1}
                  max={project.endPage}
                  className="w-16 text-sm border border-slate-200 rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>
              <span className="text-slate-400 dark:text-slate-500">~</span>
              <div className="flex items-center gap-1.5">
                <label className={labelClass}>끝</label>
                <input
                  type="number"
                  value={project.endPage}
                  onChange={(e) => {
                    const v = Math.max(
                      project.startPage,
                      Math.min(totalPages, Number(e.target.value))
                    );
                    onUpdate({ endPage: v });
                  }}
                  min={project.startPage}
                  max={totalPages}
                  className="w-16 text-sm border border-slate-200 rounded-md px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                / 총 {totalPages}페이지
              </span>
            </div>
          </section>

          {/* 오디오 설정 */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">오디오</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={project.includeTts}
                  onChange={(e) => onUpdate({ includeTts: e.target.checked })}
                  className={checkboxClass}
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">TTS 오디오</span>
              </label>

              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={project.includeBgm}
                  onChange={(e) => {
                    if (e.target.checked && !project.bgmUrl && storybookBgmUrl) {
                      onUpdate({ includeBgm: true, bgmUrl: storybookBgmUrl });
                    } else {
                      onUpdate({ includeBgm: e.target.checked });
                    }
                  }}
                  className={checkboxClass}
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">배경음악</span>
              </label>

              {project.includeBgm && (
                <div className="pl-5 space-y-3">
                  {/* 현재 선택된 BGM */}
                  {hasBgm && (
                    <div className="flex items-center gap-2 text-sm text-violet-600 bg-violet-50 dark:bg-violet-900/30 px-3 py-2 rounded-lg">
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <span className="truncate flex-1">{project.bgmUrl!.split('/').pop()}</span>
                      <button
                        onClick={() => onUpdate({ bgmUrl: undefined })}
                        className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors shrink-0"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* BGM 라이브러리 */}
                  {bgmLibrary.length > 0 && (
                    <div className="space-y-1.5">
                      <p className={labelClass}>라이브러리에서 선택</p>
                      {bgmLibrary.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                            project.bgmUrl === item.url
                              ? 'border-violet-300 bg-violet-50 dark:border-violet-600 dark:bg-violet-900/30'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <button
                            onClick={() => togglePreview(item.url, item.id)}
                            className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                          >
                            {previewingId === item.id ? (
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
                                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ) : (
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
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
                            {item.title}
                          </span>
                          {project.bgmUrl === item.url ? (
                            <span className="text-xs text-violet-600 font-medium shrink-0">
                              선택됨
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                stopPreview();
                                onUpdate({ bgmUrl: item.url });
                              }}
                              className="px-2 py-0.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors shrink-0"
                            >
                              선택
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 동화책 기본 BGM 사용 */}
                  {storybookBgmUrl && project.bgmUrl !== storybookBgmUrl && (
                    <button
                      onClick={() => onUpdate({ bgmUrl: storybookBgmUrl })}
                      className="text-xs text-violet-600 hover:text-violet-700 underline"
                    >
                      동화책 기본 배경음악 사용
                    </button>
                  )}

                  {/* 볼륨 */}
                  {hasBgm && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">볼륨</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={project.bgmVolume}
                        onChange={(e) => onUpdate({ bgmVolume: Number(e.target.value) })}
                        className="w-24 accent-violet-600"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-8">
                        {project.bgmVolume}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 자막 설정 */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">자막</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={project.includeSubtitles}
                  onChange={(e) => onUpdate({ includeSubtitles: e.target.checked })}
                  className={checkboxClass}
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">자막 표시</span>
              </label>

              {project.includeSubtitles && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-5">
                  <div>
                    <label className={labelClass}>글자색</label>
                    <select
                      value={project.subtitleColor}
                      onChange={(e) => onUpdate({ subtitleColor: e.target.value })}
                      className={`${selectClass} w-full mt-1`}
                    >
                      {SUBTITLE_COLORS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>크기</label>
                    <select
                      value={project.subtitleSize}
                      onChange={(e) =>
                        onUpdate({
                          subtitleSize: e.target.value as AudiobookProject['subtitleSize'],
                        })
                      }
                      className={`${selectClass} w-full mt-1`}
                    >
                      <option value="sm">작게</option>
                      <option value="md">보통</option>
                      <option value="lg">크게</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>위치</label>
                    <select
                      value={project.subtitlePosition}
                      onChange={(e) =>
                        onUpdate({
                          subtitlePosition: e.target.value as AudiobookProject['subtitlePosition'],
                        })
                      }
                      className={`${selectClass} w-full mt-1`}
                    >
                      <option value="top">상단</option>
                      <option value="center">중앙</option>
                      <option value="bottom">하단</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>배경</label>
                    <select
                      value={project.subtitleBg}
                      onChange={(e) => onUpdate({ subtitleBg: e.target.value })}
                      className={`${selectClass} w-full mt-1`}
                    >
                      {SUBTITLE_BG_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 생성 진행률 */}
          {generating && progress && (
            <div className="space-y-2 bg-violet-50 dark:bg-violet-900/30 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  오디오북 생성 중
                </span>
                <span className="text-sm text-violet-600">{progress.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <p className="text-xs text-violet-500 dark:text-violet-400">{progress.step}</p>
            </div>
          )}

          {/* 에러 표시 */}
          {generateMutation.error && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
              {generateMutation.error.message}
            </div>
          )}

          {/* 결과 플레이어 */}
          {project.outputUrl && (
            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">미리보기</h4>
              <video
                src={project.outputUrl}
                controls
                className="w-full max-w-lg rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                생성일:{' '}
                {project.createdAt ? new Date(project.createdAt).toLocaleString('ko-KR') : '-'}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
