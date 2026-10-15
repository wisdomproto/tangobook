import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
const source = fs.readFileSync(
  path.join(root, 'packages/remotion/src/samples/trainMotion.ts'),
  'utf8'
);
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { smoothTrainProgress } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
);
const timing = JSON.parse(
  fs.readFileSync(
    path.join(root, 'packages/remotion/public/gagya-song-20261015/timing.json'),
    'utf8'
  )
);
const report = [];
for (const row of [1, 3]) {
  const starts = timing.rows[row],
    end = timing.ends[row];
  const fn = (t) => smoothTrainProgress(t, starts, end);
  const anchors = starts.map((v, i) => v + Math.min(0.1, ((starts[i + 1] ?? end) - v) * 0.4));
  let anchorError = 0,
    velocityJoinError = 0,
    minStep = Infinity;
  for (const [i, t] of anchors.entries()) {
    anchorError = Math.max(anchorError, Math.abs(fn(t) - i) * 320);
    const eps = 1e-5,
      left = (fn(t) - fn(t - eps)) / eps,
      right = (fn(t + eps) - fn(t)) / eps;
    velocityJoinError = Math.max(velocityJoinError, Math.abs(left - right) / Math.max(left, right));
  }
  const samples = [];
  for (
    let frame = Math.ceil((starts[0] - 0.8) * 30);
    frame <= Math.floor((end + 0.3) * 30);
    frame++
  ) {
    const t = frame / 30,
      step = (fn(t + 1 / 30) - fn(t)) * 320;
    minStep = Math.min(minStep, step);
    samples.push({ frame, progress: fn(t), step_px: step });
  }
  assert(anchorError < 1e-6);
  assert(velocityJoinError < 0.002);
  assert(minStep > 0.05, 'The train must keep moving through every rendered frame.');
  report.push({
    row: row + 1,
    anchorErrorPx: anchorError,
    maxRelativeVelocityJoinError: velocityJoinError,
    minTravelPerFramePx: minStep,
    anchors,
    samples,
  });
}
const out = 'D:/tangobook-video/gagya-song-20261015/revision-v5';
fs.writeFileSync(
  path.join(out, 'motion-verification.json'),
  JSON.stringify({ rows: report }, null, 2)
);
console.log(
  JSON.stringify(
    report.map(({ samples, ...r }) => r),
    null,
    2
  )
);
