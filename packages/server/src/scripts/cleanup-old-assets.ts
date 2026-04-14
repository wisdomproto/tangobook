import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const idFlagIdx = args.indexOf('--id');
  return {
    id: idFlagIdx >= 0 ? args[idFlagIdx + 1] : undefined,
    all: args.includes('--all'),
  };
}

async function main() {
  const { id, all } = parseArgs();
  let ids: string[];
  if (id) ids = [id];
  else if (all) ids = await MigrationService.listAllStorybookIds();
  else {
    console.error('Usage: --id <storybookId> | --all');
    process.exit(2);
  }

  let totalDeleted = 0;
  const errors: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const sid = ids[i];
    try {
      if (!(await MigrationService.manifestExists(sid))) {
        console.log(`[${i + 1}/${ids.length}] ${sid} → skip (no manifest)`);
        continue;
      }
      const { deleted, errors: errs } = await MigrationService.cleanupOldAssets(sid);
      totalDeleted += deleted;
      errors.push(...errs);
      console.log(`[${i + 1}/${ids.length}] ${sid} → deleted ${deleted} objects`);
    } catch (e) {
      errors.push(`${sid}: ${(e as Error).message}`);
      console.error(`[${i + 1}/${ids.length}] ${sid} ✗ ${(e as Error).message}`);
    }
  }

  console.log(`\nTotal deleted: ${totalDeleted}`);
  if (errors.length > 0) {
    console.log(`Errors (${errors.length}):`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
