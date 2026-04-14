import 'dotenv/config';
import { MigrationService } from '../services/migration.service.js';

async function main() {
  const idFlagIdx = process.argv.indexOf('--id');
  const id = idFlagIdx >= 0 ? process.argv[idFlagIdx + 1] : undefined;
  if (!id) {
    console.error('Usage: --id <storybookId>');
    process.exit(2);
  }
  await MigrationService.restoreFromManifest(id);
  console.log(`Restored JSON for ${id} from manifest backup.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
