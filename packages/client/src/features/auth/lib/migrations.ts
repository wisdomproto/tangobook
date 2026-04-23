import { supabase } from '@/lib/supabase';
import type { Lang, LearningEventInsert } from '@tangobook/shared';

interface LocalMigration {
  id: string;
  /** `g` 플래그 금지 — test() side effect로 매 두 번째 호출마다 false 반환 버그 유발 */
  keyPattern: RegExp;
  toEvents: (key: string, value: unknown, profileId: string) => LearningEventInsert[];
}

const MIGRATIONS: LocalMigration[] = [
  {
    id: 'speaking-progress',
    keyPattern: /^tangobook:speaking:([^:]+):(ko|en)$/,
    toEvents: (key, value, profileId) => {
      const m = key.match(/^tangobook:speaking:([^:]+):(ko|en)$/);
      const entry = value as { wordsSpoken?: string[]; lastPlayedAt?: string };
      if (!m || !entry?.wordsSpoken || entry.wordsSpoken.length === 0) return [];
      return entry.wordsSpoken.map((word) => ({
        profile_id: profileId,
        event_type: 'word_spoken',
        storybook_id: m[1],
        word,
        metadata: { lang: m[2] as Lang, migratedFrom: 'localStorage:v0' },
        created_at: entry.lastPlayedAt ?? new Date().toISOString(),
      }));
    },
  },
];

const FLAG_KEY = 'tangobook:migrated:v1';

export async function runMigrations(profileId: string): Promise<void> {
  if (localStorage.getItem(FLAG_KEY)) return;

  const allEvents: LearningEventInsert[] = [];
  const keysToRemove: string[] = [];

  for (const m of MIGRATIONS) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !m.keyPattern.test(key)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const value = JSON.parse(raw);
        allEvents.push(...m.toEvents(key, value, profileId));
        keysToRemove.push(key);
      } catch {
        // 파싱 실패 — 스킵
      }
    }
  }

  if (allEvents.length > 0) {
    const { error } = await supabase.from('learning_events').insert(allEvents);
    if (error) {
      console.warn('[migration] insert failed, keeping localStorage:', error);
      return;
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(FLAG_KEY, new Date().toISOString());
}
