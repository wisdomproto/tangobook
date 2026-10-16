import { describe, expect, it } from 'vitest';
import { POPIT_ALPHABET, POPIT_LETTERS } from './popit-letter-designs';
import { sampleFormationPath } from '@/features/phonics/components/letter-stroke-guide';

describe('92자 팝잇 형태와 터치 분리', () => {
  it('한글40자·영어 대소문자52개가 중복/누락 없이 있다', () => {
    expect(POPIT_ALPHABET).toHaveLength(92);
    expect(new Set(POPIT_ALPHABET).size).toBe(92);
    expect(POPIT_ALPHABET.filter((l) => /[A-Za-z]/.test(l))).toHaveLength(52);
  });
  it.each(POPIT_ALPHABET)('%s는 터치 영역이 분리되고 모든 방울이 글자 획 위에 있다', (letter) => {
    const d = POPIT_LETTERS[letter];
    expect(d.points.length).toBeGreaterThanOrEqual(3);
    expect(d.points.length).toBeLessThanOrEqual(14);
    expect(d.path).not.toMatch(/NaN|undefined|Infinity/);
    const paths = d.path
      .split(/(?=M)/)
      .filter(Boolean)
      .map((p) => sampleFormationPath(p).map((p) => [p.x * 100, p.y * 100]));
    for (const [i, p] of d.points.entries()) {
      expect(p[0]).toBeGreaterThan(25);
      expect(p[0]).toBeLessThan(375);
      expect(p[1]).toBeGreaterThan(30);
      expect(p[1]).toBeLessThan(350);
      for (const q of d.points.slice(i + 1))
        expect(Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]))).toBeGreaterThanOrEqual(79.9);
      const closest = Math.min(
        ...paths.flatMap((path) =>
          path.slice(1).map((b, j) => {
            const a = path[j],
              dx = b[0] - a[0],
              dy = b[1] - a[1],
              t = Math.max(
                0,
                Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))
              );
            return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
          })
        )
      );
      expect(closest).toBeLessThan(1);
    }
  });
});
