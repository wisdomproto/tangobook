import { describe, it, expect } from 'vitest';
import { assertOpsUser, opsAuth } from './ops-auth.middleware.js';
import type { Request, Response } from 'express';

const reqWith = (headers: Record<string, string>) => ({ headers }) as unknown as Request;

describe('assertOpsUser', () => {
  it('틀린 비밀번호 → 403', async () => {
    await expect(assertOpsUser(reqWith({ 'x-ops-password': 'wrong' }))).rejects.toMatchObject({
      statusCode: 403,
    });
  });
  it('비번도 토큰도 없음 → 401', async () => {
    await expect(assertOpsUser(reqWith({}))).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('opsAuth', () => {
  it('올바른 비밀번호 → next() 인자 없이 호출', async () => {
    const calls: unknown[][] = [];
    await opsAuth(reqWith({ 'x-ops-password': '8054' }), {} as Response, (...args: unknown[]) => {
      calls.push(args);
    });
    expect(calls).toEqual([[]]);
  });
  it('실패 → next(AppError)', async () => {
    const calls: unknown[][] = [];
    await opsAuth(reqWith({}), {} as Response, (...args: unknown[]) => {
      calls.push(args);
    });
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatchObject({ statusCode: 401 });
  });
});
