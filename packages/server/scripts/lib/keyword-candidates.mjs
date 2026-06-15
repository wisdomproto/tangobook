// 순수: 동화책 키워드 후보 생성 + 메인(헤드) 키워드 풀. DB·네트워크 없음.

export const MAIN_KEYWORDS = {
  ko: ['동화책', '유아 동화책', '4세 동화책', '5세 동화책', '그림책', '명작 동화', '자연관찰 책', '잠자리 동화', '유아 그림책 추천'],
  en: ['fairy tale books for kids', 'bedtime stories for toddlers', 'classic fairy tales', 'preschool story books', 'picture books for kids', 'kids nature books'],
  vi: ['truyện cổ tích cho bé', 'truyện tranh cho bé', 'sách cho bé', 'truyện trước khi ngủ', 'sách tranh mầm non'],
  th: ['นิทานสำหรับเด็ก', 'นิทานก่อนนอน', 'หนังสือนิทานเด็ก', 'หนังสือภาพสำหรับเด็ก'],
};

const SUFFIX = {
  ko: {
    classic: ['', ' 동화', ' 이야기', ' 줄거리', ' 교훈', ' 그림책', ' 동화책'],
    nature: ['', ' 그림책', ' 관찰', ' 특징', ' 동화', ' 유아'],
  },
  en: {
    classic: ['', ' story', ' fairy tale', ' story for kids', ' bedtime story', ' book for kids'],
    nature: ['', ' for kids', ' facts for kids', ' picture book', ' book for toddlers'],
  },
  vi: {
    classic: ['', ' truyện', ' truyện cổ tích', ' cho bé', ' truyện tranh'],
    nature: ['', ' cho bé', ' sách tranh', ' tìm hiểu cho bé'],
  },
  th: {
    classic: ['', ' นิทาน', ' นิทานสำหรับเด็ก', ' นิทานก่อนนอน'],
    nature: ['', ' สำหรับเด็ก', ' หนังสือภาพ'],
  },
};

/** (제목, 카테고리, 언어) → 후보 키워드 배열(중복 제거). */
export function buildCandidates(title, category, lang) {
  const t = (title || '').trim();
  if (!t) return [];
  const cat = category === 'nature' ? 'nature' : 'classic';
  const suffixes = (SUFFIX[lang] && SUFFIX[lang][cat]) || [''];
  const out = [];
  const seen = new Set();
  for (const s of suffixes) {
    const kw = (t + s).trim();
    if (!seen.has(kw)) { seen.add(kw); out.push(kw); }
  }
  return out;
}
