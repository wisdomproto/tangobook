import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookV2Api } from '../api/book-v2.api';
import type { LongformProjectV2, ReadingLevel } from '@tangobook/shared';

interface LongformFilter {
  level?: ReadingLevel;
  language?: string;
  style?: string;
}

export function useLongformList(bid: string, filter?: LongformFilter) {
  return useQuery({
    queryKey: ['book-v2', 'longform', bid, filter?.level, filter?.language, filter?.style],
    queryFn: () => bookV2Api.listLongform(bid, filter),
    enabled: !!bid,
  });
}

export function useLongformProject(bid: string, projectId: string | null) {
  return useQuery({
    queryKey: ['book-v2', 'longform', bid, 'project', projectId],
    queryFn: () => bookV2Api.getLongform(bid, projectId!),
    enabled: !!bid && !!projectId,
  });
}

export function useCreateLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      level: ReadingLevel;
      language: string;
      style: string;
      parentProjectId?: string;
    }) => bookV2Api.createLongform(bid, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useSaveLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, patch }: { projectId: string; patch: Partial<LongformProjectV2> }) =>
      bookV2Api.saveLongform(bid, projectId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useDeleteLongform(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => bookV2Api.deleteLongform(bid, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useStartLongformAnalyze(bid: string) {
  return useMutation({
    mutationFn: ({
      projectId,
      body,
    }: {
      projectId: string;
      body?: { systemPrompt?: string; model?: string; excludePages?: number[] };
    }) => bookV2Api.startLongformAnalyze(bid, projectId, body),
  });
}

export function useLongformAnalyzeProgress(bid: string, projectId: string | null) {
  // 폴링은 LongformTab에서 직접 setTimeout으로 (taskId 단위 invalidate 패턴이 없으므로)
  return { bid, projectId };
}

export function useStartGenerateClip(bid: string) {
  return useMutation({
    mutationFn: ({ projectId, sceneId }: { projectId: string; sceneId: string }) =>
      bookV2Api.startGenerateClip(bid, projectId, sceneId),
  });
}

export function useStartLongformRender(bid: string) {
  return useMutation({
    mutationFn: (projectId: string) => bookV2Api.startLongformRender(bid, projectId),
  });
}

export function useStartLongformYouTubeUpload(bid: string) {
  return useMutation({
    mutationFn: ({
      projectId,
      meta,
      channelId,
    }: {
      projectId: string;
      meta: import('@tangobook/shared').YouTubeUploadMeta;
      channelId?: string;
    }) => bookV2Api.startLongformYouTubeUpload(bid, projectId, { meta, channelId }),
  });
}

export function useLinkLongformYouTubeVideo(bid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, videoIdOrUrl }: { projectId: string; videoIdOrUrl: string }) =>
      bookV2Api.linkLongformYouTubeVideo(bid, projectId, videoIdOrUrl),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-v2', 'longform', bid] });
    },
  });
}

export function useGenerateLongformYouTubeMeta(bid: string) {
  return useMutation({
    mutationFn: ({ projectId, prompt }: { projectId: string; prompt: string }) =>
      bookV2Api.generateLongformYouTubeMeta(bid, projectId, prompt),
  });
}
