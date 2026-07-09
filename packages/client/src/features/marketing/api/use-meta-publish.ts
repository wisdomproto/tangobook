// Meta 발행 레코드 enqueue (supabase-direct insert) + 즉시 발행.
// 예약: status='scheduled' + scheduled_at → 서버 스케줄러가 그 시각에 자동 발행.
// 즉시: status='publishing'(스케줄러가 안 집는 상태)로 넣고 runPublish(recordId) 로 실행기 호출.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUserId } from './supabase';
import { mktKeys } from './queries';
import { runPublish } from './use-meta-connection';
import type { PublishRecord } from '../types/database';

export type MetaPlatform = 'instagram' | 'facebook' | 'threads';

export interface MetaPublishTarget {
  platform: MetaPlatform;
  targetId: string; // Graph 타겟 id (ig business id / page id / threads id)
  pageName: string;
}

export interface EnqueueMetaInput {
  projectId: string;
  contentId: string;
  language: string;
  targets: MetaPublishTarget[];
  /** ISO 예약 시각. null/미지정 = 즉시 발행. */
  scheduledAt?: string | null;
}

/**
 * 선택한 타겟마다 mkt_publish_records 행을 1개씩 생성한다. user_id 스탬프 필수(R-4).
 * 즉시 발행이면 각 행에 대해 runPublish 를 순차 호출(성공/실패는 실행기가 레코드에 기록).
 */
export function useEnqueueMetaPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: EnqueueMetaInput
    ): Promise<{ scheduled: number; publishedNow: number; errors: string[] }> => {
      if (input.targets.length === 0) throw new Error('발행 대상을 1개 이상 선택하세요.');
      const uid = await getCurrentUserId();
      const immediate = !input.scheduledAt;

      // 즉시 발행은 'publishing'(스케줄러가 안 집는 상태)로 넣어, runPublish 도는 동안 스케줄러
      // tick 이 같은 레코드를 집어 이중 발행하는 것을 막는다. 예약은 'scheduled' + scheduled_at.
      const rows = input.targets.map((t) => ({
        user_id: uid,
        content_id: input.contentId,
        project_id: input.projectId,
        language: input.language,
        channel: t.platform,
        status: immediate ? 'publishing' : 'scheduled',
        scheduled_at: immediate ? null : input.scheduledAt,
        metadata: { target_id: t.targetId, page_name: t.pageName, content_kind: 'cardnews' },
      }));

      const { data, error } = await supabase
        .from('mkt_publish_records')
        .insert(rows as unknown as Record<string, unknown>[])
        .select();
      if (error) throw new Error(error.message);
      const inserted = (data ?? []) as PublishRecord[];

      const errors: string[] = [];
      let publishedNow = 0;
      if (immediate) {
        for (const rec of inserted) {
          try {
            await runPublish(rec.id);
            publishedNow++;
          } catch (e) {
            errors.push(e instanceof Error ? e.message : '발행 실패');
          }
        }
      }
      return { scheduled: immediate ? 0 : inserted.length, publishedNow, errors };
    },
    onSuccess: (_r, input) => {
      void qc.invalidateQueries({ queryKey: mktKeys.publishRecords(input.projectId) });
      void qc.invalidateQueries({ queryKey: mktKeys.publishCounts(input.projectId) });
    },
  });
}
