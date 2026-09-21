// Read-only task discovery. Does not fetch, change branches, or inspect credentials.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => !['--json', '--current'].includes(arg))) {
  console.error('Usage: node scripts/work-status.mjs [--json] [--current]');
  process.exit(2);
}
const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...argv) => execFileSync('git', ['-C', scriptRoot, ...argv], {
  encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const root = git('rev-parse', '--show-toplevel');
const domains = JSON.parse(fs.readFileSync(path.join(scriptRoot, 'docs/work/domains.json'), 'utf8'));
const validStates = new Set(['planned', 'active', 'paused', 'ready', 'integrated']);
const warnings = [];
const tasks = [];
const worktrees = git('-c', 'core.quotepath=false', 'worktree', 'list', '--porcelain')
  .split(/\r?\n\r?\n/).filter(Boolean).map((block) => {
    const lines = block.split(/\r?\n/);
    const field = (key) => lines.find((line) => line.startsWith(key + ' '))?.slice(key.length + 1);
    return { path: field('worktree'), head: field('HEAD'), branch: field('branch')?.replace(/^refs\/heads\//, '') ?? '(detached)' };
  });
for (const wt of worktrees) {
  wt.current = path.resolve(wt.path).toLowerCase() === path.resolve(root).toLowerCase();
  if (args.has('--current') && !wt.current) continue;
  wt.records = 0;
  if (!fs.existsSync(wt.path)) { warnings.push(`Missing worktree: ${wt.path}`); continue; }
  for (const domain of domains) {
    const dir = path.join(wt.path, 'docs/work', domain.id, 'tasks');
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'README.md') continue;
      const file = path.join(dir, entry.name);
      const body = fs.readFileSync(file, 'utf8');
      const fields = Object.fromEntries([...body.matchAll(/^- ([a-z]+): (.*)$/gm)].map((m) => [m[1], m[2].trim()]));
      if (!fields.id || fields.domain !== domain.id || !validStates.has(fields.status)) {
        warnings.push(`Invalid task metadata: ${file}`); continue;
      }
      tasks.push({ id: fields.id, domain: domain.id, title: body.match(/^# (.+)$/m)?.[1]?.trim() ?? entry.name,
        status: fields.status, updated: fields.updated, integration: fields.integration, delivery: fields.delivery,
        recordedBranch: fields.branch, actualBranch: wt.branch, worktree: wt.path,
        branchMatches: fields.branch === wt.branch, current: wt.current, file });
      wt.records++;
    }
  }
}
const selected = worktrees.filter((wt) => !args.has('--current') || wt.current);
const result = { root, domains: domains.map(({ id, name }) => ({ id, name })), tasks, worktrees: selected, warnings };
if (args.has('--json')) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`작업 기록 조회: ${root}`);
  console.log('상태는 기록값입니다. 실행 중 여부는 아니며 복사된 기록은 id와 실제 브랜치를 대조하세요.');
  for (const task of tasks) console.log(`[${task.status}] ${task.domain}: ${task.title}\n  ${task.file}\n  실제 브랜치: ${task.actualBranch} / 기록 브랜치: ${task.recordedBranch}`);
  const unknown = selected.filter((wt) => wt.records === 0);
  console.log(`\n등록된 기록 ${tasks.length}개; 기록 없는 작업 폴더 ${unknown.length}개 (미이관 또는 작업 없음).`);
  for (const wt of unknown) console.log(`  ${wt.branch}: ${wt.path}`);
  for (const warning of warnings) console.warn(warning);
}
