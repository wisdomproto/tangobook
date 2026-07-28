import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../providers/supabase-admin.provider.js', () => ({ getSupabaseAdmin: vi.fn() }));
// vi.mock 은 호이스팅되므로 mock 함수도 vi.hoisted 로 같이 끌어올려야 한다.
const { publishRecord } = vi.hoisted(() => ({ publishRecord: vi.fn(async () => ({ ok: true })) }));
vi.mock('../publish-executor.service.js', () => ({ publishRecord }));

import { publishDueYoutube, publishDueMeta } from '../publish-scheduler.service.js';

/**
 * 두 스케줄러(프로덕션 + 로컬 dev)가 같은 due 행을 집는 상황을 재현한다.
 * `claimed` 가 false 면 조건부 UPDATE 가 0행을 바꿨다는 뜻 = 남이 먼저 가져갔다.
 */
function fakeAdmin(due: { id: string }[], claimed: boolean) {
  const updates: { status: string; eq: [string, unknown][] }[] = [];
  const client = {
    from() {
      const eq: [string, unknown][] = [];
      let isUpdate = false;
      let payload: { status: string } | null = null;
      const b: Record<string, unknown> = {
        select: () =>
          isUpdate ? Promise.resolve({ data: claimed ? [{ id: 'x' }] : [], error: null }) : b,
        update: (p: { status: string }) => {
          isUpdate = true;
          payload = p;
          updates.push({ status: p.status, eq });
          return b;
        },
        eq: (c: string, v: unknown) => {
          eq.push([c, v]);
          return b;
        },
        in: () => b,
        lte: () => b,
        order: () => b,
        limit: () => Promise.resolve({ data: due, error: null }),
        then: (res: (r: unknown) => void) => res({ data: payload ? [] : due, error: null }),
      };
      return b;
    },
  };
  return { client, updates };
}

beforeEach(() => publishRecord.mockClear());

describe('스케줄러 선점(claim)', () => {
  it('선점에 성공하면 발행한다', async () => {
    const { client } = fakeAdmin([{ id: 'r1' }], true);
    await publishDueYoutube(client as never);
    expect(publishRecord).toHaveBeenCalledWith('r1');
  });

  it('🔴 다른 스케줄러가 먼저 가져갔으면 발행하지 않는다 — 같은 영상 두 번 업로드 방지', async () => {
    const { client } = fakeAdmin([{ id: 'r1' }], false);
    await publishDueYoutube(client as never);
    expect(publishRecord).not.toHaveBeenCalled();
  });

  it('선점은 scheduled 인 행만 대상으로 한다(조건부 UPDATE)', async () => {
    const { client, updates } = fakeAdmin([{ id: 'r1' }], true);
    await publishDueYoutube(client as never);
    expect(updates[0].status).toBe('publishing');
    expect(updates[0].eq).toEqual([
      ['id', 'r1'],
      ['status', 'scheduled'],
    ]);
  });

  it('메타 채널도 같은 선점을 거친다', async () => {
    const { client } = fakeAdmin([{ id: 'm1' }], false);
    await publishDueMeta(client as never);
    expect(publishRecord).not.toHaveBeenCalled();
  });
});
