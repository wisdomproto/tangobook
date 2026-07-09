import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { encrypt, decrypt } from '../external/meta-crypto.js';

const KEY = crypto.randomBytes(32).toString('base64');

describe('meta-crypto', () => {
  it('encrypt→decrypt 왕복', () => {
    const plain = JSON.stringify({ token: 'abc', pages: [1, 2] });
    const cipher = encrypt(plain, KEY);
    expect(cipher).not.toEqual(plain);
    expect(decrypt(cipher, KEY)).toEqual(plain);
  });

  it('다른 키로 복호화 실패', () => {
    const cipher = encrypt('secret', KEY);
    const other = crypto.randomBytes(32).toString('base64');
    expect(() => decrypt(cipher, other)).toThrow();
  });

  it('변조된 페이로드 복호화 실패', () => {
    const cipher = encrypt('secret', KEY);
    const parts = cipher.split('.');
    parts[2] = Buffer.from('tampered').toString('base64');
    expect(() => decrypt(parts.join('.'), KEY)).toThrow();
  });
});
