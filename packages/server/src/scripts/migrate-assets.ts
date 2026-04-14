import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const idFlagIdx = args.indexOf('--id');
  const id = idFlagIdx >= 0 ? args[idFlagIdx + 1] : undefined;
  return {
    id,
    all: args.includes('--all'),
    dryRun: args.includes('--dry-run'),
    resume: args.includes('--resume'),
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const { id, all, dryRun, resume } = parseArgs();

  let ids: string[];
  if (id) ids = [id];
  else if (all) ids = await MigrationService.listAllStorybookIds();
  else {
    console.error('Usage: --id <storybookId> | --all [--dry-run] [--resume]');
    process.exit(2);
  }

  console.log(`Target: ${ids.length} storybook(s). dryRun=${dryRun}, resume=${resume}`);

  let totalOld = 0;
  let totalNew = 0;
  const failed: Array<{ id: string; err: string }> = [];

  for (let i = 0; i < ids.length; i++) {
    const sid = ids[i];
    const prefix = `[${i + 1}/${ids.length}] ${sid}`;
    try {
      if (resume && (await MigrationService.manifestExists(sid))) {
        console.log(`${prefix} → skip (manifest exists)`);
        continue;
      }
      const start = Date.now();
      const manifest = await MigrationService.convertStorybook(sid, { dryRun });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      totalOld += manifest.stats.oldBytes;
      totalNew += manifest.stats.newBytes;
      console.log(
        `${prefix} ✓ ${manifest.stats.files} files, ${formatBytes(manifest.stats.oldBytes)} → ${formatBytes(manifest.stats.newBytes)} in ${elapsed}s`
      );
    } catch (e) {
      const msg = (e as Error).message;
      failed.push({ id: sid, err: msg });
      console.error(`${prefix} ✗ ${msg}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Processed: ${ids.length - failed.length}/${ids.length}`);
  console.log(`Total size: ${formatBytes(totalOld)} → ${formatBytes(totalNew)}`);
  if (failed.length > 0) {
    console.log(`Failed (${failed.length}):`);
    for (const f of failed) console.log(`  ${f.id}: ${f.err}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
