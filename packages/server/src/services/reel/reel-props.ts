export function firstClause(text: string, maxLen = 40): string {
  const t = (text ?? '').trim();
  if (!t) return '';
  const stop = t.search(/[.!?。,、]/);
  let s = stop > 0 ? t.slice(0, stop) : t;
  if (s.length > maxLen) {
    const cut = s.lastIndexOf(' ', maxLen);
    s = s.slice(0, cut > 0 ? cut : maxLen);
  }
  return s.trim();
}

export function splitIntoBuckets<T>(items: T[], n: number): T[][] {
  const out: T[][] = Array.from({ length: n }, () => []);
  const base = Math.floor(items.length / n);
  const extra = items.length % n;
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const take = base + (i < extra ? 1 : 0);
    out[i] = items.slice(idx, idx + take);
    idx += take;
  }
  return out;
}
