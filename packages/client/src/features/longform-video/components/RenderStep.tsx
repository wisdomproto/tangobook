import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  LongformProject,
  YouTubeUploadMeta,
  YouTubePreset,
  YouTubeChannel,
} from '@tangobook/shared';
import {
  YOUTUBE_CATEGORIES,
  YOUTUBE_PRIVACY_OPTIONS,
  SUPPORTED_LANGUAGES,
} from '@tangobook/shared';
import { Button } from '@/components/Button';
import { DownloadButton } from '@/components/DownloadButton';
import { storybookApi } from '@/features/storybook';
import { longformApi, ytPresetApi } from '../api/longform.api';

interface RenderStepProps {
  storybookId: string;
  project: LongformProject;
  allProjects: LongformProject[];
  onUpdate: (
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onUpdateProject: (
    projectId: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onSelectVersion: (projectId: string) => void;
}

const ASPECT_LABELS: Record<string, string> = {
  '16:9': '1920 × 1080 (16:9)',
  '9:16': '1080 × 1920 (9:16)',
  '1:1': '1080 × 1080 (1:1)',
};

const DEFAULT_YT_PROMPT = `당신은 YouTube 동화 채널 운영자입니다.
주어진 동화책 정보를 바탕으로 YouTube 업로드에 최적화된 설정값을 생성해주세요.

요구사항:
- title: SEO에 최적화된 매력적인 제목 (60자 이내)
- description: 동화 내용 요약 + 해시태그 포함 (500자 이내)
- tags: 검색 노출을 위한 관련 태그 10~15개
- privacy: "public" (공개)
- categoryId: "27" (교육)
- language: 동화책 언어에 맞게 설정`;

export function RenderStep({
  storybookId,
  project,
  allProjects,
  onUpdate,
  onUpdateProject,
  onSelectVersion,
}: RenderStepProps) {
  // ----- Render state -----
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<{ progress: number; step: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- Shortform state -----
  const [sfRendering, setSfRendering] = useState(false);
  const [sfProgress, setSfProgress] = useState<{ progress: number; step: string } | null>(null);
  const [sfError, setSfError] = useState<string | null>(null);
  const sfPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- YouTube state -----
  const [ytChannels, setYtChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [ytConnected, setYtConnected] = useState<boolean | null>(null);
  const [ytUploading, setYtUploading] = useState(false);
  const [ytProgress, setYtProgress] = useState<{ progress: number; step: string } | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const ytPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual link state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkWarning, setLinkWarning] = useState<string | null>(null);

  // YouTube form state (AI가 생성한 값이 들어감)
  const [ytTitle, setYtTitle] = useState(project.name || '');
  const [ytDescription, setYtDescription] = useState('');
  const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted' | 'scheduled'>(
    'unlisted'
  );
  const [ytPublishAt, setYtPublishAt] = useState('');
  const [ytCategory, setYtCategory] = useState('27');
  const [ytTags, setYtTags] = useState('');
  const [ytLanguage, setYtLanguage] = useState(project.language || 'ko');

  // AI 프롬프트 상태
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_YT_PROMPT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // 프리셋 상태
  const [ytPresets, setYtPresets] = useState<YouTubePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);

  // Caption state
  const [captionLangs, setCaptionLangs] = useState<string[]>(project.captionLanguages ?? []);
  const [captionUploading, setCaptionUploading] = useState(false);
  const [captionProgress, setCaptionProgress] = useState<{ progress: number; step: string } | null>(
    null
  );
  const [captionError, setCaptionError] = useState<string | null>(null);
  const captionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load YouTube presets
  useEffect(() => {
    ytPresetApi
      .list()
      .then(setYtPresets)
      .catch(() => {});
  }, []);

  // ----- 프리셋 핸들러 (프롬프트 기반) -----
  const handleLoadPreset = (preset: YouTubePreset) => {
    setAiPrompt(preset.prompt);
    setSelectedPresetId(preset.id);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      if (selectedPresetId) {
        const updated = await ytPresetApi.update(selectedPresetId, {
          name: presetName.trim(),
          prompt: aiPrompt,
        });
        setYtPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await ytPresetApi.create({
          name: presetName.trim(),
          prompt: aiPrompt,
        });
        setYtPresets((prev) => [...prev, created]);
        setSelectedPresetId(created.id);
      }
      setShowPresetSave(false);
      setPresetName('');
    } catch {
      /* ignore */
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await ytPresetApi.remove(id);
      setYtPresets((prev) => prev.filter((p) => p.id !== id));
      if (selectedPresetId === id) {
        setSelectedPresetId('');
        setAiPrompt(DEFAULT_YT_PROMPT);
      }
    } catch {
      /* ignore */
    }
  };

