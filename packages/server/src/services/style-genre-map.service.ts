import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

const STYLE_GENRE_KEY = '_index/style-genre-map.json';

/** styleId → 장르 슬러그 ('watercolor' | 'paper3d' | 'collage'). 저작도구에서 수동 지정. */
export type StyleGenreMap = Record<string, string>;

const VALID_SLUGS = new Set(['watercolor', 'paper3d', 'collage']);

async function load(): Promise<StyleGenreMap> {
  try {
    const url = `${r2PublicUrl}/${STYLE_GENRE_KEY}`;
    const res = await axios.get<StyleGenreMap>(url, { timeout: 5000 });
    if (!res.data || typeof res.data !== 'object') return {};
    return res.data;
  } catch {
    return {};
  }
}

async function save(map: unknown): Promise<StyleGenreMap> {
  const out: StyleGenreMap = {};
  if (map && typeof map === 'object') {
    for (const [styleId, slug] of Object.entries(map as Record<string, unknown>)) {
      if (!styleId || typeof slug !== 'string') continue;
      if (VALID_SLUGS.has(slug)) out[styleId] = slug;
    }
  }
  await uploadJsonToR2(out, STYLE_GENRE_KEY);
  return out;
}

export const StyleGenreMapService = {
  get: load,
  put: save,
};
