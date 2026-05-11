import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

const VOCAB_OVERRIDES_KEY = '_index/vocab-overrides.json';

export interface VocabRename {
  word?: string;
  en?: string;
  catId?: string;
}

export interface VocabOverrides {
  exclusions?: string[];
  renames?: Record<string, VocabRename>;
  updatedAt?: string;
}

const EMPTY: VocabOverrides = {};

async function load(): Promise<VocabOverrides> {
  try {
    const url = `${r2PublicUrl}/${VOCAB_OVERRIDES_KEY}`;
    const res = await axios.get<VocabOverrides>(url, { timeout: 5000 });
    if (!res.data || typeof res.data !== 'object') return EMPTY;
    return res.data;
  } catch {
    return EMPTY;
  }
}

async function save(cfg: VocabOverrides): Promise<VocabOverrides> {
  const sanitized: VocabOverrides = {
    exclusions: Array.isArray(cfg.exclusions)
      ? cfg.exclusions.filter((s) => typeof s === 'string' && s.length > 0)
      : [],
    renames: (() => {
      if (!cfg.renames || typeof cfg.renames !== 'object') return {};
      const out: Record<string, VocabRename> = {};
      for (const [key, val] of Object.entries(cfg.renames)) {
        if (!key || typeof val !== 'object' || val === null) continue;
        const r: VocabRename = {};
        if (typeof val.word === 'string') r.word = val.word;
        if (typeof val.en === 'string') r.en = val.en;
        if (typeof val.catId === 'string') r.catId = val.catId;
        if (r.word || r.en !== undefined || r.catId) out[key] = r;
      }
      return out;
    })(),
    updatedAt: new Date().toISOString(),
  };
  await uploadJsonToR2(sanitized, VOCAB_OVERRIDES_KEY);
  return sanitized;
}

export const VocabOverridesService = {
  get: load,
  put: save,
};