  // ----- AI 설정값 생성 -----
  const handleGenerateMeta = async () => {
    setIsGenerating(true);
    setYtError(null);
    try {
      const meta = await longformApi.generateYouTubeMeta({
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
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (ytPollRef.current) clearInterval(ytPollRef.current);
      if (captionPollRef.current) clearInterval(captionPollRef.current);
    };
  }, []);

  // Load YouTube channels on mount
  const loadChannels = useCallback(() => {
    longformApi
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
  }, [project.youtubeUpload?.channelId]);

  useEffect(() => {
    loadChannels();
  }, []);

  // Resume polling if render is in progress when component mounts
  useEffect(() => {
    let cancelled = false;
    longformApi
      .getRenderProgress(project.id)
      .then((data) => {
        if (cancelled || !data || data.progress >= 100) return;
        setIsRendering(true);
        setProgress({ progress: data.progress, step: data.step });
        pollingRef.current = setInterval(async () => {
          try {
            const d = await longformApi.getRenderProgress(project.id);
            if (!d) {
              stopPolling();
              setIsRendering(false);
              setProgress(null);
              try {
                const updated = await storybookApi.getById(storybookId);
                const up = updated.longformProjects?.find((p) => p.id === project.id);
                if (up?.outputUrl) onUpdate({ outputUrl: up.outputUrl });
              } catch {
                /* ignore */
              }
              return;
            }
            setProgress({ progress: d.progress, step: d.step });
            if (d.progress >= 100) {
              stopPolling();
              setIsRendering(false);
              setProgress(null);
              try {
                const updated = await storybookApi.getById(storybookId);
                const up = updated.longformProjects?.find((p) => p.id === project.id);
                if (up?.outputUrl) onUpdate({ outputUrl: up.outputUrl });
              } catch {
                /* ignore */
              }
            }
          } catch {
            /* ignore */
          }
        }, 2000);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project.id]);

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
  const handleServerRender = async () => {
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
              } else {
                setError('렌더링이 완료되지 않았습니다. 다시 시도해주세요.');
              }
            } catch {
              setError('렌더링 상태를 확인할 수 없습니다.');
            }
            return;
          }

          // Error from server (progress: -1)
          if (data.progress < 0) {
            stopPolling();
            setIsRendering(false);
            setProgress(null);
            setError(data.step || '렌더링 중 오류가 발생했습니다.');
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
      setError(e instanceof Error ? e.message : '서버 렌더링 실패');
      setIsRendering(false);
      setProgress(null);
    }
  };

  const handleRender = async () => {
    setError(null);
    setIsRendering(true);
    setProgress({ progress: 0, step: '렌더링 시작 중...' });
    await handleServerRender();
  };

  const handleCancel = async () => {
    try {
      await longformApi.cancelRender(project.id);
    } catch {
      /* ignore */
    }
    stopPolling();
    setIsRendering(false);
    setProgress(null);
  };

  // ----- Shortform handlers -----
  const stopSfPolling = useCallback(() => {
    if (sfPollRef.current) {
      clearInterval(sfPollRef.current);
      sfPollRef.current = null;
    }
  }, []);

