import type { NaverKeyword } from './naver-searchad.js';

export type Competition = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GoldenCandidate {
  keyword: string;
  vol: number; // pc + mobile
  comp: Competition;
  pc: number;
  mob: number;
}

/** Map a Naver SearchAd row → candidate (vol = pc + mobile). */
export function toCandidate(nk: NaverKeyword): GoldenCandidate {
  return {
    keyword: nk.keyword,
    vol: nk.pcSearchVolume + nk.mobileSearchVolume,
    comp: nk.competition, // already enum from mapCompetition
    pc: nk.pcSearchVolume,
    mob: nk.mobileSearchVolume,
  };
}

/** Dedupe by keyword, keeping the entry with the highest volume (CF :286). */
export function dedupeByMaxVolume(rows: GoldenCandidate[]): Map<string, GoldenCandidate> {
  const map = new Map<string, GoldenCandidate>();
  for (const r of rows) {
    const cur = map.get(r.keyword);
    if (!cur || cur.vol < r.vol) map.set(r.keyword, r);
  }
  return map;
}

/** Filter: vol>=300 AND comp ∈ {LOW, MEDIUM}, sorted by vol desc (CF :294–297, enum). */
export function filterGoldenCandidates(rows: GoldenCandidate[]): GoldenCandidate[] {
  return rows
    .filter((r) => r.vol >= 300 && (r.comp === 'LOW' || r.comp === 'MEDIUM'))
    .sort((a, b) => b.vol - a.vol);
}

export interface GoldenTiers {
  gold: GoldenCandidate[]; // 🏆 황금
  silver: GoldenCandidate[]; // 🥇 유망
  bronze: GoldenCandidate[]; // 🥈 일반
}

/**
 * 3-tier classification (CF :337–340, enum):
 *   🏆 gold   = vol>=1000 && comp===LOW
 *   🥇 silver = (comp===LOW || (vol>=3000 && comp===MEDIUM)) minus gold
 *   🥈 bronze = the rest
 */
export function classifyGoldenTiers(rows: GoldenCandidate[]): GoldenTiers {
  const gold = rows.filter((g) => g.vol >= 1000 && g.comp === 'LOW');
  const goldSet = new Set(gold);
  const silver = rows.filter(
    (g) => !goldSet.has(g) && (g.comp === 'LOW' || (g.vol >= 3000 && g.comp === 'MEDIUM'))
  );
  const silverSet = new Set(silver);
  const bronze = rows.filter((g) => !goldSet.has(g) && !silverSet.has(g));
  return { gold, silver, bronze };
}
