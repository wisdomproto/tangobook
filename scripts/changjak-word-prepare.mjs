import fs from 'node:fs';
import crypto from 'node:crypto';
import { SERIES } from '../packages/client/scripts/_series-config.mjs';
import { root, targets } from './changjak-word-scope.mjs';
const books = JSON.parse(fs.readFileSync(root + '/books-before.json'));
const grouped = new Map();
function sense(word, context, series, fullText = '') {
  if (+SERIES[series].no >= 11) {
    if (
      word === '나비' &&
      series === 'bami' &&
      /고양이 나비|나비가.*꼬리|나비.*고양이/.test(fullText)
    )
      return 'cat-named-nabi';
    if (
      word === '바퀴' &&
      /한 바퀴|한바퀴|그릇.*바퀴/.test(context) &&
      !/바퀴가|바퀴를|수레|자전거/.test(context)
    )
      return 'one-round';
    if (
      word === '가지' &&
      /[두세네한] 가지|몇 가지/.test(context) &&
      !/나뭇가지|낮은 가지|높은 가지/.test(context)
    )
      return 'several-kinds';
    if (word === '가지' && /가지 마/.test(context) && !/나뭇가지/.test(context)) return 'leaving';
    if (word === '방울') return /딸랑|발목|종소리|목에/.test(context) ? 'bell' : 'liquid-drop';
    if (word === '껍질' && /코코넛/.test(context)) return 'coconut-shell';
    if (word === '껍질' && /밤송이|가시투성이/.test(context)) return 'chestnut-bur';
    if (word === '껍질' && /밤을|밤이|밤 껍질/.test(context)) return 'chestnut-shell';
    if (word === '조각' && /잎 조각/.test(context)) return 'leaf-fragment';
    if (word === '조각' && /쨍그랑|깨뜨렸|깨진|컵/.test(context)) return 'broken-ceramic';
    if (word === '조각' && series === 'yuki' && /수박/.test(fullText)) return 'watermelon-slice';
  }
  if (word === '방울' && series === 'pipo' && !/딸랑|목에|울려|방울을 샀/.test(context))
    return 'liquid-drop';
  if (word === '날개')
    return /풍차/.test(context)
      ? 'windmill-blade'
      : /물레방아.*날개|날개.*물레방아/.test(context)
        ? 'waterwheel-paddle'
        : 'bird-wing';
  if (word === '바퀴') return /물레방아|물방앗간/.test(context) ? 'water-wheel' : 'vehicle-wheel';
  if (word === '가지')
    return /가지/.test(context) &&
      /(가지[를는가에]?\s*(썰|볶|먹)|보라.*가지|가지.*채소)/.test(context)
      ? 'eggplant'
      : 'branch';
  if (word === '눈')
    return /눈[이을에]?\s*(내|쌓|녹|뭉|그치)|눈밭|눈사람|하얀 눈/.test(context) ? 'snow' : 'eye';
  if (['조각', '껍질', '그림', '간식', '손잡이'].includes(word)) {
    const choices =
      word === '그림'
        ? ['나무', '물고기', '나비', '바다', '꽃', '집', '가족']
        : word === '손잡이'
          ? ['바구니', '문', '물통', '냄비', '자전거']
          : [
              '종이',
              '치즈',
              '빵',
              '얼음',
              '나무',
              '감자',
              '호박',
              '사과',
              '조개',
              '달걀',
              '밀가루',
            ];
    return choices.find((x) => context.includes(x)) || 'generic';
  }
  return 'default';
}
for (const b of Object.values(books).sort((a, b) => a.id.localeCompare(b.id))) {
  const series = b.id.replace('changjak-', '').replace(/-\d+$/, '');
  for (const o of b.key_objects || []) {
    const word = o.korean || o.name,
      context = (o.pages || [])
        .map((n) => b.pages.find((p) => p.page_number === n)?.text || '')
        .join(' ');
    const variant = sense(word, context, series, b.pages.map((p) => p.text || '').join(' ')),
      key = series + '|' + word + '|' + variant;
    let card = grouped.get(key);
    if (!card) {
      card = {
        id:
          series +
          '-' +
          crypto
            .createHash('sha256')
            .update(word + '|' + variant)
            .digest('hex')
            .slice(0, 10),
        series,
        word,
        variant,
        context,
        description: o.description || '',
        uses: [],
      };
      grouped.set(key, card);
    }
    card.uses.push({ bookId: b.id, objectName: o.name, word, pages: o.pages });
  }
}
const cards = [...grouped.values()],
  jobs = [];
