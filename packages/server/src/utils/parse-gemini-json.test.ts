import { describe, it, expect } from 'vitest';
import { parseGeminiJSON } from './parse-gemini-json';

describe('parseGeminiJSON', () => {
  it('parses a raw JSON object', () => {
    expect(parseGeminiJSON('{"a":1}', 'x')).toEqual({ a: 1 });
  });
  it('parses a raw JSON array (regression: outer [] was being stripped)', () => {
    expect(parseGeminiJSON('[{"id":"a"},{"id":"b"}]', 'x')).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
  it('strips ```json fences (object)', () => {
    expect(parseGeminiJSON('```json\n{"a":1}\n```', 'x')).toEqual({ a: 1 });
  });
  it('strips ``` fences (array)', () => {
    expect(parseGeminiJSON('```\n[1,2,3]\n```', 'x')).toEqual([1, 2, 3]);
  });
  it('ignores surrounding prose', () => {
    expect(parseGeminiJSON('Here you go:\n[{"en":"Snow White"}]\nDone.', 'x')).toEqual([
      { en: 'Snow White' },
    ]);
  });
  it('throws on non-JSON', () => {
    expect(() => parseGeminiJSON('not json at all', 'boom')).toThrow('boom');
  });
});
