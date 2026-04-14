import 'dotenv/config';
import { listR2Objects } from '../providers/r2.provider.js';

(async () => {
  const objects = await listR2Objects('_migrations/');
  console.log('manifests:', objects.length);
  const ids = objects
    .map((o) => o.Key?.match(/-(\d+)\.json$/)?.[1])
    .filter(Boolean)
    .sort();
  console.log('last 5:', ids.slice(-5));
})();
