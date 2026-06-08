import { describe, it, expect, vi } from 'vitest';
import { saveMetaRecord } from '../publish.service.js';

describe('saveMetaRecord — canonical column mapping', () => {
  it('writes canonical columns (platform_post_id/published_url/metadata.title) + stamps user_id', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u1',
      projectId: 'p1',
      contentId: 'c1',
      channel: 'instagram',
      postId: 'IG_123',
      title: 'Hi',
      caption: 'caption',
      language: 'ko',
      scheduledAt: null,
    });

    const row = insert.mock.calls[0][0];

    // canonical columns
    expect(row.platform_post_id).toBe('IG_123');
    expect(row.published_url).toBe('');
    expect(row.metadata).toEqual({ title: 'Hi' });

    // user_id stamp
    expect(row.user_id).toBe('u1');

    // status when not scheduled
    expect(row.status).toBe('published');

    // stale CF columns must NOT exist
    expect('external_id' in row).toBe(false);
    expect('url' in row).toBe(false);
    expect('title' in row).toBe(false);
  });

  it('sets status=scheduled when scheduledAt is provided', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u2',
      projectId: 'p2',
      channel: 'facebook',
      postId: 'FB_456',
      scheduledAt: '2026-07-01T10:00:00.000Z',
    });

    const row = insert.mock.calls[0][0];
    expect(row.status).toBe('scheduled');
    expect(row.published_at).toBe('2026-07-01T10:00:00.000Z');
    expect(row.scheduled_at).toBe('2026-07-01T10:00:00.000Z');
  });

  it('defaults language to ko when omitted', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u3',
      projectId: 'p3',
      channel: 'threads',
      postId: 'TH_789',
      scheduledAt: null,
    });

    const row = insert.mock.calls[0][0];
    expect(row.language).toBe('ko');
  });

  it('sets content_id to null when absent', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u4',
      projectId: 'p4',
      channel: 'instagram',
      postId: 'IG_000',
      scheduledAt: null,
      // contentId omitted
    });

    const row = insert.mock.calls[0][0];
    expect(row.content_id).toBeNull();
  });

  it('early-returns without insert when projectId is absent', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u5',
      // projectId omitted
      channel: 'instagram',
      postId: 'IG_999',
      scheduledAt: null,
    });

    expect(insert).not.toHaveBeenCalled();
  });

  it('falls back published_at to now when not scheduled', async () => {
    const before = new Date().toISOString();
    const insert = vi.fn().mockResolvedValue({ error: null });
    const admin = { from: vi.fn().mockReturnValue({ insert }) } as never;

    await saveMetaRecord(admin, {
      userId: 'u6',
      projectId: 'p6',
      channel: 'facebook',
      postId: 'FB_NOW',
      scheduledAt: null,
    });

    const after = new Date().toISOString();
    const row = insert.mock.calls[0][0];
    expect(row.published_at >= before).toBe(true);
    expect(row.published_at <= after).toBe(true);
    expect(row.scheduled_at).toBeNull();
  });
});
