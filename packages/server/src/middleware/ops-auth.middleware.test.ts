import { describe, it, expect } from 'vitest';
import { assertOpsUser } from './ops-auth.middleware.js';
import type { Request } from 'express';

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