const base =
  '독립된 유아용 핵심단어 삽화를 3열×2행, 정확히 같은 크기의 정사각형 6칸에 배치한 가로 그림을 만들어 주세요. 각 칸은 나중에 따로 잘라 단어 카드로 사용합니다. 순서는 왼쪽 위부터 행 우선. 각 대상은 칸 중앙에 충분한 여백을 두고 온전히 보이며 다른 칸으로 넘어가지 않습니다. 첨부한 실제 동화의 그림체·색감·재료 질감을 따릅니다. 사물은 사물 하나 또는 자연스러운 한 세트, 장소는 그 장소를 알아볼 수 있는 작은 독립 장면, 신체 부위는 동물 몸의 일부에 연결된 자연스러운 근접 그림으로 표현합니다. 바람·노래·그림자처럼 형태가 없는 단어는 움직이는 천·노래하는 동물·빛 아래 드리운 그림자처럼 뜻이 읽히는 작은 장면으로 그립니다. 동물이 필요할 때 해당 종의 외형을 자연스럽게 유지합니다. 단어 카드의 배경은 밝은 크림색이고 글자·숫자·라벨·말풍선은 넣지 않습니다. 격자 경계는 얇고 절단 위치는 정확한 3등분×2등분입니다. 카드를 작게 볼 때 뜻을 바로 알아볼 수 있도록 복잡한 배경과 장식을 줄입니다. 일반 화면용 화질이며 인쇄용 고해상도는 필요 없습니다.';
for (const [series, cfg] of targets) {
  const cs = cards.filter((c) => c.series === series);
  if (series === 'pongi') {
    const first = ['신발', '마당', '바퀴', '상자', '진흙', '냄비'].map((w) =>
      cs.find((c) => c.word === w)
    );
    jobs.push({
      id: 'pongi-001',
      series,
      cards: first.map((c) => c.id),
      out: root + '/sheets/pongi-001.png',
      completed: true,
    });
  }
  const rest = cs.filter((c) => !(series === 'pongi' && jobs[0].cards.includes(c.id)));
  for (let i = 0; i < rest.length; i += 6) {
    const chunk = rest.slice(i, i + 6),
      number = String(Math.floor(i / 6) + (series === 'pongi' ? 2 : 1)).padStart(3, '0');
    const reference = fs.readdirSync(root + '/references').find((f) => f.startsWith(series + '.'));
    const references = [root + '/references/' + reference];
    const castReference = root + '/references/' + series + '-cast.webp';
    if (fs.existsSync(castReference)) references.push(castReference);
    const subjects = chunk
      .map(
        (c, j) =>
          `칸 ${j + 1}의 단어는 '${c.word}'. 뜻 구분: ${c.variant}. 이 단어가 쓰인 실제 본문: ${c.context}. ${c.description}`
      )
      .join('\n');
    jobs.push({
      id: series + '-' + number,
      series,
      cards: chunk.map((c) => c.id),
      prompt:
        base +
        '\n시리즈: ' +
        cfg.title +
        '\n' +
        subjects +
        (chunk.length < 6 ? `\n나머지 ${6 - chunk.length}칸은 크림색 빈칸으로 남깁니다.` : ''),
      references,
      out: root + '/sheets/' + series + '-' + number + '.png',
    });
  }
}
fs.writeFileSync(root + '/cards.json', JSON.stringify(cards, null, 2));
fs.writeFileSync(root + '/jobs.json', JSON.stringify({ version: 1, jobs }, null, 2));
console.log(
  JSON.stringify({
    cards: cards.length,
    sheets: jobs.length,
    links: cards.reduce((n, c) => n + c.uses.length, 0),
    bySeries: Object.fromEntries(
      targets.map(([s]) => [
        s,
        {
          cards: cards.filter((c) => c.series === s).length,
          sheets: jobs.filter((j) => j.series === s).length,
        },
      ])
    ),
  })
);
