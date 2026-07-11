// 릴스(영상) 발행 enqueue — IG/FB/Threads(메타) + YouTube(쇼츠).
// 예약이면 status='scheduled' → 스케줄러 자동 발행. 즉시면 'publishing'로 넣고 runPublish 순차 호출.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUserId } from './supabase';
import { mktKeys } from './queries';
import { runPublish } from './use-meta-connection';
import type { PublishRecord } from '../types/database';

export type ReelsChannel = 'instagram' | 'facebook' | 'threads' | 'youtube';

export interface ReelsTarget {
  channel: ReelsChannel;
  targetId: string; // 메타=Graph 타겟 id / 유튜브=내부 채널 id
  name: string; // 표시용(페이지명/채널명)
}

export interface EnqueueReelsInput {
  projectId: string;
  contentId: string;
  language: string;
  targets: ReelsTarget[];
  scheduledAt?: string | null;
  /** 유튜브 공개 범위 (기본 public). */
  privacy?: 'public' | 'unlisted' | 'private';
}

export function useEnqueueReelsPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: EnqueueReelsInput
    ): Promise<{ scheduled: number; publishedNow: number; errors: string[] }> => {
      if (input.targets.length === 0) throw new Error('발행 대상을 1개 이상 선택하세요.');
      const uid = await getCurrentUserId();
      const immediate = !input.scheduledAt;

      const rows = input.targets.map((t) => ({
        user_id: uid,
        content_id: input.contentId,
        project_id: input.projectId,
        language: input.language,
        channel: t.channel,
        status: immediate ? 'publishing' : 'scheduled',
        scheduled_at: immediate ? null : input.scheduledAt,
        metadata: {
          target_id: t.targetId,
          page_name: t.name,
          content_kind: 'reels',
          ...(t.channel === 'youtube' && input.privacy ? { privacy: input.privacy } : {}),
        },
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
