import 'dotenv/config';
import { listR2Objects, downloadFromR2, deleteFromR2 } from '../providers/r2.provider.js';
import type { Manifest } from '../services/migration.service.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const idFlagIdx = args.indexOf('--id');
  return {
    id: idFlagIdx >= 0 ? args[idFlagIdx + 1] : undefined,
    all: args.includes('--all'),
  };
}

function log(msg: string) {
  process.stdout.write(msg + '\n');
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const { id, all } = parseArgs();
  if (!id && !all) {
    log('Usage: --id <storybookId> | --all');
    process.exit(2);
  }

  log('Listing manifests...');
  const objects = await listR2Objects('_migrations/');
  let manifestKeys = objects
    .map((o) => o.Key)
    .filter((k): k is string => !!k && k.endsWith('.json'));

  if (id) {
    manifestKeys = manifestKeys.filter((k) => k.endsWith(`-${id}.json`));
    if (manifestKeys.length === 0) {
      log(`No manifest found for ${id}`);
      process.exit(1);
    }
  }
  log(`Found ${manifestKeys.length} manifest(s). Loading...`);

  const manifests = await mapWithConcurrency(manifestKeys, 10, async (key) => {
    const buf = await downloadFromR2(key);
    return JSON.parse(buf.toString('utf-8')) as Manifest;
  });

  const oldKeys: string[] = [];
  for (const m of manifests) {
    for (const mapping of m.mappings) {
      oldKeys.push(mapping.oldKey);
    }
  }
  log(`Collected ${oldKeys.length} old asset keys. Deleting...`);

  let deleted = 0;
  let failed = 0;
  const startedAt = Date.now();

  await mapWithConcurrency(oldKeys, 20, async (key) => {
    try {
      await deleteFromR2(key);
      deleted++;
      if (deleted % 200 === 0) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        log(`  ${deleted}/${oldKeys.length} deleted (${elapsed}s)`);
      }
    } catch (e) {
      failed++;
      log(`  ✗ ${key}: ${(e as Error).message}`);
    }
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  log(`\nDone in ${elapsed}s. Deleted ${deleted}, failed ${failed}.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
