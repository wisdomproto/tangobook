import {
  downloadFromR2,
  uploadBufferToR2,
  uploadJsonToR2,
  deleteFromR2,
  urlToR2Key,
  objectExists,
  listR2Objects,
} from '../providers/r2.provider.js';
import { wavToMp3, imageToWebp } from '../utils/transcode.js';
import { walkAndCollect, walkAndTransform, makeExtensionMatcher } from '../utils/url-walker.js';

const STORYBOOK_PREFIX = 'storybook-';
const MIGRATION_PREFIX = '_migrations/';
const BACKUP_PREFIX = '_backup/';

interface Mapping {
  oldUrl: string;
  newUrl: string;
  oldKey: string;
  newKey: string;
  type: 'audio' | 'image';
  oldBytes?: number;
  newBytes?: number;
}

export interface Manifest {
  storybookId: string;
  migratedAt: string;
  backupKey: string;
  mappings: Mapping[];
  stats: { files: number; oldBytes: number; newBytes: number };
}

const match = makeExtensionMatcher(['wav', 'png']);

function classify(url: string): 'audio' | 'image' {
  return /\.wav(\?|$)/i.test(url) ? 'audio' : 'image';
}

function newKeyFor(oldKey: string): string {
  return oldKey.replace(/\.wav$/i, '.mp3').replace(/\.png$/i, '.webp');
}

function newUrlFor(oldUrl: string): string {
  return oldUrl.replace(/\.wav(\?|$)/i, '.mp3$1').replace(/\.png(\?|$)/i, '.webp$1');
}

function manifestKey(storybookId: string, dateIso: string): string {
  return `${MIGRATION_PREFIX}${dateIso.slice(0, 10)}-${storybookId}.json`;
}
function backupKey(storybookId: string, dateIso: string): string {
  return `${BACKUP_PREFIX}${dateIso.slice(0, 10)}-${storybookId}.json`;
}

export const MigrationService = {
  async listAllStorybookIds(): Promise<string[]> {
    const objects = await listR2Objects(STORYBOOK_PREFIX);
    const ids: string[] = [];
    for (const obj of objects) {
      const key = obj.Key;
      if (!key?.endsWith('.json')) continue;
      const id = key.slice(STORYBOOK_PREFIX.length, -'.json'.length);
      ids.push(id);
    }
    return ids;
  },

  async listMigratedIds(): Promise<Set<string>> {
    const objects = await listR2Objects(MIGRATION_PREFIX);
    const ids = new Set<string>();
    for (const obj of objects) {
      const m = obj.Key?.match(/-(\d+)\.json$/);
      if (m) ids.add(m[1]);
    }
    return ids;
  },

  async manifestExists(storybookId: string): Promise<boolean> {
    const objects = await listR2Objects(MIGRATION_PREFIX);
    return objects.some((o) => o.Key?.endsWith(`-${storybookId}.json`));
  },

  async convertStorybook(storybookId: string, opts: { dryRun?: boolean } = {}): Promise<Manifest> {
    const now = new Date().toISOString();
    const jsonKey = `${STORYBOOK_PREFIX}${storybookId}.json`;
    const jsonBuf = await downloadFromR2(jsonKey);
    const json = JSON.parse(jsonBuf.toString('utf-8'));

    const collected = walkAndCollect(json, match);
    const unique = new Map<string, 'audio' | 'image'>();
    for (const { url } of collected) unique.set(url, classify(url));

    const entries = Array.from(unique.entries());
    const CONCURRENCY = 6;

    async function convertOne(
      oldUrl: string,
      type: 'audio' | 'image'
    ): Promise<Mapping & { _oldBytes: number; _newBytes: number }> {
      const oldKey = urlToR2Key(oldUrl);
      const newKey = newKeyFor(oldKey);
      const newUrl = newUrlFor(oldUrl);

      if (opts.dryRun) {
        return { oldUrl, newUrl, oldKey, newKey, type, _oldBytes: 0, _newBytes: 0 };
      }

      const already = await objectExists(newKey);
      let outSize = 0;
      let srcSize = 0;
      if (!already) {
        const srcBuf = await downloadFromR2(oldKey);
        srcSize = srcBuf.length;
        const out = type === 'audio' ? await wavToMp3(srcBuf) : await imageToWebp(srcBuf);
        outSize = out.length;
        const contentType = type === 'audio' ? 'audio/mpeg' : 'image/webp';
        await uploadBufferToR2(out, newKey, contentType);
        const exists = await objectExists(newKey);
        if (!exists) throw new Error(`Upload verify failed: ${newKey}`);
      }
      return {
        oldUrl,
        newUrl,
        oldKey,
        newKey,
        type,
        oldBytes: srcSize || undefined,
        newBytes: outSize || undefined,
        _oldBytes: srcSize,
        _newBytes: outSize,
      };
    }

    const results: Array<Mapping & { _oldBytes: number; _newBytes: number }> = [];
    for (let i = 0; i < entries.length; i += CONCURRENCY) {
      const batch = entries.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(batch.map(([u, t]) => convertOne(u, t)));
      results.push(...batchResults);
    }

    const mappings: Mapping[] = results.map(({ _oldBytes: _o, _newBytes: _n, ...m }) => m);
    const oldBytes = results.reduce((s, r) => s + r._oldBytes, 0);
    const newBytes = results.reduce((s, r) => s + r._newBytes, 0);

    const manifest: Manifest = {
      storybookId,
      migratedAt: now,
      backupKey: backupKey(storybookId, now),
      mappings,
      stats: { files: mappings.length, oldBytes, newBytes },
    };

    if (opts.dryRun) return manifest;

    await uploadBufferToR2(jsonBuf, manifest.backupKey, 'application/json');

    const urlMap = new Map(mappings.map((m) => [m.oldUrl, m.newUrl]));
    const rewritten = walkAndTransform(json, (url) => urlMap.get(url));
    await uploadJsonToR2(rewritten, jsonKey);

    await uploadJsonToR2(manifest, manifestKey(storybookId, now));

    return manifest;
  },

  async cleanupOldAssets(storybookId: string): Promise<{ deleted: number; errors: string[] }> {
    const candidates = await listR2Objects(MIGRATION_PREFIX);
    const found = candidates.find((o) => o.Key?.endsWith(`-${storybookId}.json`));
    if (!found?.Key) throw new Error(`Manifest not found for ${storybookId}`);
    const manifestBuf = await downloadFromR2(found.Key);
    const manifest = JSON.parse(manifestBuf.toString('utf-8')) as Manifest;

    let deleted = 0;
    const errors: string[] = [];
    for (const m of manifest.mappings) {
      try {
        if (await objectExists(m.oldKey)) {
          await deleteFromR2(m.oldKey);
          deleted++;
        }
      } catch (e) {
        errors.push(`${m.oldKey}: ${(e as Error).message}`);
      }
    }
    return { deleted, errors };
  },

  async restoreFromManifest(storybookId: string): Promise<void> {
    const candidates = await listR2Objects(MIGRATION_PREFIX);
    const found = candidates.find((o) => o.Key?.endsWith(`-${storybookId}.json`));
    if (!found?.Key) throw new Error(`Manifest not found for ${storybookId}`);
    const manifest = JSON.parse((await downloadFromR2(found.Key)).toString('utf-8')) as Manifest;
    const backup = await downloadFromR2(manifest.backupKey);
    const jsonKey = `${STORYBOOK_PREFIX}${storybookId}.json`;
    await uploadBufferToR2(backup, jsonKey, 'application/json');
  },
};
