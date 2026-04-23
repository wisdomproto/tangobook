import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Player } from '@remotion/player';
import { AudiobookComposition, calculateTotalFrames, RESOLUTIONS } from '@tangobook/remotion';
import type { AudiobookRenderProps } from '@tangobook/remotion';
import {
  SUPPORTED_LANGUAGES,
  buildAudiobookRenderData,
  YOUTUBE_CATEGORIES,
  YOUTUBE_PRIVACY_OPTIONS,
} from '@tangobook/shared';
import type {
  AudiobookProject,
  CoverImageItem,
  Storybook,
  YouTubeUploadMeta,
  YouTubePreset,
  YouTubeChannel,
} from '@tangobook/shared';
import { useTtsDurations } from '../hooks/useTtsDurations';
import { audiobookApi } from '../api/audiobook.api';
import type { AudiobookRenderProgress } from '../api/audiobook.api';
import { storybookApi } from '@/features/storybook';
import { settingsApi } from '@/features/settings/api/settings.api';
import type { BgmItem } from '@/features/settings/api/settings.api';

interface AudiobookProjectCardProps {
  project: AudiobookProject;
  storybook: Storybook;
  storybookId: string;
  totalPages: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<AudiobookProject>) => void;
  onDelete: () => void;
  onSave: () => void;
  storybookBgmUrl?: string;
  coverImages?: CoverImageItem[];
  defaultCoverImage?: string;
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

type SettingsTab = 'video' | 'audio' | 'subtitle';

