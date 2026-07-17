import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mktKeys } from './queries';

// 서버 content-pipeline 타입 미러 (packages/server/src/services/content-pipeline/derive.ts)

export interface PipelineLangDone {
  text: boolean;
  tts: boolean;
  illust: boolean;
  cover: boolean;
}

export interface PipelineAuthoring {
  series: string;
  public: boolean;
  langs: Record<string, PipelineLangDone>;
}

export interface PipelineMarketing {
  /** 최소 ko/en 키 보장 */
  reels: Record<string, boolean>;
  /** 최소 ko/en 키 보장. lang → 렌더된 artStyle[] */
  longform: Record<string, string[]>;
  blog: boolean;
  cardnews: boolean;
  published: {
    youtubeShorts: boolean;
    instagram: boolean;
    youtubeLongform: 'none' | 'scheduled' | 'published';
  };
}

export interface PipelineRow {
  bookId: string;
  title: string;
  series: string;
  approved: boolean;
  authoring: PipelineAuthoring;
  marketing: PipelineMarketing;
  category?: string;
}

export interface PipelineTodo {
  kind: 'reel-ko' | 'reel-en' | 'longform-ko' | 'longform-en' | 'schedule-longform';
  series: string;
  bookIds: string[];
  label: string;
  command?: string;
  /** translation = en 저작(번역/TTS/표지) 미완 대기 / pipeline = en 렌더 파이프라인 미구축 */
  blocked?: 'translation' | 'pipeline';
}

export interface PipelineResult {
  rows: PipelineRow[];
  todos: PipelineTodo[];
  generatedAt: string;
  /** 풀 JSON 로드 실패 책 id (+ 'shorts-state' 소스 마커) */
  fetchFailed: string[];
}

/** 시리즈 key → 한국어 라벨 (server series-registry.ts 라벨 사본) */
export const SERIES_LABELS: Record<string, string> = {
  classic: '세계 명작',
  nature: '자연관찰',
  life: '생활동화',
  kindergarten: '유치원동화',
  folk: '전래동화',
  comic: '학습만화',
  original: '창작동화',
  unclassified: '미분류',
};

export function seriesLabel(key: string): string {
  return SERIES_LABELS[key] ?? key;
}

async function fetchPipeline(refresh: boolean): Promise<PipelineResult> {
  const res = await fetch(`/api/mkt/pipeline${refresh ? '?refresh=1' : ''}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const msg =
      typeof json?.error === 'string' ? json.error : (json?.error?.message ?? `HTTP ${res.status}`);
    throw new Error(`파이프라인 조회 실패: ${msg}`);
  }
  return json.data as PipelineResult;
}

/**
 * 대표용 콘텐츠 파이프라인 관제탑 데이터 (server-proxy `GET /api/mkt/pipeline`).
 * 서버가 5분 캐시하므로 클라 staleTime 은 짧게 — 강제 재감사는 useRefreshPipeline.
 */
export function usePipeline() {
  return useQuery({
    queryKey: mktKeys.pipeline(),
    queryFn: () => fetchPipeline(false),
    staleTime: 60_000,
  });
}

/** `?refresh=1` 강제 재감사 후 캐시 교체 */
export function useRefreshPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchPipeline(true),
    onSuccess: (data) => {
      queryClient.setQueryData(mktKeys.pipeline(), data);
    },
  });
}
