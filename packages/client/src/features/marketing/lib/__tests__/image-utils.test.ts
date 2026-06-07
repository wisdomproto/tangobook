import { describe, it, expect } from 'vitest';
import { base64ToBlob } from '../image-utils';

// "AAAA" decodes to 3 zero bytes
describe('base64ToBlob', () => {
  it('parses a data URL and uses its mime type', () => {
    const blob = base64ToBlob('data:image/png;base64,AAAA');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(3);
  });

  it('accepts raw base64 with an explicit mimeType', () => {
    const blob = base64ToBlob('AAAA', 'image/webp');
    expect(blob.type).toBe('image/webp');
    expect(blob.size).toBe(3);
  });

  it('throws on a malformed data URL', () => {
    expect(() => base64ToBlob('data:image/png,notbase64')).toThrow();
  });

  it('throws when raw base64 is given without a mimeType', () => {
    expect(() => base64ToBlob('AAAA')).toThrow();
  });
});
