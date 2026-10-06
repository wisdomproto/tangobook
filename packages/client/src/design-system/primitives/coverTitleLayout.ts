// 제목 자체는 그대로 두고 표시할 줄만 나눈다. 단어 중간은 자르지 않는다.
const phraseBreaks: Record<string, string[]> = {
  '잠자는 숲속의 공주': ['잠자는', '숲속의 공주'],
  '좁쌀 한 톨로 장가든 총각': ['좁쌀 한 톨로', '장가든 총각'],
  '맛있는 음식의 몸속 여행': ['맛있는 음식의', '몸속 여행'],
  '01. 골고루 먹으면 무지개 힘!': ['01. 골고루 먹으면', '무지개 힘!'],
  '02. 치카치카 쓱쓱, 반짝반짝!': ['02. 치카치카 쓱쓱,', '반짝반짝!'],
  '05. 꼭꼭 냠냠, 천천히!': ['05. 꼭꼭 냠냠,', '천천히!'],
};

export function coverTitleLayout(
  title: string,
  width: number,
  preferredSize: number,
  measure: (text: string) => number,
  lang: string
) {
  const text = title.normalize('NFC').trim();
  if (measure(text) <= width) return { lines: [text], fontSize: preferredSize };
  const words = text.split(/\s+/);
  // 띄어쓰기가 없는 중국어·일본어·태국어는 언어의 단어 경계를 사용한다.
  const segments =
    words.length > 1
      ? words
      : /^(zh|ja|th)/.test(lang) && typeof Intl.Segmenter !== 'undefined'
        ? [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(text)].map((s) => s.segment)
        : words;
  const join = (parts: string[]) => parts.join(words.length > 1 ? ' ' : '');
  let lines = phraseBreaks[text];
  if (!lines) {
    let best = Infinity;
    lines = [text];
    for (let i = 1; i < segments.length; i++) {
      const left = join(segments.slice(0, i)).trim();
      const right = join(segments.slice(i)).trim();
      if (!left || !right || /^\d+[.)]$/.test(left)) continue;
      const a = measure(left),
        b = measure(right);
      // 조사/관사/접속사를 앞줄 끝에 홀로 남기지 않고, 문장부호 뒤를 우선한다.
      const dangling = /(?:^|\s)(?:a|an|the|of|and|to|in|with|것|수)$/i.test(left);
      const score =
        Math.max(a, b) +
        Math.abs(a - b) * 0.15 +
        (dangling ? width : 0) -
        (/[!?.,。！？]$/.test(left) ? width * 0.12 : 0);
      if (score < best) {
        best = score;
        lines = [left, right];
      }
    }
  }
  const widest = Math.max(...lines.map(measure), 1);
  return { lines, fontSize: Math.floor(preferredSize * Math.min(1, width / widest) * 10) / 10 };
}
