import { describe, expect, it } from 'vitest';
import { makeVideoAss } from './local-compositor';
describe('local subtitle composition', () => {
  it('scales readable captions to the real resolution and keeps shortform platform clearance', () => {
    const srt = '1\n00:00:01,123 --> 00:00:03,456\n자정이 되면\n마법이 풀립니다.';
    const landscape = makeVideoAss(srt, 1920, 1080, 'long', 88);
    expect(landscape).toContain('Style: Default,Pretendard,88');
    expect(landscape).toContain('0:00:01.12,0:00:03.45');
    expect(landscape).toContain('자정이 되면\\N마법이 풀립니다.');
    const portrait = makeVideoAss(srt, 1080, 1920, 'short', 80);
    expect(portrait).toContain('Pretendard,80');
    expect(portrait).toContain('2,70,70,326,1');
  });
  it('does not execute subtitle content as ASS style overrides', () => {
    const ass = makeVideoAss(
      '1\n00:00:00,000 --> 00:00:02,000\n{\\pos(0,0)}<b>Hello</b>',
      1920,
      1080,
      'long',
      88
    );
    expect(ass).not.toContain('{\\pos');
    expect(ass).toContain('｛＼pos(0,0)｝Hello');
  });
});
