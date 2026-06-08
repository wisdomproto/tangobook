import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the provider so the service's tick() reads OUR fake admin.
vi.mock('../../../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));
import { getSupabaseAdmin } from '../../../providers/supabase-admin.provider.js';
import { flipDueSelfHosted, fireDeployWebhooks, tick } from '../publish-scheduler.service.js';

// ── Fake admin client ───────────────────────────────────────────────────────
// Records the chains the impl uses and resolves canned data. supabase-js builders
// are *thenable* (await without a terminal method runs the query), and several
// terminal methods (.select / .upsert / .maybeSingle) also resolve. We model that
// by returning a builder that is both chainable AND a thenable, plus per-op logs.

interface OpLog {
  table: string;
  op: 'update' | 'upsert' | 'select' | null;
  payload?: any; // the update/upsert object/rows
  upsertOpts?: any;
  selectCols?: string;
  eq: Array<[string, any]>;
  lte: Array<[string, any]>;
  in: Array<[string, any]>;
  maybeSingle: boolean;
}

interface Seed {
  // Step A: rows the flip UPDATE…SELECT returns (already filtered to due+self_hosted+scheduled).
  flipped?: any[];
  flipError?: { message: string } | null;
  // Step B: whole-queue select rows.
  queue?: any[];
  // Step B: mkt_projects.published_site by project id.
  projects?: Record<string, any>; // id -> published_site value (or whole row)
}

interface FakeAdmin {
  client: { from: (table: string) => any };
  ops: OpLog[];
}

function makeFakeAdmin(seed: Seed): FakeAdmin {
  const ops: OpLog[] = [];

  function from(table: string) {
    const log: OpLog = {
      table,
      op: null,
      eq: [],
      lte: [],
      in: [],
      maybeSingle: false,
    };
    ops.push(log);

    // Resolve the query result based on table + op + filters.
    function resolve(): { data: any; error: any } {
      if (table === 'mkt_publish_records' && log.op === 'update') {
        // Step A flip: returns the transitioned rows.
        return { data: seed.flipped ?? [], error: seed.flipError ?? null };
      }
      if (table === 'mkt_deploy_webhook_queue' && log.op === 'upsert') {
        return { data: null, error: null };
      }
      if (table === 'mkt_deploy_webhook_queue' && log.op === 'update') {
        return { data: null, error: null };
      }
      if (table === 'mkt_deploy_webhook_queue' && log.op === 'select') {
        // Step B whole-queue read.
        return { data: seed.queue ?? [], error: null };
      }
      if (table === 'mkt_projects' && log.op === 'select') {
        const idEq = log.eq.find(([c]) => c === 'id');
        const id = idEq?.[1];
        const row = id != null ? seed.projects?.[id] : undefined;
        // The impl reads project.published_site → return a row shape.
        return { data: row === undefined ? null : { published_site: row }, error: null };
      }
      return { data: null, error: null };
    }

    const builder: any = {
      update(payload: any) {
        log.op = 'update';
        log.payload = payload;
        return builder;
      },
      upsert(rows: any, opts?: any) {
        log.op = 'upsert';
        log.payload = rows;
        log.upsertOpts = opts;
        return builder;
      },
      insert(rows: any) {
        log.op = 'update'; // not used by scheduler; keep chainable
        log.payload = rows;
        return builder;
      },
      select(cols?: string) {
        if (log.op === null) log.op = 'select';
        log.selectCols = cols;
        return builder;
      },
      eq(col: string, val: any) {
        log.eq.push([col, val]);
        return builder;
      },
      lte(col: string, val: any) {
        log.lte.push([col, val]);
        return builder;
      },
      in(col: string, val: any) {
        log.in.push([col, val]);
        return builder;
      },
      maybeSingle() {
        log.maybeSingle = true;
        return Promise.resolve(resolve());
      },
      // Thenable: awaiting the builder (no terminal) runs the query.
      then(onFulfilled: any, onRejected: any) {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return { client: { from }, ops };
}

const NOW = Date.parse('2026-06-09T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ── Step A ───────────────────────────────────────────────────────────────────
describe('flipDueSelfHosted (Step A)', () => {
  it('flips ONLY scheduled+self_hosted+due rows (asserts the filter chain) and upserts DISTINCT projects with user_id + enqueued_at=now', async () => {
    const fake = makeFakeAdmin({
      flipped: [
        { project_id: 'p1', user_id: 'u1' },
        { project_id: 'p1', user_id: 'u1' }, // dup project → collapses
        { project_id: 'p2', user_id: 'u2' },
      ],
    });

    await flipDueSelfHosted(fake.client as any);

    // 1) The UPDATE on mkt_publish_records with the exact filter chain.
    const upd = fake.ops.find((o) => o.table === 'mkt_publish_records' && o.op === 'update');
    expect(upd).toBeDefined();
    expect(upd!.payload).toMatchObject({ status: 'published' });
    expect(upd!.payload.published_at).toBe(new Date(NOW).toISOString());
    expect(upd!.payload.updated_at).toBe(new Date(NOW).toISOString());
    // filter: .eq('status','scheduled').eq('channel','self_hosted').lte('scheduled_at',nowIso)
    expect(upd!.eq).toContainEqual(['status', 'scheduled']);
    expect(upd!.eq).toContainEqual(['channel', 'self_hosted']);
    expect(upd!.lte).toContainEqual(['scheduled_at', new Date(NOW).toISOString()]);
    // .select('project_id, user_id')
    expect(upd!.selectCols).toBe('project_id, user_id');

    // 2) The queue upsert: DISTINCT by project, each carrying user_id + enqueued_at=now.
    const up = fake.ops.find((o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'upsert');
    expect(up).toBeDefined();
    expect(up!.upsertOpts).toMatchObject({ onConflict: 'project_id' });
    const rows = up!.payload as any[];
    expect(rows).toHaveLength(2); // p1 (collapsed), p2
    expect(rows).toContainEqual({
      project_id: 'p1',
      user_id: 'u1',
      enqueued_at: new Date(NOW).toISOString(),
    });
    expect(rows).toContainEqual({
      project_id: 'p2',
      user_id: 'u2',
      enqueued_at: new Date(NOW).toISOString(),
    });
  });

  it('no-ops the queue upsert when nothing is due (empty flip)', async () => {
    const fake = makeFakeAdmin({ flipped: [] });
    await flipDueSelfHosted(fake.client as any);
    // UPDATE ran (to discover nothing matched) …
    expect(fake.ops.some((o) => o.table === 'mkt_publish_records' && o.op === 'update')).toBe(true);
    // … but NO queue upsert.
    expect(fake.ops.some((o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'upsert')).toBe(
      false
    );
  });
});

// ── Step B ───────────────────────────────────────────────────────────────────
describe('fireDeployWebhooks (Step B)', () => {
  it('fires ONLY pending rows (enqueued_at>last_fired_at or null), POSTs the webhook, resets retry/last_error on 2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const fake = makeFakeAdmin({
      queue: [
        // pending: never fired
        {
          project_id: 'p1',
          enqueued_at: '2026-06-09T11:59:00.000Z',
          last_fired_at: null,
          retry_count: 0,
          last_error: null,
        },
        // NOT pending: enqueued_at <= last_fired_at
        {
          project_id: 'p2',
          enqueued_at: '2026-06-09T10:00:00.000Z',
          last_fired_at: '2026-06-09T11:00:00.000Z',
          retry_count: 0,
          last_error: null,
        },
      ],
      projects: {
        p1: { deploy_webhook_url: 'https://hooks.example.com/p1' },
        p2: { deploy_webhook_url: 'https://hooks.example.com/p2' },
      },
    });

    await fireDeployWebhooks(fake.client as any);

    // Only p1 POSTed.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example.com/p1',
      expect.objectContaining({ method: 'POST' })
    );

    // p1 queue update: reset retry_count=0, last_error=null, last_fired_at=snapshot(enqueued_at).
    const updates = fake.ops.filter(
      (o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update'
    );
    expect(updates).toHaveLength(1);
    const u = updates[0];
    expect(u.eq).toContainEqual(['project_id', 'p1']);
    expect(u.payload).toMatchObject({
      retry_count: 0,
      last_error: null,
      last_fired_at: '2026-06-09T11:59:00.000Z',
    });
  });

  it('skips rows with retry_count>=3 (no fetch, no update)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const fake = makeFakeAdmin({
      queue: [
        {
          project_id: 'p1',
          enqueued_at: '2026-06-09T11:59:00.000Z',
          last_fired_at: null,
          retry_count: 3,
          last_error: 'boom',
        },
      ],
      projects: { p1: { deploy_webhook_url: 'https://hooks.example.com/p1' } },
    });

    await fireDeployWebhooks(fake.client as any);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fake.ops.some((o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update')).toBe(
      false
    );
  });

  it('bumps retry_count and leaves last_fired_at unchanged on POST failure (non-2xx)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    const fake = makeFakeAdmin({
      queue: [
        {
          project_id: 'p1',
          enqueued_at: '2026-06-09T11:59:00.000Z',
          last_fired_at: null,
          retry_count: 1,
          last_error: null,
        },
      ],
      projects: { p1: { deploy_webhook_url: 'https://hooks.example.com/p1' } },
    });

    await fireDeployWebhooks(fake.client as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const updates = fake.ops.filter(
      (o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update'
    );
    expect(updates).toHaveLength(1);
    const u = updates[0];
    expect(u.eq).toContainEqual(['project_id', 'p1']);
    expect(u.payload.retry_count).toBe(2); // bumped 1→2
    expect('last_fired_at' in u.payload).toBe(false); // unchanged → retried next tick
    expect(u.payload.last_error).toBeTruthy();
  });

  it('bumps retry_count when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const fake = makeFakeAdmin({
      queue: [
        {
          project_id: 'p1',
          enqueued_at: '2026-06-09T11:59:00.000Z',
          last_fired_at: null,
          retry_count: 0,
          last_error: null,
        },
      ],
      projects: { p1: { deploy_webhook_url: 'https://hooks.example.com/p1' } },
    });

    await fireDeployWebhooks(fake.client as any);

    const updates = fake.ops.filter(
      (o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update'
    );
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.retry_count).toBe(1);
    expect(updates[0].payload.last_error).toContain('network down');
    expect('last_fired_at' in updates[0].payload).toBe(false);
  });

  it('sets last_fired_at + last_error and does NOT fetch when deploy_webhook_url missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const fake = makeFakeAdmin({
      queue: [
        {
          project_id: 'p1',
          enqueued_at: '2026-06-09T11:59:00.000Z',
          last_fired_at: null,
          retry_count: 0,
          last_error: null,
        },
      ],
      projects: { p1: {} }, // published_site present but no deploy_webhook_url
    });

    await fireDeployWebhooks(fake.client as any);

    expect(fetchMock).not.toHaveBeenCalled();
    const updates = fake.ops.filter(
      (o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update'
    );
    expect(updates).toHaveLength(1);
    const u = updates[0];
    expect(u.eq).toContainEqual(['project_id', 'p1']);
    expect(u.payload.last_fired_at).toBe('2026-06-09T11:59:00.000Z'); // snapshot
    expect(u.payload.last_error).toBeTruthy();
  });

  it('snapshots enqueued_at (NOT Date.now()) for last_fired_at', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const enqueuedAt = '2026-06-09T11:30:00.000Z'; // distinctly NOT == NOW
    const fake = makeFakeAdmin({
      queue: [
        {
          project_id: 'p1',
          enqueued_at: enqueuedAt,
          last_fired_at: null,
          retry_count: 0,
          last_error: null,
        },
      ],
      projects: { p1: { deploy_webhook_url: 'https://hooks.example.com/p1' } },
    });

    await fireDeployWebhooks(fake.client as any);

    const u = fake.ops.find((o) => o.table === 'mkt_deploy_webhook_queue' && o.op === 'update')!;
    // last_fired_at must equal the snapshot (enqueued_at), NOT now.
    expect(u.payload.last_fired_at).toBe(enqueuedAt);
    expect(u.payload.last_fired_at).not.toBe(new Date(NOW).toISOString());
  });

  it('no-ops when the queue is empty', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fake = makeFakeAdmin({ queue: [] });
    await fireDeployWebhooks(fake.client as any);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── Overlap guard ─────────────────────────────────────────────────────────────
describe('tick() overlap guard', () => {
  it('a second tick() entered while the first is mid-flight returns immediately (Step A runs once)', async () => {
    // Deferred promise to hang the first tick's Step A (the flip UPDATE).
    let releaseFlip!: () => void;
    const flipGate = new Promise<void>((res) => {
      releaseFlip = res;
    });

    let flipCalls = 0;
    const hangingAdmin = {
      from(table: string) {
        const builder: any = {
          update() {
            return builder;
          },
          upsert() {
            return Promise.resolve({ data: null, error: null });
          },
          select() {
            return builder;
          },
          eq() {
            return builder;
          },
          lte() {
            return builder;
          },
          in() {
            return builder;
          },
          maybeSingle() {
            return Promise.resolve({ data: null, error: null });
          },
          then(onFulfilled: any, onRejected: any) {
            if (table === 'mkt_publish_records') {
              flipCalls++;
              // Block the first tick's flip until released.
              return flipGate.then(() => ({ data: [], error: null })).then(onFulfilled, onRejected);
            }
            return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
          },
        };
        return builder;
      },
    };
    (getSupabaseAdmin as any).mockReturnValue(hangingAdmin);

    const first = tick(); // enters, sets running=true, awaits the hanging flip
    await Promise.resolve(); // let the first tick reach the await
    const second = tick(); // should bail immediately on the overlap guard
    await second; // resolves right away (no flip)

    expect(flipCalls).toBe(1); // the guard prevented a 2nd Step A

    releaseFlip(); // let the first tick finish
    await first;

    expect(flipCalls).toBe(1); // still exactly one flip in the whole episode
  });
});
