import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentPipelineApi, type AuthoringPipeline } from '../api/content-pipeline.api';

export const CONTENT_PIPELINE_KEY = ['content-pipeline', 'authoring'] as const;

/** 저작 완성도 파이프라인 조회 (서버 5분 캐시 — 강제 재감사는 useRefreshAuthoringPipeline) */
export function useAuthoringPipeline() {
  return useQuery({
    queryKey: CONTENT_PIPELINE_KEY,
    queryFn: () => contentPipelineApi.authoring(),
    staleTime: 60_000,
  });
}

/** 🔄 새로고침 — ?refresh=1 로 서버 캐시 무시 재감사 후 쿼리 캐시 교체 */
export function useRefreshAuthoringPipeline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => contentPipelineApi.authoring(true),
    onSuccess: (data) => {
      queryClient.setQueryData(CONTENT_PIPELINE_KEY, data);
    },
  });
}

/**
 * 저작 승인 토글 — 낙관적 갱신.
 * onMutate: cancelQueries → snapshot → 해당 book 의 approved 만 즉시 교체.
 * onError: snapshot 롤백. onSettled: invalidate (서버는 승인을 매 요청 fresh merge — 안전).
 */
export function useToggleApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, approved }: { bookId: string; approved: boolean }) =>
      contentPipelineApi.setApproval(bookId, approved),
    onMutate: async ({ bookId, approved }) => {
      await queryClient.cancelQueries({ queryKey: CONTENT_PIPELINE_KEY });
      const previous = queryClient.getQueryData<AuthoringPipeline>(CONTENT_PIPELINE_KEY);
      if (previous) {
        queryClient.setQueryData<AuthoringPipeline>(CONTENT_PIPELINE_KEY, {
          ...previous,
          rows: previous.rows.map((r) => (r.bookId === bookId ? { ...r, approved } : r)),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CONTENT_PIPELINE_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_PIPELINE_KEY });
    },
  });
}