export function AudiobookProjectCard({
  project,
  storybook,
  storybookId,
  totalPages,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onSave,
  storybookBgmUrl,
  coverImages,
  defaultCoverImage,
}: AudiobookProjectCardProps) {
  const [editingName, setEditingName] = useState(project.name);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState<AudiobookRenderProgress | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('video');

  useEffect(() => {
    setEditingName(project.name);
  }, [project.name]);
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

  const stopProgressPolling = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const nullCountRef = useRef(0);

  const startProgressPolling = () => {
    setProgress({ progress: 0, step: '시작' });
    setRenderError(null);
    nullCountRef.current = 0;
    progressTimerRef.current = setInterval(async () => {
      try {
        const data = await audiobookApi.getRenderProgress(project.id);
        if (data) {
          nullCountRef.current = 0;
          if (data.progress < 0) {
            stopProgressPolling();
            setRendering(false);
            setProgress(null);
            setRenderError(data.error || data.step || '렌더링에 실패했습니다.');
            return;
          }
          setProgress(data);
          if (data.progress >= 100) {
            stopProgressPolling();
            setRendering(false);
            setProgress(null);
            try {
              const sb = await storybookApi.getById(storybookId);
              const updatedProject = sb.audiobookProjects?.find((p) => p.id === project.id);
              if (updatedProject?.outputUrl) {
                onUpdate({
                  outputUrl: updatedProject.outputUrl,
                  createdAt: updatedProject.createdAt,
                });
              }
            } catch {
              /* ignore reload error */
            }
          }
        } else {
          // null = server lost progress state (crash/restart/TTL expired)
          nullCountRef.current++;
          if (nullCountRef.current >= 5) {
            stopProgressPolling();
            setRendering(false);
            setProgress(null);
            setRenderError('서버에서 렌더링 상태를 잃었습니다. 다시 시도해주세요.');
          }
        }
      } catch {
        /* ignore polling errors */
      }
    }, 1500);
  };

  const handleRender = async () => {
    onSave();
    await new Promise((r) => setTimeout(r, 500));
    setRendering(true);
    setRenderError(null);
    startProgressPolling();
    try {
      await audiobookApi.render({ storybookId, projectId: project.id });
    } catch (err: any) {
      stopProgressPolling();
      setRendering(false);
      setProgress(null);
      setRenderError(err?.message || '렌더링 요청에 실패했습니다.');
    }
  };

  // ----- YouTube state -----
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const [ytUploading, setYtUploading] = useState(false);
  const [ytProgress, setYtProgress] = useState<AudiobookRenderProgress | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [ytTitle, setYtTitle] = useState(project.name || '');
  const [ytDescription, setYtDescription] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted' | 'scheduled'>(
    'unlisted'
  );
  const [ytPublishAt, setYtPublishAt] = useState('');
  const [ytCategory, setYtCategory] = useState('27');
  const [ytTags, setYtTags] = useState('');
  const [ytLanguage, setYtLanguage] = useState(project.language || 'ko');

  const DEFAULT_YT_PROMPT = `당신은 YouTube 동화 채널 운영자입니다.
주어진 동화책 정보를 바탕으로 YouTube 업로드에 최적화된 설정값을 생성해주세요.

요구사항:
- title: SEO에 최적화된 매력적인 제목 (60자 이내)
- description: 동화 내용 요약 + 해시태그 포함 (500자 이내)
- tags: 검색 노출을 위한 관련 태그 10~15개
- privacy: "public" (공개)
- categoryId: "27" (교육)
- language: 동화책 언어에 맞게 설정`;

  const [aiPrompt, setAiPrompt] = useState(DEFAULT_YT_PROMPT);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [ytPresets, setYtPresets] = useState<YouTubePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);
  const [showYoutubeSection, setShowYoutubeSection] = useState(false);

  // Channel state
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Caption state
  const [captionLangs, setCaptionLangs] = useState<string[]>(project.captionLanguages ?? []);

  // Manual link state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkWarning, setLinkWarning] = useState<string | null>(null);
  const [captionUploading, setCaptionUploading] = useState(false);
  const [captionProgress, setCaptionProgress] = useState<AudiobookRenderProgress | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const captionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load YouTube channels on expand
  useEffect(() => {
    if (expanded && ytConnected === null) {
      audiobookApi
        .youtubeChannels()
        .then((channels) => {
          setYtChannels(channels);
          setYtConnected(channels.length > 0);
          if (channels.length > 0 && !selectedChannelId) {
            const uploadedId = project.youtubeUpload?.channelId;
            const preferred =
              uploadedId && channels.some((c) => c.id === uploadedId) ? uploadedId : channels[0].id;
            setSelectedChannelId(preferred);
          }
        })
        .catch(() => setYtConnected(false));
    }
  }, [expanded]);

  // Load presets on expand
  useEffect(() => {
    if (expanded && showYoutubeSection && ytPresets.length === 0) {
      audiobookApi
        .youtubePresets()
        .then(setYtPresets)
        .catch(() => {});
    }
  }, [expanded, showYoutubeSection]);

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (ytPollRef.current) clearInterval(ytPollRef.current);
      if (captionPollRef.current) clearInterval(captionPollRef.current);
    };
  }, []);

  const stopYtPolling = useCallback(() => {
    if (ytPollRef.current) {
      clearInterval(ytPollRef.current);
      ytPollRef.current = null;
    }
  }, []);

  const handleYoutubeConnect = async () => {
    try {
      const data = await audiobookApi.youtubeAuthUrl();
      window.location.href = data.url;
    } catch {
      setYtError('YouTube 연결 URL을 가져오지 못했습니다.');
    }
  };

  const handleGenerateMeta = async () => {
    setIsGeneratingMeta(true);
    setYtError(null);
    try {
      const meta = await audiobookApi.youtubeGenerateMeta({
        storybookId,
        projectId: project.id,
        prompt: aiPrompt,
      });
      setYtTitle(meta.title);
      setYtDescription(meta.description);
      setYtTags(meta.tags.join(', '));
      setYtPrivacy(meta.privacy);
      setYtCategory(meta.categoryId);
      setYtLanguage(meta.language);
    } catch (e) {
      setYtError(e instanceof Error ? e.message : 'AI 설정값 생성에 실패했습니다.');
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const handleLoadPreset = (preset: YouTubePreset) => {
    setAiPrompt(preset.prompt);
    setSelectedPresetId(preset.id);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      const created = await audiobookApi.createYoutubePreset({
        name: presetName.trim(),
        prompt: aiPrompt,
      });
      setYtPresets((prev) => [...prev, created]);
      setSelectedPresetId(created.id);
      setShowPresetSave(false);
      setPresetName('');
    } catch {
      /* ignore */
    }
  };

  const handleYoutubeUpload = async () => {
    if (ytPrivacy === 'scheduled' && !ytPublishAt) {
      setYtError('예약 공개 시간을 설정해주세요.');
      return;
    }
    if (ytPrivacy === 'scheduled' && new Date(ytPublishAt) <= new Date()) {
      setYtError('예약 시간은 현재보다 미래여야 합니다.');
      return;
    }
    setYtError(null);
    setYtUploading(true);
    setYtProgress({ progress: 0, step: '업로드 준비 중...' });

    let thumbnailUrl: string | undefined;
    try {
      const sb = await storybookApi.getById(storybookId);
      thumbnailUrl = sb.coverImage || undefined;
    } catch {
      /* ignore */
    }

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
      thumbnailUrl,
      ...(ytPrivacy === 'scheduled' && ytPublishAt
        ? { publishAt: new Date(ytPublishAt).toISOString() }
        : {}),
    };

    try {
      await audiobookApi.youtubeUpload({
        storybookId,
        projectId: project.id,
        meta,
        channelId: selectedChannelId || undefined,
      });

      ytPollRef.current = setInterval(async () => {
        try {
          const data = await audiobookApi.getYouTubeProgress(project.id);
          if (!data) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.audiobookProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload) onUpdate({ youtubeUpload: up.youtubeUpload });
              else setYtError('YouTube 업로드에 실패했습니다.');
            } catch {
              setYtError('업로드 결과를 확인할 수 없습니다.');
            }
            return;
          }
          if (data.progress < 0) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            setYtError(data.step || 'YouTube 업로드에 실패했습니다.');
            return;
          }
          setYtProgress({ progress: data.progress, step: data.step });
          if (data.progress >= 100) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.audiobookProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload) onUpdate({ youtubeUpload: up.youtubeUpload });
            } catch {
              /* ignore */
            }
          }
        } catch {
          /* ignore polling errors */
        }
      }, 2000);
    } catch (e) {
      setYtError(e instanceof Error ? e.message : 'YouTube 업로드 중 오류가 발생했습니다.');
      setYtUploading(false);
      setYtProgress(null);
    }
  };

  const toggleCaptionLang = (code: string) => {
    setCaptionLangs((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const stopCaptionPolling = useCallback(() => {
    if (captionPollRef.current) {
      clearInterval(captionPollRef.current);
      captionPollRef.current = null;
    }
  }, []);

  const handleLinkVideo = async () => {
    if (!linkUrl.trim()) return;
    setLinking(true);
    setLinkWarning(null);
    try {
      const result = await audiobookApi.youtubeLinkVideo({
        storybookId,
        projectId: project.id,
        videoUrl: linkUrl.trim(),
      });
      onUpdate({
        youtubeUpload: {
          videoId: result.videoId,
          videoUrl: result.videoUrl,
          uploadedAt: new Date().toISOString(),
          privacy: 'unknown',
        },
      });
      setLinkUrl('');
      setShowLinkInput(false);
      if (!result.ownerConnected) {
        setLinkWarning(
          `영상은 연결되었지만 소유 채널(${result.channelTitle ?? '?'})이 이 저작도구에 연결돼있지 않습니다. 자막 업로드를 하려면 해당 채널을 먼저 연결해주세요.`
        );
      }
      // Refresh to get actual privacy/date
      try {
        const updated = await storybookApi.getById(storybookId);
        const up = updated.audiobookProjects?.find((p) => p.id === project.id);
        if (up?.youtubeUpload) onUpdate({ youtubeUpload: up.youtubeUpload });
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setLinkWarning(e?.message || '연결 실패');
    } finally {
      setLinking(false);
    }
  };

  const handleUploadCaptions = async () => {
    if (selectedUploadLangs.length === 0) return;
    setCaptionError(null);
    setCaptionUploading(true);
    setCaptionProgress({ progress: 0, step: '자막 업로드 시작...' });

    try {
      await audiobookApi.youtubeUploadCaptions({
        storybookId,
        projectId: project.id,
        languages: selectedUploadLangs,
      });

      captionPollRef.current = setInterval(async () => {
        try {
          const data = await audiobookApi.getCaptionProgress(project.id);
          if (!data) {
            stopCaptionPolling();
            setCaptionUploading(false);
            setCaptionProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.audiobookProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload) {
                onUpdate({ youtubeUpload: up.youtubeUpload });
              }
            } catch {
              /* ignore */
            }
            return;
          }
          if (data.progress < 0) {
            stopCaptionPolling();
            setCaptionUploading(false);
            setCaptionProgress(null);
            setCaptionError(data.step || '자막 업로드에 실패했습니다.');
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.audiobookProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload) {
                onUpdate({ youtubeUpload: up.youtubeUpload });
              }
            } catch {
              /* ignore */
            }
            return;
          }
          setCaptionProgress({ progress: data.progress, step: data.step });
          if (data.progress >= 100) {
            stopCaptionPolling();
            setCaptionUploading(false);
            setCaptionProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.audiobookProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload) {
                onUpdate({ youtubeUpload: up.youtubeUpload });
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
      setCaptionError(e instanceof Error ? e.message : '자막 업로드 실패');
      setCaptionUploading(false);
      setCaptionProgress(null);
    }
  };

  const [captionGenerating, setCaptionGenerating] = useState(false);
  const [selectedUploadLangs, setSelectedUploadLangs] = useState<string[]>([]);
  const handleGenerateCaptions = async () => {
    setCaptionError(null);
    setCaptionGenerating(true);
    try {
      const { generatedCaptions } = await audiobookApi.generateCaptions({
        storybookId,
        projectId: project.id,
        languages: captionLangs,
      });
      const updated = await storybookApi.getById(storybookId);
      const up = updated.audiobookProjects?.find((p) => p.id === project.id);
      onUpdate({
        generatedCaptions: up?.generatedCaptions ?? generatedCaptions,
        captionLanguages: captionLangs,
      });
    } catch (e) {
      setCaptionError(e instanceof Error ? e.message : 'SRT 생성 실패');
    } finally {
      setCaptionGenerating(false);
    }
  };

  const downloadSrt = (lang: string, srt: string) => {
    const safeName = (project.name || 'captions').replace(/[\\/:*?"<>|]/g, '_');
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.${lang}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleUploadLang = (lang: string) =>
    setSelectedUploadLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );

  // Available languages — only show languages that have TTS/translations
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

  // Remotion Player data — probe TTS durations for accurate preview timing
  const rawRenderData = buildAudiobookRenderData(storybook, project);
  const { data: renderData, loading: ttsLoading } = useTtsDurations(rawRenderData);
  const totalFrames = calculateTotalFrames(renderData as AudiobookRenderProps);
  const resolution = RESOLUTIONS[renderData.aspectRatio] ?? RESOLUTIONS['16:9'];

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
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={() => {
            if (editingName !== project.name) onUpdate({ name: editingName });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing)
              (e.target as HTMLInputElement).blur();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-0 truncate"
        />

        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          {project.aspectRatio} | p.{project.startPage}-{project.endPage}
        </span>

        {project.outputUrl && <span className="text-xs text-emerald-500 shrink-0">생성완료</span>}

        {renderError && (
          <span
            className="text-xs text-red-500 shrink-0 truncate max-w-[200px]"
            title={renderError}
          >
            실패
          </span>
        )}

        {rendering && progress ? (
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
              handleRender();
            }}
            disabled={rendering}
            className="px-3 py-1 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md transition-colors shrink-0"
          >
            렌더링
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
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
          {/* 언어 선택 (pill 버튼) — 최상단 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={labelClass}>언어</span>
            <div className="flex gap-1.5 flex-wrap">
              {availableLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => onUpdate({ language: l.code })}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    project.language === l.code
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/30'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2컬럼: 왼쪽 프리뷰 + 오른쪽 설정 */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* 왼쪽: 프리뷰 영상 */}
            <div className="w-full md:w-[45%] md:sticky md:top-4 md:self-start space-y-2">
              {renderData.slides.length > 0 ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {ttsLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-white gap-2">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">TTS 로딩 중...</span>
                    </div>
                  )}
                  <Player
                    component={AudiobookComposition}
                    inputProps={renderData as AudiobookRenderProps}
                    durationInFrames={Math.max(totalFrames, 30)}
                    compositionWidth={resolution.width}
                    compositionHeight={resolution.height}
                    fps={30}
                    controls
                    style={{ width: '100%' }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  삽화가 있는 페이지가 없습니다
                </div>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                {renderData.aspectRatio} · {renderData.slides.length}장 ·{' '}
                {Math.round(totalFrames / 30)}초
              </p>
            </div>

            {/* 오른쪽: 설정 패널 */}
            <div className="w-full md:w-[55%] space-y-4">
              {/* 설정 탭 */}
              <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                {[
                  { id: 'video' as SettingsTab, label: '영상' },
                  { id: 'audio' as SettingsTab, label: '오디오' },
                  { id: 'subtitle' as SettingsTab, label: '자막' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                      settingsTab === tab.id
                        ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 영상 탭 */}
              {settingsTab === 'video' && (
                <div className="space-y-4">
                  <section className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                                onChange={(e) =>
                                  onUpdate({ coverDuration: Number(e.target.value) })
                                }
                                min={1}
                                max={10}
                                className="w-12 text-sm border border-slate-200 rounded px-1.5 py-1 text-center dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                              />
                              <span className="text-xs text-slate-400 dark:text-slate-500">초</span>
                            </div>
                          )}
                        </div>
                        {project.includeCover && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              checked={project.showCoverTitle !== false}
                              onChange={(e) => onUpdate({ showCoverTitle: e.target.checked })}
                              className={checkboxClass}
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              제목 표시
                            </span>
                          </div>
                        )}
                        {/* 표지 선택 */}
                        {project.includeCover &&
                          coverImages &&
                          coverImages.filter((c) => c.imageUrl).length >= 1 && (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                표지 선택
                              </p>
                              <div className="flex gap-1.5 flex-wrap">
                                {coverImages
                                  .filter((c) => c.imageUrl)
                                  .map((item) => {
                                    const isSelected = project.coverImageUrl
                                      ? project.coverImageUrl === item.imageUrl
                                      : item.imageUrl === defaultCoverImage;
                                    return (
                                      <button
                                        key={item.id}
                                        onClick={() => onUpdate({ coverImageUrl: item.imageUrl })}
                                        className={`w-12 h-14 rounded border-2 overflow-hidden transition-colors ${
                                          isSelected
                                            ? 'border-violet-500 ring-1 ring-violet-300'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                                        }`}
                                      >
                                        <img
                                          src={item.imageUrl}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
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
                            const v = Math.max(
                              1,
                              Math.min(project.endPage, Number(e.target.value))
                            );
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

                  {/* 효과 */}
                  <section className="space-y-3">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={project.enableParticles ?? true}
                        onChange={(e) => onUpdate({ enableParticles: e.target.checked })}
                        className={checkboxClass}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        반짝이 파티클 효과
                      </span>
                    </label>
                  </section>
                </div>
              )}

              {/* 오디오 탭 */}
              {settingsTab === 'audio' && (
                <section className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
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
                            <span className="truncate flex-1">
                              {decodeURIComponent(project.bgmUrl!.split('/').pop() ?? '')}
                            </span>
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
                                <button
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        `"${item.title}" 배경음악을 라이브러리에서 삭제할까요?`
                                      )
                                    )
                                      return;
                                    try {
                                      await settingsApi.deleteBgm(item.id);
                                      setBgmLibrary((prev) => prev.filter((b) => b.id !== item.id));
                                      if (project.bgmUrl === item.url)
                                        onUpdate({ bgmUrl: undefined });
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
              )}

              {/* 자막 탭 */}
              {settingsTab === 'subtitle' && (
                <section className="space-y-3">
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
                                subtitlePosition: e.target
                                  .value as AudiobookProject['subtitlePosition'],
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

                        {/* 단어 그룹 */}
                        <div className="col-span-2 sm:col-span-4 flex items-center gap-3">
                          <label className={labelClass}>단어 표시</label>
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={project.subtitleWordsPerGroup ?? 2}
                            onChange={(e) =>
                              onUpdate({ subtitleWordsPerGroup: Number(e.target.value) })
                            }
                            className="w-24 accent-violet-600"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {project.subtitleWordsPerGroup ?? 2}단어씩
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
            {/* 오른쪽 설정 패널 끝 */}
          </div>
          {/* 2컬럼 flex 끝 */}

          {/* 렌더링 진행률 */}
          {rendering && progress && (
            <div className="space-y-2 bg-violet-50 dark:bg-violet-900/30 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  렌더링 중
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
          {renderError && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
              {renderError}
            </div>
          )}

          {/* 렌더링 결과 + YouTube 업로드 */}
          {project.outputUrl && !rendering && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">결과</h4>
              <video
                src={project.outputUrl}
                controls
                className="w-full max-w-lg rounded-lg border border-slate-200 dark:border-slate-700"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={project.outputUrl}
                  download
                  className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                >
                  다운로드
                </a>
                <button
                  onClick={async () => {
                    if (!confirm('렌더링된 영상을 삭제하시겠습니까?')) return;
                    try {
                      await audiobookApi.deleteRender({ storybookId, projectId: project.id });
                      onUpdate({ outputUrl: undefined });
                      onSave();
                    } catch (e: any) {
                      alert(e.message || '삭제 실패');
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={() => setShowYoutubeSection((v) => !v)}
                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  YouTube {showYoutubeSection ? '▲' : '▼'}
                </button>
                {project.youtubeUpload && (
                  <a
                    href={project.youtubeUpload.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-500 hover:underline"
                  >
                    ▶ YouTube에서 보기
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                생성일:{' '}
                {project.createdAt ? new Date(project.createdAt).toLocaleString('ko-KR') : '-'}
              </p>

              {/* YouTube 업로드 섹션 */}
              {showYoutubeSection && (
                <div className="space-y-4 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10">
                  <h5 className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.81zM9.54 15.57V8.44L15.82 12l-6.28 3.57z" />
                    </svg>
                    YouTube 업로드
                  </h5>

                  {/* 업로드 완료 카드 */}
                  {project.youtubeUpload && (
                    <div className="px-3 py-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                        업로드 완료
                      </p>
                      <a
                        href={project.youtubeUpload.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 underline hover:no-underline break-all"
                      >
                        {project.youtubeUpload.videoUrl}
                      </a>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(project.youtubeUpload.uploadedAt).toLocaleString()} ·{' '}
                        {project.youtubeUpload.publishAt
                          ? `예약: ${new Date(project.youtubeUpload.publishAt).toLocaleString()}`
                          : project.youtubeUpload.privacy}
                      </p>
                      <button
                        onClick={() => {
                          if (
                            !window.confirm(
                              '업로드 정보 연결을 해제하시겠습니까? (YouTube 영상은 삭제되지 않습니다)'
                            )
                          )
                            return;
                          onUpdate({ youtubeUpload: undefined });
                        }}
                        className="text-[10px] text-slate-400 hover:text-red-500 mt-1"
                      >
                        연결 해제
                      </button>
                    </div>
                  )}

                  {/* 수동 연결 */}
                  {!project.youtubeUpload && (
                    <div className="space-y-1.5">
                      {!showLinkInput ? (
                        <button
                          onClick={() => setShowLinkInput(true)}
                          className="text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 underline"
                        >
                          외부에서 올린 YouTube 영상이 있다면 수동으로 연결
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="YouTube URL 또는 영상 ID"
                            className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-slate-100"
                          />
                          <button
                            onClick={handleLinkVideo}
                            disabled={linking || !linkUrl.trim()}
                            className="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md transition-colors"
                          >
                            {linking ? '연결 중...' : '연결'}
                          </button>
                          <button
                            onClick={() => {
                              setShowLinkInput(false);
                              setLinkUrl('');
                              setLinkWarning(null);
                            }}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            취소
                          </button>
                        </div>
                      )}
                      {linkWarning && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          {linkWarning}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 채널 선택 */}
                  {ytChannels.length === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        YouTube 채널이 연결되지 않았습니다. 롱폼 탭에서 채널을 추가하세요.
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* 채널 선택 */}
                      {ytChannels.length > 1 && (
                        <div className="flex items-center gap-2">
                          <label className={labelClass}>업로드 채널</label>
                          <select
                            value={selectedChannelId}
                            onChange={(e) => setSelectedChannelId(e.target.value)}
                            className={`${selectClass} flex-1`}
                          >
                            {ytChannels.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.channelTitle || ch.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* AI 설정값 생성 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={handleGenerateMeta}
                            disabled={isGeneratingMeta}
                            className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md transition-colors"
                          >
                            {isGeneratingMeta ? 'AI 생성 중...' : '🤖 AI 설정값 생성'}
                          </button>
                          <button
                            onClick={() => setShowPromptEditor((v) => !v)}
                            className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md transition-colors"
                          >
                            프롬프트 {showPromptEditor ? '접기' : '편집'}
                          </button>
                        </div>

                        {/* 프리셋 선택 */}
                        {ytPresets.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              프리셋:
                            </span>
                            {ytPresets.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleLoadPreset(p)}
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                  selectedPresetId === p.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-800'
                                }`}
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {showPromptEditor && (
                          <div className="space-y-2">
                            <textarea
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              rows={6}
                              className="w-full text-xs border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 dark:text-slate-100 resize-y focus:outline-none focus:ring-1 focus:ring-violet-300"
                            />
                            <div className="flex items-center gap-2">
                              {showPresetSave ? (
                                <>
                                  <input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="프리셋 이름"
                                    className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 dark:text-slate-100"
                                  />
                                  <button
                                    onClick={handleSavePreset}
                                    className="px-2 py-1 text-xs bg-violet-600 text-white rounded"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => setShowPresetSave(false)}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    취소
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setShowPresetSave(true)}
                                  className="text-xs text-violet-600 hover:underline"
                                >
                                  프리셋으로 저장
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 업로드 폼 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className={labelClass}>제목</label>
                          <input
                            type="text"
                            value={ytTitle}
                            onChange={(e) => setYtTitle(e.target.value)}
                            className={`${selectClass} w-full mt-1`}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>설명</label>
                          <textarea
                            value={ytDescription}
                            onChange={(e) => setYtDescription(e.target.value)}
                            rows={3}
                            className={`${selectClass} w-full mt-1 resize-y`}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>공개 설정</label>
                          <select
                            value={ytPrivacy}
                            onChange={(e) => setYtPrivacy(e.target.value as any)}
                            className={`${selectClass} w-full mt-1`}
                          >
                            {YOUTUBE_PRIVACY_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {ytPrivacy === 'scheduled' && (
                          <div className="sm:col-span-2">
                            <label className={labelClass}>예약 공개 시간</label>
                            <input
                              type="datetime-local"
                              value={ytPublishAt}
                              onChange={(e) => setYtPublishAt(e.target.value)}
                              min={new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)}
                              className={`${selectClass} w-full mt-1`}
                            />
                            <p className="mt-1 text-xs text-slate-400">
                              최소 10분 이후 시간으로 설정해주세요
                            </p>
                          </div>
                        )}
                        <div>
                          <label className={labelClass}>카테고리</label>
                          <select
                            value={ytCategory}
                            onChange={(e) => setYtCategory(e.target.value)}
                            className={`${selectClass} w-full mt-1`}
                          >
                            {YOUTUBE_CATEGORIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>언어</label>
                          <select
                            value={ytLanguage}
                            onChange={(e) => setYtLanguage(e.target.value)}
                            className={`${selectClass} w-full mt-1`}
                          >
                            {SUPPORTED_LANGUAGES.map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>태그 (쉼표 구분)</label>
                          <input
                            type="text"
                            value={ytTags}
                            onChange={(e) => setYtTags(e.target.value)}
                            placeholder="동화, 오디오북, 유아교육"
                            className={`${selectClass} w-full mt-1`}
                          />
                        </div>
                      </div>

                      {/* YouTube 진행률 */}
                      {ytUploading && ytProgress && (
                        <div className="space-y-2 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-red-700 dark:text-red-300">
                              업로드 중
                            </span>
                            <span className="text-xs text-red-600">{ytProgress.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full transition-all duration-500"
                              style={{ width: `${ytProgress.progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-red-500 dark:text-red-400">
                            {ytProgress.step}
                          </p>
                        </div>
                      )}

                      {/* YouTube 에러 */}
                      {ytError && (
                        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                          {ytError}
                        </div>
                      )}

                      {/* 업로드 버튼 */}
                      <button
                        onClick={handleYoutubeUpload}
                        disabled={ytUploading || !ytTitle.trim()}
                        className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-md transition-colors font-medium"
                      >
                        {ytUploading ? 'YouTube 업로드 중...' : 'YouTube에 업로드'}
                      </button>

                      {/* 자막 (Caption) 섹션 — 영상 업로드 완료 후만 */}
                      {project.youtubeUpload?.videoId && (
                        <div className="space-y-3 border-t border-red-200 dark:border-red-800 pt-4 mt-2">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            다국어 자막
                          </h4>

                          {/* Step 1: 생성할 언어 선택 */}
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              1. 생성할 추가 언어 선택 (기본 언어는 자동 포함)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <label className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-xs text-violet-700 dark:text-violet-300">
                                <input
                                  type="checkbox"
                                  checked
                                  disabled
                                  className="w-3 h-3 accent-violet-600"
                                />
                                {project.language === 'ko'
                                  ? '한국어'
                                  : SUPPORTED_LANGUAGES.find((l) => l.code === project.language)
                                      ?.label || project.language}
                                <span className="text-[10px] text-violet-400">(기본)</span>
                              </label>
                              {SUPPORTED_LANGUAGES.filter((l) => l.code !== project.language).map(
                                (lang) => (
                                  <label
                                    key={lang.code}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                                      captionLangs.includes(lang.code)
                                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={captionLangs.includes(lang.code)}
                                      onChange={() => toggleCaptionLang(lang.code)}
                                      className="w-3 h-3 accent-violet-600"
                                    />
                                    {lang.label}
                                  </label>
                                )
                              )}
                            </div>
                            <button
                              onClick={handleGenerateCaptions}
                              disabled={captionGenerating || captionUploading}
                              className="px-4 py-1.5 text-xs bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md transition-colors"
                            >
                              {captionGenerating ? 'SRT 생성 중...' : 'SRT 생성'}
                            </button>
                          </div>

                          {/* Step 2: 생성된 SRT 목록 */}
                          {project.generatedCaptions &&
                            Object.keys(project.generatedCaptions).length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  2. 업로드할 언어 선택 / 다운로드
                                </p>
                                <div className="space-y-1">
                                  {Object.entries(project.generatedCaptions).map(([lang, cap]) => {
                                    const uploadedOk =
                                      project.youtubeUpload?.captionsUploaded?.includes(lang);
                                    const failed = project.youtubeUpload?.captionsFailed?.find(
                                      (f) => f.lang === lang
                                    );
                                    const label =
                                      SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label ||
                                      lang;
                                    return (
                                      <div
                                        key={lang}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-xs"
                                      >
                                        <label className="flex items-center gap-1.5 cursor-pointer flex-1">
                                          <input
                                            type="checkbox"
                                            checked={selectedUploadLangs.includes(lang)}
                                            onChange={() => toggleUploadLang(lang)}
                                            className="w-3 h-3 accent-violet-600"
                                          />
                                          <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {label}
                                          </span>
                                          <span className="text-[10px] text-slate-400">
                                            ({new Date(cap.generatedAt).toLocaleString()})
                                          </span>
                                          {uploadedOk && (
                                            <span className="text-emerald-500">✓</span>
                                          )}
                                          {failed && (
                                            <span className="text-red-500" title={failed.error}>
                                              ✗
                                            </span>
                                          )}
                                        </label>
                                        <button
                                          onClick={() => downloadSrt(lang, cap.srt)}
                                          className="px-2 py-0.5 text-[11px] bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded"
                                        >
                                          다운로드
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* 자막 진행률 */}
                          {captionUploading && captionProgress && (
                            <div className="space-y-1.5 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                                  자막 업로드 중
                                </span>
                                <span className="text-xs text-violet-600">
                                  {captionProgress.progress}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                                  style={{ width: `${captionProgress.progress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-violet-500">{captionProgress.step}</p>
                            </div>
                          )}

                          {captionError && (
                            <p className="text-xs text-red-500 break-all">{captionError}</p>
                          )}

                          {project.youtubeUpload?.captionsFailed &&
                            project.youtubeUpload.captionsFailed.length > 0 &&
                            !captionUploading && (
                              <div className="space-y-0.5 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded">
                                <p className="text-xs text-red-600 font-medium">
                                  업로드 실패:{' '}
                                  {project.youtubeUpload.captionsFailed
                                    .map((f) => f.lang)
                                    .join(', ')}
                                </p>
                                {project.youtubeUpload.captionsFailed.map((f) => (
                                  <p key={f.lang} className="text-[10px] text-red-500 break-all">
                                    {f.lang}: {f.error}
                                  </p>
                                ))}
                              </div>
                            )}

                          <button
                            onClick={handleUploadCaptions}
                            disabled={
                              captionUploading ||
                              captionGenerating ||
                              selectedUploadLangs.length === 0
                            }
                            className="px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-md transition-colors"
                          >
                            {captionUploading
                              ? '자막 업로드 중...'
                              : `선택한 ${selectedUploadLangs.length}개 YouTube 업로드`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
