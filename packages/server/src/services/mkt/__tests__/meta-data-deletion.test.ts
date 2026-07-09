import { describe, it, expect } from 'vitest';
import {
  parseSignedRequest,
  buildSignedRequest,
  deletionConfirmationCode,
} from '../meta-data-deletion.js';

const SECRET = 'app-secret-123';

describe('meta-data-deletion', () => {
  it('유효한 signed_request 파싱', () => {
    const signed = buildSignedRequest({ user_id: '999', algorithm: 'HMAC-SHA256' }, SECRET);
    const payload = parseSignedRequest(signed, SECRET);
    expect(payload).not.toBeNull();
    expect(payload?.user_id).toBe('999');
  });

  it('잘못된 시크릿이면 null', () => {
    const signed = buildSignedRequest({ user_id: '999' }, SECRET);
    expect(parseSignedRequest(signed, 'wrong-secret')).toBeNull();
  });

  it('형식이 깨지면 null', () => {
    expect(parseSignedRequest('', SECRET)).toBeNull();
    expect(parseSignedRequest('no-dot', SECRET)).toBeNull();
    expect(parseSignedRequest('.', SECRET)).toBeNull();
  });

  it('확인 코드는 결정적(같은 입력 → 같은 코드)', () => {
    const a = deletionConfirmationCode('u1', 'salt');
    const b = deletionConfirmationCode('u1', 'salt');
    const c = deletionConfirmationCode('u2', 'salt');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(16);
  });
});
