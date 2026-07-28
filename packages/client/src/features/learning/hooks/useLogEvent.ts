import { useCallback } from 'react';
import type {
  LearningEventInsert,
  LearningEventMetadata,
  LearningEventType,
} from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { eventsApi } from '../api/events.api';
import { appendGuestEvent } from '../lib/guest-events';

export interface LogEventArgs {
  type: LearningEventType;
  word?: string;
  storybookId?: string;
  gameType?: string;
  metadata?: LearningEventMetadata;
}

/**
 * 단일 이벤트 emit. fire-and-forget.
 *
 * 🔴 **게스트도 기록한다 — 로컬에.** 예전엔 프로필이 없으면 통째로 버려서, 게스트 30일이 끝나고
 *    가입하면 그 30일이 없던 일이 됐다. 계정이 없어 서버에 붙일 곳이 없을 뿐이므로 localStorage 에
 *    쌓아두고, 프로필이 생기는 순간 옮겨 붙인다(`useAdoptGuestEvents`).
 */
export function useLogEvent() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id ?? null;

  return useCallback(
    (args: LogEventArgs) => {
      const insert: LearningEventInsert = {
        profile_id: profileId ?? '',
        event_type: args.type,
        storybook_id: args.storybookId ?? null,
        game_type: args.gameType ?? null,
        word: args.word ?? null,
        metadata: args.metadata ?? null,
        created_at: new Date().toISOString(),
      };
      if (!profileId) {
        appendGuestEvent(insert);
        return;
      }
      void eventsApi.insert([insert]);
    },
    [profileId]
  );
}

export type LogEventBatchItem = Omit<LearningEventInsert, 'profile_id' | 'created_at'>;

/** 여러 이벤트를 한 번의 insert로. */
export function useLogEventsBatch() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id ?? null;

  return useCallback(
    (items: LogEventBatchItem[]) => {
      if (!profileId || items.length === 0) return;
      const now = new Date().toISOString();
      const inserts: LearningEventInsert[] = items.map((it) => ({
        ...it,
        profile_id: profileId,
        created_at: now,
      }));
      void eventsApi.insert(inserts);
    },
    [profileId]
  );
}
