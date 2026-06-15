// 순수: 후보+검색량 → {primary, secondary}. 관련성(제목 포함) 우선, 그다음 검색량.

/**
 * @param {string} title
 * @param {Array<{keyword,searchVolume,competition,cpc}>} candidates
 * @returns {{primary:string, secondary:string[]}}
 */
export function selectKeywords(title, candidates) {
  const t = (title || '').trim().toLowerCase();
  const seen = new Set();
  const uniq = [];
  for (const c of candidates || []) {
    const k = (c.keyword || '').trim();
    if (k && !seen.has(k)) { seen.add(k); uniq.push({ ...c, keyword: k }); }
  }
  if (uniq.length === 0) return { primary: (title || '').trim(), secondary: [] };

  const scored = uniq.map((c) => ({
    ...c,
    rel: t && c.keyword.toLowerCase().includes(t) ? 1 : 0,
    vol: c.searchVolume || 0,
  }));
  scored.sort((a, b) => b.rel - a.rel || b.vol - a.vol || a.keyword.length - b.keyword.length);

  return { primary: scored[0].keyword, secondary: scored.slice(1, 6).map((c) => c.keyword) };
}
