import { useCallback } from 'react';
import type {
  LearningEventInsert,
  LearningEventMetadata,
  LearningEventType,
} from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { eventsApi } from '../api/events.api';

export interface LogEventArgs {
  type: LearningEventType;
  word?: string;
  storybookId?: string;
  gameType?: string;
  metadata?: LearningEventMetadata;
}

/** 단일 이벤트 emit. 게스트 모드에선 no-op. fire-and-forget. */
export function useLogEvent() {
  const { activeProfile } = useAuth();
  const profileId = activeProfile?.id ?? null;

  return useCallback(
    (args: LogEventArgs) => {
      if (!profileId) return;
      const insert: LearningEventInsert = {
        profile_id: profileId,
        event_type: args.type,
        storybook_id: args.storybookId ?? null,
        game_type: args.gameType ?? null,
        word: args.word ?? null,
        metadata: args.metadata ?? null,
        created_at: new Date().toISOString(),
      };
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
