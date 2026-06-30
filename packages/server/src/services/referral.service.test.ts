import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock providers ────────────────────────────────────────────────────────────
vi.mock('../providers/supabase-admin.provider.js', () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from '../providers/supabase-admin.provider.js';
import { ensureReferralCode, redeemReferral } from './referral.service.js';
import { AppError } from '../middleware/error.middleware.js';

// ── Fake Supabase builder ─────────────────────────────────────────────────────
// Models the supabase-js query builder: chainable + thenable.
// Also supports `.rpc()` for the redeem_referral function.

interface UpsertCall {
  payload: Record<string, unknown>;
  opts?: Record<string, unknown>;
}

interface FakeAdmin {
  client: {
    from: (table: string) => unknown;
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
  selectResult: { referral_code?: string | null } | null;
  upsertError: { message: string; code?: string } | null;
  upsertCalls: UpsertCall[];
  rpcResult: { data: unknown; error: { message: string } | null };
}

function makeFakeAdmin(
  opts: {
    selectResult?: { referral_code?: string | null } | null;
    upsertError?: { message: string; code?: string } | null;
    rpcData?: unknown;
    rpcError?: { message: string } | null;
  } = {}
): FakeAdmin {
  const fake: FakeAdmin = {
    selectResult: opts.selectResult ?? null,
    upsertError: opts.upsertError ?? null,
    upsertCalls: [],
    rpcResult: {
      data: opts.rpcData ?? null,
      error: opts.rpcError ?? null,
    },
    client: null as unknown as FakeAdmin['client'],
  };

  function from(_table: string) {
    let op: 'select' | 'upsert' | null = null;
    let upsertPayload: Record<string, unknown> = {};
    let upsertOpts: Record<string, unknown> | undefined;

    function resolve(): { data: unknown; error: unknown } {
      if (op === 'select') {
        return { data: fake.selectResult, error: null };
      }
      if (op === 'upsert') {
        fake.upsertCalls.push({ payload: upsertPayload, opts: upsertOpts });
        return { data: null, error: fake.upsertError };
      }
      return { data: null, error: null };
    }

    const builder: Record<string, unknown> = {
      select(_cols?: string) {
        op = 'select';
        return builder;
      },
      upsert(payload: Record<string, unknown>, opts?: Record<string, unknown>) {
        op = 'upsert';
        upsertPayload = payload;
        upsertOpts = opts;
        return builder;
      },
      eq(_col: string, _val: unknown) {
        return builder;
      },
      maybeSingle() {
        return Promise.resolve(resolve());
      },
      then(onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) {
        return Promise.resolve(resolve()).then(onFulfilled, onRejected);
      },
    };

    return builder;
  }

  fake.client = {
    from,
    rpc: async (_fn: string, _args: Record<string, unknown>) => fake.rpcResult,
  };

  return fake;
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ══ 1. redeemReferral ════════════════════════════════════════════════════════

describe('redeemReferral', () => {
  // Note: self-referral, already_referred, and the +28-day cap are enforced
  // atomically in the SQL RPC (redeem_referral). Those paths are DB-tested, not
  // unit-tested here — the RPC returns a descriptive reason for each case.

  it('passes through RPC ok:true result with inviterBonus', async () => {
    const fake = makeFakeAdmin({
      rpcData: { ok: true, inviterBonus: 7 },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const result = await redeemReferral('new-acc-uuid', 'abc12345');

    expect(result).toEqual({ ok: true, inviterBonus: 7 });
  });

  it('passes through RPC ok:false with reason (e.g. already_referred)', async () => {
    const fake = makeFakeAdmin({
      rpcData: { ok: false, reason: 'already_referred' },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const result = await redeemReferral('acc-uuid', 'abc12345');

    expect(result).toEqual({ ok: false, reason: 'already_referred' });
  });

  it('throws AppError(500) when RPC returns an error', async () => {
    const fake = makeFakeAdmin({
      rpcError: { message: 'connection refused' },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await expect(redeemReferral('acc-uuid', 'code')).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('throws AppError(503) when admin client is null (Supabase not configured)', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(redeemReferral('acc-uuid', 'code')).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

// ══ 2. ensureReferralCode ═════════════════════════════════════════════════════

describe('ensureReferralCode', () => {
  it('returns existing code without any upsert when code is already present', async () => {
    const fake = makeFakeAdmin({
      selectResult: { referral_code: 'existing8' },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const code = await ensureReferralCode('acc-uuid');

    expect(code).toBe('existing8');
    expect(fake.upsertCalls).toHaveLength(0);
  });

  it('generates and upserts a new code when none exists (null row)', async () => {
    const fake = makeFakeAdmin({
      selectResult: null, // no entitlement row
      upsertError: null,
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const code = await ensureReferralCode('acc-uuid');

    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
    expect(fake.upsertCalls).toHaveLength(1);
    expect(fake.upsertCalls[0].payload).toMatchObject({
      account_id: 'acc-uuid',
      referral_code: code,
    });
  });

  it('generates and upserts a new code when referral_code field is null', async () => {
    const fake = makeFakeAdmin({
      selectResult: { referral_code: null },
      upsertError: null,
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const code = await ensureReferralCode('acc-uuid');

    expect(typeof code).toBe('string');
    expect(fake.upsertCalls).toHaveLength(1);
  });

  it('retries with a new code on unique-constraint violation and returns the successful code', async () => {
    // First upsert call: unique violation; second: success.
    const uniqueError = { message: 'duplicate key violates unique constraint', code: '23505' };
    let callCount = 0;

    const fake = makeFakeAdmin({ selectResult: null });
    // Override upsertError dynamically per call
    Object.defineProperty(fake, 'upsertError', {
      get() {
        callCount++;
        return callCount === 1 ? uniqueError : null;
      },
      configurable: true,
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    const code = await ensureReferralCode('acc-uuid');

    expect(typeof code).toBe('string');
    // Two upsert attempts total: 1 failed + 1 succeeded
    expect(fake.upsertCalls).toHaveLength(2);
    // The two codes must differ (retry generated a new one)
    expect(fake.upsertCalls[0].payload.referral_code).not.toBe(
      fake.upsertCalls[1].payload.referral_code
    );
    // Returned code matches the successful second attempt
    expect(code).toBe(fake.upsertCalls[1].payload.referral_code);
  });

  it('throws AppError(500) on non-unique upsert error', async () => {
    const fake = makeFakeAdmin({
      selectResult: null,
      upsertError: { message: 'permission denied', code: '42501' },
    });
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(fake.client);

    await expect(ensureReferralCode('acc-uuid')).rejects.toMatchObject({
      statusCode: 500,
    });
  });

  it('throws AppError(503) when admin client is null', async () => {
    (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(ensureReferralCode('acc-uuid')).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});