  const handleShortformRender = async () => {
    setSfRendering(true);
    setSfError(null);
    setSfProgress({ progress: 0, step: '시작' });

    sfPollRef.current = setInterval(async () => {
      try {
        const data = await longformApi.getShortformProgress(project.id);
        if (data) {
          if (data.progress < 0) {
            stopSfPolling();
            setSfRendering(false);
            setSfProgress(null);
            setSfError(data.error || data.step || '숏폼 렌더링 실패');
            return;
          }
          setSfProgress(data);
          if (data.progress >= 100) {
            stopSfPolling();
            setSfRendering(false);
            setSfProgress(null);
            try {
              const sb = await storybookApi.getById(storybookId);
              const updated = sb.longformProjects?.find((p) => p.id === project.id);
              if (updated?.shortformOutputUrl) {
                onUpdate({ shortformOutputUrl: updated.shortformOutputUrl });
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* ignore */
      }
    }, 1500);

    try {
      await longformApi.renderShortform({ storybookId, projectId: project.id });
    } catch (err: any) {
      stopSfPolling();
      setSfRendering(false);
      setSfProgress(null);
      setSfError(err?.message || '숏폼 렌더링 요청 실패');
    }
  };

  useEffect(() => {
    return () => {
      if (sfPollRef.current) clearInterval(sfPollRef.current);
    };
  }, []);

  // ----- YouTube handlers -----
  const handleAddChannel = async () => {
    try {
      const name = newChannelName.trim() || undefined;
      const data = await longformApi.youtubeAuthUrl(name);
      window.location.href = data.url;
    } catch {
      setYtError('YouTube 연결 URL을 가져오지 못했습니다.');
    }
  };

  const handleRemoveChannel = async (channelId: string, channelName: string) => {
    if (!window.confirm(`"${channelName}" 채널 연결을 해제하시겠습니까?`)) return;
    try {
      await longformApi.youtubeRemoveChannel(channelId);
      loadChannels();
    } catch {
      setYtError('채널 삭제에 실패했습니다.');
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

    // Get cover image for thumbnail
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
      await longformApi.youtubeUpload({
        storybookId,
        projectId: project.id,
        meta,
        channelId: selectedChannelId || undefined,
      });

      ytPollRef.current = setInterval(async () => {
        try {
          const data = await longformApi.getYouTubeProgress(project.id);
          if (!data) {
            stopYtPolling();
            setYtUploading(false);
            setYtProgress(null);
            // progress 없으면 완료 또는 실패 — storybook에서 결과 확인
            try {
              const updated = await storybookApi.getById(storybookId);
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.youtubeUpload) {
                onUpdate({ youtubeUpload: updatedProject.youtubeUpload });
              } else {
                setYtError('YouTube 업로드에 실패했습니다. 다시 시도해주세요.');
              }
            } catch {
              setYtError('업로드 결과를 확인할 수 없습니다.');
            }
            return;
          }

          // 실패 감지 (progress < 0)
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
              const updatedProject = updated.longformProjects?.find((p) => p.id === project.id);
              if (updatedProject?.youtubeUpload) {
                onUpdate({ youtubeUpload: updatedProject.youtubeUpload });
              }
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

  // ----- Caption handlers -----
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
      const result = await longformApi.youtubeLinkVideo({
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
          `영상이 연결되었지만 소유 채널(${result.channelTitle ?? '?'})이 이 저작도구에 연결돼있지 않습니다. 자막 업로드를 하려면 해당 채널을 먼저 연결해주세요.`
        );
      }
      // Refresh from server to get actual privacy/date
      try {
        const updated = await storybookApi.getById(storybookId);
        const up = updated.longformProjects?.find((p) => p.id === project.id);
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
      await longformApi.youtubeUploadCaptions({
        storybookId,
        projectId: project.id,
        languages: selectedUploadLangs,
        channelId: selectedChannelId || undefined,
      });

      captionPollRef.current = setInterval(async () => {
        try {
          const data = await longformApi.getCaptionProgress(project.id);
          if (!data) {
            stopCaptionPolling();
            setCaptionUploading(false);
            setCaptionProgress(null);
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.longformProjects?.find((p) => p.id === project.id);
              if (up?.youtubeUpload?.captionsUploaded) {
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
            setCaptionError(data.step || '자막 업로드 실패');
            try {
              const updated = await storybookApi.getById(storybookId);
              const up = updated.longformProjects?.find((p) => p.id === project.id);
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
              const up = updated.longformProjects?.find((p) => p.id === project.id);
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
    if (captionLangs.length === 0 && !project.language) return;
    setCaptionError(null);
    setCaptionGenerating(true);
    try {
      const { generatedCaptions } = await longformApi.generateCaptions({
        storybookId,
        projectId: project.id,
        languages: captionLangs,
      });
      // Refresh project with new generatedCaptions
      const updated = await storybookApi.getById(storybookId);
      const up = updated.longformProjects?.find((p) => p.id === project.id);
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

  const clipCount = project.scenes.filter((s) => s.clipUrl).length;
  const totalScenes = project.scenes.length;
  const canRender = totalScenes > 0 && clipCount === totalScenes && !isRendering;

  return (
    <div className="space-y-5">
      {/* Version tabs */}
      {allProjects.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {allProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectVersion(p.id)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                p.id === project.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400'
              }`}
            >
              {p.name}
              <span className="ml-1 text-xs opacity-50">{p.language?.toUpperCase() ?? 'KO'}</span>
              {p.outputUrl && <span className="ml-1 text-green-500">✓</span>}
            </button>
          ))}
        </div>
      )}

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
            <button
              onClick={async () => {
                if (!window.confirm('렌더링 결과를 삭제하시겠습니까?')) return;
                try {
                  await longformApi.deleteRender({ storybookId, projectId: project.id });
                  onUpdate({ outputUrl: undefined, youtubeUpload: undefined });
                } catch (e: any) {
                  alert(e.message || '삭제 실패');
                }
              }}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="렌더링 삭제"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
          <video
            src={project.outputUrl}
            controls
            className="rounded-lg w-full max-h-[480px] bg-black border border-slate-200 dark:border-slate-700"
          />
        </div>
      )}

      {/* ===== Shortform Section ===== */}
      {project.outputUrl && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-pink-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            숏폼 (9:16)
          </h3>

          {project.shortformOutputUrl && !sfRendering && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600">생성 완료</span>
                <DownloadButton
                  href={project.shortformOutputUrl}
                  filename={`${project.name}_short.mp4`}
                  size="sm"
                />
              </div>
              <video
                src={project.shortformOutputUrl}
                controls
                className="rounded-lg w-full max-h-[480px] bg-black border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          {sfRendering && sfProgress && (
            <div className="space-y-1.5 bg-pink-50 dark:bg-pink-900/20 px-3 py-2 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-pink-700 dark:text-pink-300">
                  {sfProgress.step}
                </span>
                <span className="text-xs text-pink-600">{sfProgress.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-pink-200 dark:bg-pink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${sfProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {sfError && <p className="text-xs text-red-500">{sfError}</p>}

          <Button
            onClick={handleShortformRender}
            disabled={sfRendering}
            loading={sfRendering}
            size="sm"
            variant="secondary"
          >
            {sfRendering
              ? '숏폼 렌더링 중...'
              : project.shortformOutputUrl
                ? '숏폼 다시 만들기'
                : '숏폼 만들기'}
          </Button>
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

          {/* Channel management */}
          {ytConnected === null ? (
            <p className="text-xs text-slate-400">연결 상태 확인 중...</p>
          ) : (
            <>
              {/* Connected channels */}
              {ytChannels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    연결된 채널
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ytChannels.map((ch) => (
                      <div
                        key={ch.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors ${
                          selectedChannelId === ch.id
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50'
                        }`}
                        onClick={() => setSelectedChannelId(ch.id)}
                      >
                        <span>{ch.channelTitle || ch.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveChannel(ch.id, ch.channelTitle || ch.name);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add channel */}
              {showAddChannel ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="채널 이름 (선택)"
                    className="text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-slate-100"
                  />
                  <Button size="sm" onClick={handleAddChannel}>
                    연결
                  </Button>
                  <button
                    onClick={() => setShowAddChannel(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline"
                >
                  + 채널 추가
                </button>
              )}

              {ytChannels.length === 0 && !showAddChannel && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400">YouTube 미연결</span>
                  <Button size="sm" onClick={() => setShowAddChannel(true)}>
                    YouTube 연결
                  </Button>
                </div>
              )}

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
                    {project.youtubeUpload.publishAt
                      ? `예약 공개: ${new Date(project.youtubeUpload.publishAt).toLocaleString()}`
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
                    className="text-xs text-slate-400 hover:text-red-500 mt-2"
                  >
                    연결 해제
                  </button>
                </div>
              )}

              {/* Manual link */}
              {!project.youtubeUpload && (
                <div className="space-y-2">
                  {!showLinkInput ? (
                    <button
                      onClick={() => setShowLinkInput(true)}
                      className="text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 underline"
                    >
                      외부에서 올린 YouTube 영상이 있다면 수동으로 연결
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="YouTube URL 또는 영상 ID"
                        className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-slate-100"
                      />
                      <Button size="sm" onClick={handleLinkVideo} loading={linking}>
                        연결
                      </Button>
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
                    <p className="text-xs text-amber-600 dark:text-amber-400">{linkWarning}</p>
                  )}
                </div>
              )}

              {/* Upload form */}
              {!ytUploading && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  {/* === AI 프롬프트 프리셋 + 설정값 생성 === */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
                        AI 설정값 생성
                      </label>
                      <button
                        onClick={() => setShowPromptEditor(!showPromptEditor)}
                        className="text-xs text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        {showPromptEditor ? '프롬프트 접기 ▲' : '프롬프트 편집 ▼'}
                      </button>
                    </div>

                    {/* 프리셋 셀렉터 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={selectedPresetId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPresetId(id);
                          const preset = ytPresets.find((p) => p.id === id);
                          if (preset) handleLoadPreset(preset);
                          else setAiPrompt(DEFAULT_YT_PROMPT);
                        }}
                        className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">기본 프롬프트</option>
                        {ytPresets.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          setPresetName(
                            selectedPresetId
                              ? ytPresets.find((p) => p.id === selectedPresetId)?.name || ''
                              : ''
                          );
                          setShowPresetSave(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors whitespace-nowrap"
                      >
                        {selectedPresetId ? '프리셋 수정' : '프리셋 저장'}
                      </button>
                      {selectedPresetId && (
                        <button
                          onClick={() => {
                            if (confirm('이 프리셋을 삭제할까요?'))
                              handleDeletePreset(selectedPresetId);
                          }}
                          className="px-2 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    {/* 프리셋 저장 다이얼로그 */}
                    {showPresetSave && (
                      <div className="flex items-center gap-2 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-md border border-violet-200 dark:border-violet-800">
                        <input
                          type="text"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="프리셋 이름 (예: 동화 한국어)"
                          className="flex-1 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                        />
                        <button
                          onClick={handleSavePreset}
                          disabled={!presetName.trim()}
                          className="px-3 py-1 text-xs font-medium rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setShowPresetSave(false)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          취소
                        </button>
                      </div>
                    )}

                    {/* 프롬프트 에디터 (토글) */}
                    {showPromptEditor && (
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 text-sm border border-violet-300 dark:border-violet-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-y font-mono"
                        placeholder="YouTube 설정값을 생성할 AI 프롬프트를 입력하세요..."
                      />
                    )}

                    {/* 설정값 생성 버튼 */}
                    <Button
                      onClick={handleGenerateMeta}
                      disabled={isGenerating || !aiPrompt.trim()}
                      loading={isGenerating}
                      size="sm"
                      className="!bg-violet-600 hover:!bg-violet-700"
                    >
                      {isGenerating ? 'AI 생성 중...' : '✨ 설정값 생성'}
                    </Button>
                  </div>

                  <hr className="border-slate-200 dark:border-slate-700" />

                  {/* === 생성된 YouTube 설정값 폼 === */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      업로드 설정값
                    </label>

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

                    {/* Scheduled publish time */}
                    {ytPrivacy === 'scheduled' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          예약 공개 시간
                        </label>
                        <input
                          type="datetime-local"
                          value={ytPublishAt}
                          onChange={(e) => setYtPublishAt(e.target.value)}
                          min={new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                          최소 10분 이후 시간으로 설정해주세요
                        </p>
                      </div>
                    )}

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
                        {SUPPORTED_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label}
                          </option>
                        ))}
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

              {/* 자막 (Caption) 섹션 — YouTube 업로드 완료 후 */}
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
                          : SUPPORTED_LANGUAGES.find((l) => l.code === project.language)?.label ||
                            project.language}
                        <span className="text-[10px] text-violet-400">(기본)</span>
                      </label>
                      {SUPPORTED_LANGUAGES.filter((l) => l.code !== project.language).map(
                        (lang) => (
                          <label
                            key={lang.code}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                              captionLangs.includes(lang.code)
                                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50'
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
                    <Button
                      onClick={handleGenerateCaptions}
                      disabled={captionGenerating || captionUploading}
                      size="sm"
                      variant="secondary"
                    >
                      {captionGenerating ? 'SRT 생성 중...' : 'SRT 생성'}
                    </Button>
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
                              SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label || lang;
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
                                  {uploadedOk && <span className="text-emerald-500">✓</span>}
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

                  {captionUploading && captionProgress && (
                    <div className="space-y-1.5 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                          자막 업로드 중
                        </span>
                        <span className="text-xs text-violet-600">{captionProgress.progress}%</span>
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

                  {captionError && <p className="text-xs text-red-500 break-all">{captionError}</p>}

                  {project.youtubeUpload?.captionsFailed &&
                    project.youtubeUpload.captionsFailed.length > 0 &&
                    !captionUploading && (
                      <div className="space-y-0.5 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded">
                        <p className="text-xs text-red-600 font-medium">
                          업로드 실패:{' '}
                          {project.youtubeUpload.captionsFailed.map((f) => f.lang).join(', ')}
                        </p>
                        {project.youtubeUpload.captionsFailed.map((f) => (
                          <p key={f.lang} className="text-[10px] text-red-500 break-all">
                            {f.lang}: {f.error}
                          </p>
                        ))}
                      </div>
                    )}

                  <Button
                    onClick={handleUploadCaptions}
                    disabled={
                      captionUploading || captionGenerating || selectedUploadLangs.length === 0
                    }
                    size="sm"
                    className="!bg-violet-600 hover:!bg-violet-700"
                  >
                    {captionUploading
                      ? '자막 업로드 중...'
                      : `선택한 ${selectedUploadLangs.length}개 YouTube 업로드`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Other projects' rendered videos — removed: use version tabs at top instead */}

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
