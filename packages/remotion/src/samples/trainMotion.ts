// Monotone C1 Hermite interpolation: continuous positive travel velocity,
// exact vocal anchors, and no hold-and-jump segments or overshoot.
export function smoothTrainProgress(t: number, starts: readonly number[], end: number) {
  const anchors = starts.map((start, i) => {
    const next = i < starts.length - 1 ? starts[i + 1] : end;
    return start + Math.min(0.1, (next - start) * 0.4);
  });
  const x = [starts[0] - 0.8, ...anchors, end + 0.3];
  const y = [-4, ...starts.map((_, i) => i), 11.1];
  const h = x.slice(1).map((v, i) => v - x[i]);
  const d = h.map((v, i) => (y[i + 1] - y[i]) / v);
  const m = [d[0]];
  for (let i = 1; i < x.length - 1; i++) {
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m.push((w1 + w2) / (w1 / d[i - 1] + w2 / d[i]));
  }
  m.push(d[d.length - 1]);
  if (t <= x[0]) return y[0] + (t - x[0]) * m[0];
  const last = x.length - 1;
  if (t >= x[last]) return y[last] + (t - x[last]) * m[last];
  const i = x.findIndex((v, j) => j > 0 && t < v) - 1;
  const u = (t - x[i]) / h[i];
  return (
    (2 * u ** 3 - 3 * u ** 2 + 1) * y[i] +
    (u ** 3 - 2 * u ** 2 + u) * h[i] * m[i] +
    (-2 * u ** 3 + 3 * u ** 2) * y[i + 1] +
    (u ** 3 - u ** 2) * h[i] * m[i + 1]
  );
}
