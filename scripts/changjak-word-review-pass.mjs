import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { root } from './changjak-word-scope.mjs';
const jobs = JSON.parse(fs.readFileSync(root + '/jobs.json')).jobs;
const file = root + '/reviews.json';
const reviews = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};
const ids = process.argv.slice(2).filter((x) => !x.startsWith('--'));
assert(ids.length, 'Specify only job IDs actually inspected visually');
for (const id of ids) {
  const job = jobs.find((x) => x.id === id);
  assert(job, id);
  reviews[id] = {
    status: 'pass',
    note: '실제 이미지 육안 검수: 6칸 순서, 본문 단어 뜻, 시리즈 개체·그림체와 분할 여백 확인.',
    sha256: crypto.createHash('sha256').update(fs.readFileSync(job.out)).digest('hex'),
    verifiedFileAt: new Date().toISOString(),
  };
}
fs.writeFileSync(file, JSON.stringify(reviews, null, 2));
console.log('PASS', ids.join(', '), 'total', Object.keys(reviews).length);
