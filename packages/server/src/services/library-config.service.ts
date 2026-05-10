import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';
import type { LibraryConfig } from '@tangobook/shared';

const LIBRARY_CONFIG_KEY = '_index/library-config.json';

const EMPTY: LibraryConfig = {};

async function load(): Promise<LibraryConfig> {
  try {
    const url = `${r2PublicUrl}/${LIBRARY_CONFIG_KEY}`;
    const res = await axios.get<LibraryConfig>(url, { timeout: 5000 });
    if (!res.data || typeof res.data !== 'object') return EMPTY;
    return res.data;
  } catch {
    return EMPTY;
  }
}

async function save(cfg: LibraryConfig): Promise<LibraryConfig> {
  const sanitized: LibraryConfig = {
    categoryOrder: Array.isArray(cfg.categoryOrder)
      ? cfg.categoryOrder.filter((c) => typeof c === 'string')
      : undefined,
    bookPriority: (() => {
      if (!cfg.bookPriority || typeof cfg.bookPriority !== 'object') return undefined;
      const out: Record<string, string[]> = {};
      for (const [cat, ids] of Object.entries(cfg.bookPriority)) {
        if (Array.isArray(ids)) {
          out[cat] = ids.filter((id) => typeof id === 'string');
        }
      }
      return Object.keys(out).length > 0 ? out : undefined;
    })(),
    updatedAt: new Date().toISOString(),
  };
  await uploadJsonToR2(sanitized, LIBRARY_CONFIG_KEY);
  return sanitized;
}

export const LibraryConfigService = {
  get: load,
  put: save,
};
