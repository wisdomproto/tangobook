import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runMigrations } from './migrations';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));

import { supabase } from '@/lib/supabase';

describe('runMigrations', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('migrated flag 있으면 즉시 return, insert 호출 없음', async () => {
    localStorage.setItem('tangobook:migrated:v1', new Date().toISOString());
    await runMigrations('p1');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('매칭되는 키 없으면 insert 호출 안 함 + flag만 set', async () => {
    localStorage.setItem('unrelated:key', '{}');
    await runMigrations('p1');
    expect(supabase.from).not.toHaveBeenCalled();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('speaking-progress 매칭 + wordsSpoken → word_spoken 이벤트', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과', '바나나'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');

    expect(supabase.from).toHaveBeenCalledWith('learning_events');
    const args = insertMock.mock.calls[0][0];
    expect(args).toHaveLength(2);
    expect(args[0]).toMatchObject({
      profile_id: 'p1',
      event_type: 'word_spoken',
      storybook_id: 'book1',
      word: '사과',
    });
    expect(args[0].metadata).toMatchObject({ lang: 'ko' });
  });

  it('빈 wordsSpoken → 해당 엔트리 이벤트 0개 (스킵)', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: [], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(insertMock).not.toHaveBeenCalled();
    // 매칭 키는 있지만 이벤트가 0개 — 여전히 해당 키는 제거 + flag set
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('파싱 실패 엔트리는 스킵하고 다른 엔트리 진행', async () => {
    localStorage.setItem('tangobook:speaking:book1:ko', 'not-json');
    localStorage.setItem(
      'tangobook:speaking:book2:en',
      JSON.stringify({ wordsSpoken: ['apple'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    const args = insertMock.mock.calls[0][0];
    expect(args).toHaveLength(1);
    expect(args[0].storybook_id).toBe('book2');
  });

  it('insert 성공 시 해당 키 삭제 + 플래그 set', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).not.toBeNull();
  });

  it('insert 실패 시 localStorage 유지 + 플래그 set 안 함', async () => {
    localStorage.setItem(
      'tangobook:speaking:book1:ko',
      JSON.stringify({ wordsSpoken: ['사과'], lastPlayedAt: '2026-04-23T00:00:00.000Z' })
    );
    const insertMock = vi.fn().mockResolvedValue({ error: { message: 'network' } });
    (supabase.from as any).mockReturnValue({ insert: insertMock });

    await runMigrations('p1');
    expect(localStorage.getItem('tangobook:speaking:book1:ko')).not.toBeNull();
    expect(localStorage.getItem('tangobook:migrated:v1')).toBeNull();
  });
});
